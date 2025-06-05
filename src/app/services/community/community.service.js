import { db, storage, auth } from "@/lib/firebase/firebase.config";
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  startAfter,
  serverTimestamp,
  updateDoc,
  deleteDoc 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const communityService = {
  // 투표 옵션 유효성 검사
  validateVoteOptions(voteOptions) {
    if (!voteOptions || !Array.isArray(voteOptions)) {
      return false;
    }
    
    if (voteOptions.length < 2) {
      return false;
    }
    
    // 첫 번째와 두 번째 옵션이 모두 비어있지 않은 문자열인지 확인
    const option1 = voteOptions[0];
    const option2 = voteOptions[1];
    
    return (
      typeof option1 === 'string' && option1.trim().length > 0 &&
      typeof option2 === 'string' && option2.trim().length > 0
    );
  },

  // 일관된 사용자 ID 생성
  generateConsistentUserId(user) {
    if (!user) return null;
    
    // NextAuth 사용자 (Google OAuth)
    if (user.id) {
      return user.id;
    }
    
    // Firebase 사용자
    if (user.uid) {
      return user.uid;
    }
    
    // 이메일만 있는 경우 (fallback)
    if (user.email) {
      return user.email;
    }
    
    return null;
  },
  // 게시글 목록 조회
  async getPosts(gameType, tags = [], searchQuery = '', page = 1, limit = 10, sortBy = 'recent') {
    try {
      let q = collection(db, `${gameType}_posts`);
      
      // Firestore 복합 쿼리 제한으로 인해 단순화
      // 먼저 모든 게시글을 가져온 후 클라이언트에서 필터링
      q = query(q, firestoreLimit(limit * 3)); // 여유분을 두고 가져옴
      
      const querySnapshot = await getDocs(q);
      let posts = [];
      
      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 클라이언트에서 필터링
      if (tags.length > 0) {
        posts = posts.filter(post => 
          post.tags && post.tags.some(tag => tags.includes(tag))
        );
      }
      
      // 검색 쿼리 필터링
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        posts = posts.filter(post => 
          (post.title && post.title.toLowerCase().includes(query)) ||
          (post.content && post.content.toLowerCase().includes(query))
        );
      }
      
      // 정렬 처리
      posts = this.sortPosts(posts, sortBy);
      
      // 제한된 수만큼 반환
      posts = posts.slice(0, limit);
      
      return {
        posts,
        total: posts.length,
        page,
        limit
      };
    } catch (error) {
      console.error(`${gameType} 게시글 조회 실패:`, error);
      return {
        posts: [],
        total: 0,
        page,
        limit
      };
    }
  },

  // 게시글 정렬 로직
  sortPosts(posts, sortBy) {
    return posts.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          // 인기도 계산: 조회수(30%) + 좋아요(40%) + 댓글수(30%)
          const scoreA = (a.views || 0) * 0.3 + (a.likes || 0) * 0.4 + (a.commentCount || 0) * 0.3;
          const scoreB = (b.views || 0) * 0.3 + (b.likes || 0) * 0.4 + (b.commentCount || 0) * 0.3;
          return scoreB - scoreA;
        case 'recent':
        default:
          // 최신순
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
      }
    });
  },

  // 게시글 작성
  async createPost(gameType, postData, user = null) {
    try {
      // 사용자 정보 확인 (NextAuth 세션 우선)
      let currentUser = user;
      if (!currentUser) {
        currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('로그인이 필요합니다.');
        }
      }

      // 비디오 파일 업로드 처리
      let videoUrl = null;
      if (postData.videoFile) {
        videoUrl = await this.uploadVideo(postData.videoFile);
      }

      // 사용자 ID 일관성 유지 (NextAuth 세션 우선)
      const userId = this.generateConsistentUserId(currentUser);
      const userName = currentUser.name || currentUser.displayName || currentUser.email;
      const userPhoto = currentUser.image || currentUser.photoURL || null;
      
      console.log('🔍 게시글 작성 - 사용자 정보:', {
        currentUser,
        userId,
        userName,
        userPhoto,
        authMethod: currentUser.id ? 'NextAuth' : 'Firebase'
      });

      const docData = {
        title: postData.title,
        content: postData.content,
        tags: postData.tags || [],
        authorId: userId,
        authorUid: userId, // 동일한 값으로 두 필드 모두 저장
        authorName: userName,
        authorPhoto: userPhoto,
        videoUrl,
        // 투표 관련 필드 추가
        voteOptions: this.validateVoteOptions(postData.voteOptions) ? postData.voteOptions : null,
        allowNeutral: postData.allowNeutral || false,
        voteDeadline: postData.voteDeadline || null,
        voteResults: this.validateVoteOptions(postData.voteOptions) 
          ? new Array(postData.voteOptions.length).fill(0).concat(postData.allowNeutral ? [0] : [])
          : null,
        totalVotes: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        likes: 0,
        views: 0,
        commentCount: 0
      };

      const docRef = await addDoc(collection(db, `${gameType}_posts`), docData);
      
      return {
        id: docRef.id,
        ...docData
      };
    } catch (error) {
      console.error(`${gameType} 게시글 작성 실패:`, error);
      throw error;
    }
  },

  // 비디오 업로드
  async uploadVideo(videoFile) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const timestamp = Date.now();
      const fileName = `videos/${user.uid}/${timestamp}_${videoFile.name}`;
      const storageRef = ref(storage, fileName);
      
      const snapshot = await uploadBytes(storageRef, videoFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('비디오 업로드 실패:', error);
      throw error;
    }
  },

  // 개별 게시글 조회
  async getPostById(gameType, postId) {
    try {
      const docRef = doc(db, `${gameType}_posts`, postId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          views: (docSnap.data().views || 0) + 1
        });
        
        return {
          id: docSnap.id,
          ...docSnap.data(),
          views: (docSnap.data().views || 0) + 1
        };
      } else {
        throw new Error('게시글을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error(`${gameType} 게시글 조회 실패:`, error);
      throw error;
    }
  },

  // 게시글 수정
  async updatePost(gameType, postId, postData, user = null) {
    try {
      // 사용자 정보 확인 (NextAuth 세션 우선)
      let currentUser = user;
      if (!currentUser) {
        currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('로그인이 필요합니다. 페이지를 새로고침하거나 다시 로그인해주세요.');
        }
      }

      const docRef = doc(db, `${gameType}_posts`, postId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }
      
      // 사용자 ID 확인 (NextAuth uid 또는 Firebase uid)
      const userId = this.generateConsistentUserId(currentUser);
      const postAuthorId = docSnap.data().authorId;
      
      console.log('사용자 ID 비교:', {
        currentUserId: userId,
        postAuthorId: postAuthorId,
        currentUser: currentUser
      });
      
      // 엄격한 사용자 ID 매칭
      const isAuthor = postAuthorId === userId || 
                      postAuthorId === currentUser.email?.replace(/[^a-zA-Z0-9]/g, '_') ||
                      postAuthorId === currentUser.email ||
                      postAuthorId === currentUser.uid ||
                      postAuthorId === currentUser.id;
      
      if (!isAuthor) {
        throw new Error(`수정 권한이 없습니다. 본인이 작성한 글만 수정할 수 있습니다.`);
      }
      
      console.log('권한 확인 완료:', { isAuthor, email: currentUser.email });

      const updateData = {
        title: postData.title,
        content: postData.content,
        tags: postData.tags || [],
        updatedAt: serverTimestamp()
      };

      // 새 비디오 파일이 있으면 업로드
      if (postData.videoFile) {
        updateData.videoUrl = await this.uploadVideo(postData.videoFile);
      }

      await updateDoc(docRef, updateData);
      
      return {
        id: postId,
        ...updateData
      };
    } catch (error) {
      console.error(`${gameType} 게시글 수정 실패:`, error);
      if (error.code === 'auth/user-cancelled') {
        throw new Error('인증이 취소되었습니다. 다시 로그인해주세요.');
      }
      throw error;
    }
  },

  // 게시글 삭제
  async deletePost(gameType, postId, user = null) {
    try {
      // 사용자 정보 확인 (NextAuth 세션 우선)
      let currentUser = user;
      if (!currentUser) {
        currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('로그인이 필요합니다.');
        }
      }

      const docRef = doc(db, `${gameType}_posts`, postId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }
      
      // 사용자 ID 확인 (NextAuth uid 또는 Firebase uid)
      const userId = this.generateConsistentUserId(currentUser);
      const postAuthorId = docSnap.data().authorId;
      
      // 엄격한 사용자 ID 매칭
      const isAuthor = postAuthorId === userId || 
                      postAuthorId === currentUser.email?.replace(/[^a-zA-Z0-9]/g, '_') ||
                      postAuthorId === currentUser.email ||
                      postAuthorId === currentUser.uid ||
                      postAuthorId === currentUser.id;
      
      if (!isAuthor) {
        throw new Error(`삭제 권한이 없습니다. 본인이 작성한 글만 삭제할 수 있습니다.`);
      }

      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`${gameType} 게시글 삭제 실패:`, error);
      throw error;
    }
  },

  // 댓글 추가
  async addComment(gameType, postId, commentText, sessionUser = null) {
    try {
      // NextAuth 세션 사용자 우선
      let currentUser = sessionUser;
      if (!currentUser) {
        currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('로그인이 필요합니다.');
        }
      }

      const userId = this.generateConsistentUserId(currentUser);
      const userName = currentUser.name || currentUser.displayName || currentUser.email;
      const userPhoto = currentUser.image || currentUser.photoURL || null;

      const commentData = {
        postId,
        content: commentText,
        authorId: userId,
        authorUid: userId, // 동일한 값으로 두 필드 모두 저장
        authorName: userName,
        authorPhoto: userPhoto,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, `${gameType}_comments`), commentData);
      
      // 게시글의 댓글 수 증가
      const postRef = doc(db, `${gameType}_posts`, postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        await updateDoc(postRef, {
          commentCount: (postSnap.data().commentCount || 0) + 1
        });
      }

      return {
        id: docRef.id,
        ...commentData
      };
    } catch (error) {
      console.error('댓글 추가 실패:', error);
      throw error;
    }
  },

  // 댓글 조회
  async getComments(gameType, postId) {
    try {
      const q = query(
        collection(db, `${gameType}_comments`),
        where('postId', '==', postId)
      );
      
      const querySnapshot = await getDocs(q);
      const comments = [];
      
      querySnapshot.forEach((doc) => {
        comments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 클라이언트에서 정렬 (오래된 순)
      comments.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateA - dateB;
      });
      
      return comments;
    } catch (error) {
      console.error('댓글 조회 실패:', error);
      throw error;
    }
  },

  // 게시글 좋아요
  async likePost(gameType, postId) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const postRef = doc(db, `${gameType}_posts`, postId);
      const postSnap = await getDoc(postRef);
      
      if (postSnap.exists()) {
        await updateDoc(postRef, {
          likes: (postSnap.data().likes || 0) + 1
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('좋아요 실패:', error);
      throw error;
    }
  },

  // 사용자의 게시글 조회
  async getUserPosts(gameType, userId, limit = 5) {
    try {
      if (!userId) {
        return { posts: [], total: 0 };
      }

      // Firestore에서 사용자의 게시글 조회 (orderBy 제거하여 인덱스 요구사항 회피)
      const q = query(
        collection(db, `${gameType}_posts`),
        where('authorId', '==', userId),
        firestoreLimit(limit * 2) // 정렬을 위해 더 많이 가져오기
      );
      
      const querySnapshot = await getDocs(q);
      const posts = [];
      
      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // 클라이언트에서 정렬 (최신순)
      posts.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });

      // 제한된 수만큼 반환
      const limitedPosts = posts.slice(0, limit);


      return {
        posts: limitedPosts,
        total: limitedPosts.length
      };
    } catch (error) {
      console.error(`${gameType} 사용자 게시글 조회 실패:`, error);
      return { posts: [], total: 0 };
    }
  },

  // 모든 게임의 사용자 게시글 조회
  async getAllUserPosts(userId, limit = 10) {
    try {
      if (!userId) {
        return { posts: [], total: 0 };
      }

      const gameTypes = ['lol', 'valorant'];
      const allPosts = [];

      for (const gameType of gameTypes) {
        try {
          const q = query(
            collection(db, `${gameType}_posts`),
            where('authorId', '==', userId),
            firestoreLimit(limit * 2) // 정렬을 위해 더 많이 가져오기
          );
          
          const querySnapshot = await getDocs(q);
          
          querySnapshot.forEach((doc) => {
            allPosts.push({
              id: doc.id,
              gameType: gameType,
              ...doc.data()
            });
          });
        } catch (error) {
          console.error(`${gameType} 사용자 게시글 조회 실패:`, error);
        }
      }

      // 생성 시간순으로 정렬
      allPosts.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });

      // 제한된 수만큼 반환
      const limitedPosts = allPosts.slice(0, limit);


      return {
        posts: limitedPosts,
        total: limitedPosts.length
      };
    } catch (error) {
      console.error('전체 사용자 게시글 조회 실패:', error);
      return { posts: [], total: 0 };
    }
  },

  // 분쟁 활발 게시물 조회 (댓글 수 + 투표 수 기반)
  async getControversialPosts(gameType, limit = 3) {
    try {
      const q = query(
        collection(db, `${gameType}_posts`),
        firestoreLimit(limit * 3) // 여유분을 두고 가져옴
      );
      
      const querySnapshot = await getDocs(q);
      const posts = [];
      
      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // 분쟁 점수 계산 (댓글 수 40% + 투표 수 30% + 조회수 30%)
      const scoredPosts = posts.map(post => {
        const commentScore = (post.commentCount || 0) * 0.4;
        const voteScore = (post.likes || 0) * 0.3;
        const viewScore = (post.views || 0) * 0.3;
        const controversyScore = commentScore + voteScore + viewScore;
        
        return {
          ...post,
          controversyScore
        };
      });

      // 분쟁 점수순으로 정렬
      scoredPosts.sort((a, b) => b.controversyScore - a.controversyScore);
      
      return scoredPosts.slice(0, limit);
    } catch (error) {
      console.error(`${gameType} 분쟁 활발 게시물 조회 실패:`, error);
      return [];
    }
  },

  // 게시글 투표 (좋아요/싫어요 또는 커스텀 투표)
  async votePost(gameType, postId, voteType, sessionUser = null) {
    try {
      // NextAuth 세션 사용자 우선
      let currentUser = sessionUser;
      if (!currentUser) {
        currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('로그인이 필요합니다.');
        }
      }

      const postRef = doc(db, `${gameType}_posts`, postId);
      const postSnap = await getDoc(postRef);
      
      if (!postSnap.exists()) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }

      const currentData = postSnap.data();
      
      // 커스텀 투표 옵션이 있는 경우
      if (this.validateVoteOptions(currentData.voteOptions)) {
        const voteResults = currentData.voteResults || new Array(currentData.voteOptions.length).fill(0);
        const totalVotes = currentData.totalVotes || 0;
        
        if (voteType.startsWith('option_')) {
          const optionIndex = parseInt(voteType.split('_')[1]);
          if (optionIndex >= 0 && optionIndex < voteResults.length) {
            voteResults[optionIndex] += 1;
          }
        } else if (voteType === 'neutral' && currentData.allowNeutral) {
          // 중립 투표는 배열의 마지막 인덱스
          voteResults[voteResults.length - 1] += 1;
        }
        
        await updateDoc(postRef, {
          voteResults: voteResults,
          totalVotes: totalVotes + 1
        });
      } else {
        // 기본 좋아요/싫어요 투표
        const currentLikes = currentData.likes || 0;
        const currentDislikes = currentData.dislikes || 0;

        if (voteType === 'like') {
          await updateDoc(postRef, {
            likes: currentLikes + 1
          });
        } else if (voteType === 'dislike') {
          await updateDoc(postRef, {
            dislikes: currentDislikes + 1
          });
        }
      }

      return true;
    } catch (error) {
      console.error('투표 실패:', error);
      throw error;
    }
  },

  // 댓글에 투표
  async voteComment(gameType, commentId, voteType, sessionUser = null) {
    try {
      // NextAuth 세션 사용자 우선
      let currentUser = sessionUser;
      if (!currentUser) {
        currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('로그인이 필요합니다.');
        }
      }

      const userId = this.generateConsistentUserId(currentUser);

      const commentRef = doc(db, `${gameType}_comments`, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('댓글을 찾을 수 없습니다.');
      }

      const currentData = commentSnap.data();
      const currentLikes = currentData.likes || 0;

      if (voteType === 'like') {
        await updateDoc(commentRef, {
          likes: currentLikes + 1
        });
      }

      return true;
    } catch (error) {
      console.error('댓글 투표 실패:', error);
      throw error;
    }
  }
};