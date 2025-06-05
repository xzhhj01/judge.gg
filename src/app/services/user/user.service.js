import { db, auth } from "@/lib/firebase/firebase.config";
import { doc, updateDoc, getDoc, serverTimestamp, query, collection, where, orderBy, getDocs, deleteDoc, setDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth";

export const userService = {
  // 디버깅용 헬퍼 함수 - 실제 저장된 데이터 확인
  async debugUserContent(userId, gameType) {
    try {
      console.log(`🔍 [DEBUG] ${gameType} 컨텐츠 분석 시작 - userId: ${userId}`);
      
      // 모든 게시글 조회해서 authorId 패턴 확인
      const postsSnapshot = await getDocs(collection(db, `${gameType}_posts`));
      console.log(`🔍 [DEBUG] 총 ${postsSnapshot.size}개 게시글 존재`);
      
      const authorIds = new Set();
      postsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.authorId) authorIds.add(data.authorId);
        if (data.authorUid) authorIds.add(data.authorUid);
      });
      
      console.log(`🔍 [DEBUG] 발견된 작성자 ID 패턴들:`, Array.from(authorIds));
      
      // 모든 댓글 조회해서 authorId 패턴 확인
      const commentsSnapshot = await getDocs(collection(db, `${gameType}_comments`));
      console.log(`🔍 [DEBUG] 총 ${commentsSnapshot.size}개 댓글 존재`);
      
      const commentAuthorIds = new Set();
      commentsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.authorId) commentAuthorIds.add(data.authorId);
        if (data.authorUid) commentAuthorIds.add(data.authorUid);
      });
      
      console.log(`🔍 [DEBUG] 발견된 댓글 작성자 ID 패턴들:`, Array.from(commentAuthorIds));
      
      // 현재 사용자 ID와 일치하는 것들 찾기
      const userPosts = [];
      const userComments = [];
      
      postsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.authorId === userId || data.authorUid === userId) {
          userPosts.push({
            id: doc.id,
            title: data.title,
            authorId: data.authorId,
            authorUid: data.authorUid
          });
        }
      });
      
      commentsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.authorId === userId || data.authorUid === userId) {
          userComments.push({
            id: doc.id,
            postId: data.postId,
            authorId: data.authorId,
            authorUid: data.authorUid
          });
        }
      });
      
      console.log(`🔍 [DEBUG] 현재 사용자의 게시글:`, userPosts);
      console.log(`🔍 [DEBUG] 현재 사용자의 댓글:`, userComments);
      
      return {
        totalPosts: postsSnapshot.size,
        totalComments: commentsSnapshot.size,
        allAuthorIds: Array.from(authorIds),
        allCommentAuthorIds: Array.from(commentAuthorIds),
        userPosts,
        userComments
      };
    } catch (error) {
      console.error(`[DEBUG] ${gameType} 컨텐츠 분석 실패:`, error);
      return null;
    }
  },
  // 사용자 프로필 업데이트
  async updateProfile(profileData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }
  },

  // 비밀번호 변경 (Firebase Auth 사용시 재인증 필요)
  async changePassword(currentPassword, newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('구글 로그인 사용자는 비밀번호 변경이 불가능합니다. 구글 계정에서 비밀번호를 변경해주세요.');
      }

      // 현재 비밀번호로 재인증
      const { EmailAuthProvider, reauthenticateWithCredential } = await import('firebase/auth');
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // 재인증 성공 후 비밀번호 업데이트
      await updatePassword(user, newPassword);
      return true;
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      if (error.code === 'auth/wrong-password') {
        throw new Error('현재 비밀번호가 올바르지 않습니다.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('새 비밀번호가 너무 약합니다. 6자 이상 입력해주세요.');
      } else if (error.code === 'auth/requires-recent-login') {
        throw new Error('보안을 위해 다시 로그인 후 비밀번호를 변경해주세요.');
      }
      throw error;
    }
  },

  // Riot ID 연결
  async connectRiotId(riotId, gameType) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const userRef = doc(db, 'users', user.uid);
      const updateData = {};
      
      if (gameType === 'lol') {
        updateData.lolRiotId = riotId;
      } else if (gameType === 'valorant') {
        updateData.valorantRiotId = riotId;
      }
      
      updateData.updatedAt = serverTimestamp();

      await updateDoc(userRef, updateData);
      return true;
    } catch (error) {
      console.error('Riot ID 연결 실패:', error);
      throw error;
    }
  },

  // 사용자의 게시글 조회
  async getUserPosts(userId, userObject = null) {
    try {
      // LoL과 Valorant 게시글을 모두 조회
      const lolPosts = await this.getUserPostsByGame(userId, 'lol', userObject);
      const valorantPosts = await this.getUserPostsByGame(userId, 'valorant', userObject);
      
      return [...lolPosts, ...valorantPosts].sort((a, b) => 
        b.createdAt?.toDate() - a.createdAt?.toDate()
      );
    } catch (error) {
      console.error('사용자 게시글 조회 실패:', error);
      throw error;
    }
  },

  async getUserPostsByGame(userId, gameType, userObject = null) {
    try {
      console.log(`🔍 getUserPostsByGame 시작 - userId: ${userId}, gameType: ${gameType}`);
      
      if (!userId) {
        console.log('🔍 userId가 없음, 빈 배열 반환');
        return [];
      }
      
      // 사용자 ID의 다양한 형태 생성 (사용자 객체가 있으면 이메일도 포함)
      const possibleIds = new Set([
        userId,
        userId?.toString(),
        // 이메일 형태 변환 (기존 로직 유지)
        userId?.includes('@') ? userId.replace(/[^a-zA-Z0-9]/g, '_') : null,
        userId?.includes('@') ? userId.split('@')[0] : null,
      ]);
      
      // 사용자 객체에서 이메일 정보가 있으면 추가 검색 ID 생성
      if (userObject && userObject.email) {
        const email = userObject.email;
        possibleIds.add(email);
        possibleIds.add(email.replace(/[^a-zA-Z0-9]/g, '_'));
        possibleIds.add(email.split('@')[0]);
        console.log(`🔍 사용자 이메일 추가: ${email}`);
      }
      
      // null 값 제거
      const finalIds = Array.from(possibleIds).filter(Boolean);
      
      console.log(`🔍 현재 사용자 ID: ${userId}`);
      console.log(`🔍 사용자 객체 타입 확인:`, {
        hasId: !!userId,
        isNumericString: /^\d+$/.test(userId),
        isEmail: userId?.includes('@'),
        length: userId?.length
      });
      
      console.log(`🔍 검색할 ID 목록:`, finalIds);
      
      // 각 ID에 대해 authorId와 authorUid 필드 모두 검색
      const queries = [];
      finalIds.forEach(id => {
        queries.push(query(collection(db, `${gameType}_posts`), where('authorId', '==', id)));
        queries.push(query(collection(db, `${gameType}_posts`), where('authorUid', '==', id)));
      });
      
      console.log(`🔍 총 ${queries.length}개 쿼리 실행 중 - collection: ${gameType}_posts`);
      
      // 모든 쿼리를 동시에 실행
      const snapshots = await Promise.all(queries.map(async (q) => {
        try {
          return await getDocs(q);
        } catch (error) {
          console.error('🔍 개별 쿼리 실행 오류:', error);
          return { docs: [] }; // 빈 결과 반환
        }
      }));
      
      let totalResults = 0;
      snapshots.forEach((snapshot, index) => {
        const size = snapshot.docs ? snapshot.docs.length : snapshot.size || 0;
        console.log(`🔍 쿼리 ${index + 1} 결과: ${size}개`);
        totalResults += size;
      });
      
      console.log(`🔍 총 쿼리 결과 합계: ${totalResults}개`);
      
      const posts = [];
      const postIds = new Set(); // 중복 제거용
      
      // 모든 쿼리 결과 처리
      snapshots.forEach((snapshot, index) => {
        const docs = snapshot.docs || [];
        docs.forEach((doc) => {
          if (!postIds.has(doc.id)) {
            const postData = doc.data();
            console.log(`🔍 찾은 게시글 #${posts.length + 1}:`, {
              id: doc.id,
              title: postData.title?.substring(0, 30) + '...',
              authorId: postData.authorId,
              authorUid: postData.authorUid,
              authorName: postData.authorName,
              createdAt: postData.createdAt
            });
            
            posts.push({
              id: doc.id,
              gameType,
              ...postData
            });
            postIds.add(doc.id);
          }
        });
      });
      
      // 클라이언트에서 정렬 (최신순)
      posts.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
      
      console.log(`🔍 최종 결과 - ${gameType} 게시글 ${posts.length}개`);
      if (posts.length > 0) {
        console.log("🔍 첫 번째 게시글 샘플:", {
          id: posts[0].id,
          title: posts[0].title,
          authorId: posts[0].authorId,
          gameType: posts[0].gameType
        });
      }
      
      return posts;
    } catch (error) {
      console.error(`${gameType} 게시글 조회 실패:`, error);
      return [];
    }
  },

  // 사용자 정보 조회
  async getUserInfo(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      }
      return null;
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      throw error;
    }
  },

  // 사용자 통계 조회
  async getUserStats(userId, userObject = null) {
    try {
      console.log(`🔍 getUserStats 시작 - userId: ${userId}`);
      
      const stats = {
        all: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0 },
        lol: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0 },
        valorant: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0 }
      };

      // 작성한 게시글 수 계산 (사용자 객체 정보 전달)
      const lolPosts = await this.getUserPostsByGame(userId, 'lol', userObject);
      const valorantPosts = await this.getUserPostsByGame(userId, 'valorant', userObject);
      
      console.log(`🔍 통계 계산 - LoL 게시글: ${lolPosts.length}개, Valorant 게시글: ${valorantPosts.length}개`);
      
      stats.lol.posts = lolPosts.length;
      stats.valorant.posts = valorantPosts.length;
      stats.all.posts = lolPosts.length + valorantPosts.length;

      // 댓글 단 게시글 수 계산 (중복 제거)
      const lolCommentedPosts = await this.getUserCommentedPosts(userId, 'lol', userObject);
      const valorantCommentedPosts = await this.getUserCommentedPosts(userId, 'valorant', userObject);
      
      console.log(`🔍 통계 계산 - LoL 댓글: ${lolCommentedPosts.length}개, Valorant 댓글: ${valorantCommentedPosts.length}개`);
      
      stats.lol.commentedPosts = lolCommentedPosts.length;
      stats.valorant.commentedPosts = valorantCommentedPosts.length;
      stats.all.commentedPosts = lolCommentedPosts.length + valorantCommentedPosts.length;

      // 투표한 게시글 수 계산
      const lolVotedPosts = await this.getUserVotedPosts(userId, 'lol');
      const valorantVotedPosts = await this.getUserVotedPosts(userId, 'valorant');
      
      console.log(`🔍 통계 계산 - LoL 투표: ${lolVotedPosts.length}개, Valorant 투표: ${valorantVotedPosts.length}개`);
      
      stats.lol.votedPosts = lolVotedPosts.length;
      stats.valorant.votedPosts = valorantVotedPosts.length;
      stats.all.votedPosts = lolVotedPosts.length + valorantVotedPosts.length;

      // 찜한 멘토 수 계산
      const likedMentorsCount = await this.getUserLikedMentorsCount(userId);
      stats.lol.likedMentors = likedMentorsCount;
      stats.valorant.likedMentors = likedMentorsCount;
      stats.all.likedMentors = likedMentorsCount;
      
      console.log(`🔍 최종 통계:`, stats);
      return stats;
    } catch (error) {
      console.error('사용자 통계 조회 실패:', error);
      return {
        all: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0 },
        lol: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0 },
        valorant: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0 }
      };
    }
  },

  // 댓글을 단 게시글 목록 (중복 제거)
  async getUserCommentedPosts(userId, gameType, userObject = null) {
    try {
      console.log(`🔍 getUserCommentedPosts 시작 - userId: ${userId}, gameType: ${gameType}`);
      
      if (!userId) {
        console.log('🔍 userId가 없음, 빈 배열 반환');
        return [];
      }
      
      // 사용자 ID의 다양한 형태 생성 (게시글 검색과 동일한 로직)
      const possibleIds = new Set([
        userId,
        userId?.toString(),
        // 이메일 형태일 경우 변환 (Firebase Auth의 경우)
        userId?.includes('@') ? userId.replace(/[^a-zA-Z0-9]/g, '_') : null,
        userId?.includes('@') ? userId.split('@')[0] : null,
      ]);
      
      // 사용자 객체에서 이메일 정보가 있으면 추가 검색 ID 생성
      if (userObject && userObject.email) {
        const email = userObject.email;
        possibleIds.add(email);
        possibleIds.add(email.replace(/[^a-zA-Z0-9]/g, '_'));
        possibleIds.add(email.split('@')[0]);
        console.log(`🔍 댓글용 사용자 이메일 추가: ${email}`);
      }
      
      // null 값 제거
      const finalIds = Array.from(possibleIds).filter(Boolean);
      
      console.log(`🔍 댓글 검색할 ID 목록:`, finalIds);
      
      // 각 ID에 대해 authorId와 authorUid 필드 모두 검색
      const queries = [];
      finalIds.forEach(id => {
        queries.push(query(collection(db, `${gameType}_comments`), where('authorId', '==', id)));
        queries.push(query(collection(db, `${gameType}_comments`), where('authorUid', '==', id)));
      });
      
      console.log(`🔍 총 ${queries.length}개 댓글 쿼리 실행 중 - collection: ${gameType}_comments`);
      
      // 모든 쿼리를 동시에 실행
      const snapshots = await Promise.all(queries.map(async (q) => {
        try {
          return await getDocs(q);
        } catch (error) {
          console.error('🔍 개별 댓글 쿼리 실행 오류:', error);
          return { docs: [] }; // 빈 결과 반환
        }
      }));
      
      let totalResults = 0;
      snapshots.forEach((snapshot, index) => {
        const size = snapshot.docs ? snapshot.docs.length : snapshot.size || 0;
        console.log(`🔍 댓글 쿼리 ${index + 1} 결과: ${size}개`);
        totalResults += size;
      });
      
      console.log(`🔍 총 댓글 쿼리 결과 합계: ${totalResults}개`);
      
      const postIds = new Set(); // 중복 제거를 위한 Set 사용
      
      // 모든 쿼리 결과 처리
      snapshots.forEach((snapshot, index) => {
        const docs = snapshot.docs || [];
        docs.forEach((doc) => {
          const data = doc.data();
          if (data.postId) {
            console.log(`🔍 찾은 댓글 #${postIds.size + 1}:`, {
              commentId: doc.id,
              postId: data.postId,
              authorId: data.authorId,
              authorUid: data.authorUid,
              content: data.content?.substring(0, 30) + '...'
            });
            postIds.add(data.postId);
          }
        });
      });
      
      console.log(`🔍 최종 댓글 단 게시글 - ${gameType} ${postIds.size}개`);
      return Array.from(postIds);
    } catch (error) {
      console.error(`${gameType} 댓글 단 게시글 조회 실패:`, error);
      return [];
    }
  },

  // 댓글을 단 게시글의 실제 게시글 데이터 가져오기
  async getUserCommentedPostsData(userId, gameType, userObject = null) {
    try {
      const postIds = await this.getUserCommentedPosts(userId, gameType, userObject);
      const posts = [];
      
      for (const postId of postIds) {
        try {
          const postRef = doc(db, `${gameType}_posts`, postId);
          const postSnap = await getDoc(postRef);
          
          if (postSnap.exists()) {
            posts.push({
              id: postSnap.id,
              gameType,
              ...postSnap.data()
            });
          }
        } catch (error) {
          console.error(`게시글 ${postId} 조회 실패:`, error);
        }
      }
      
      // 최신순으로 정렬
      posts.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
      
      return posts;
    } catch (error) {
      console.error(`${gameType} 댓글 단 게시글 데이터 조회 실패:`, error);
      return [];
    }
  },

  // 좋아요/투표한 게시글 목록
  async getUserVotedPosts(userId, gameType) {
    try {
      console.log(`🔍 getUserVotedPosts 시작 - userId: ${userId}, gameType: ${gameType}`);
      
      if (!userId) {
        console.log('🔍 userId가 없음, 빈 배열 반환');
        return [];
      }
      
      // 투표 기록에서 사용자의 투표한 게시글 ID 목록 가져오기
      const q = query(
        collection(db, `${gameType}_post_votes`),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const postIds = new Set(); // 중복 제거를 위한 Set 사용
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.postId) {
          postIds.add(data.postId);
        }
      });
      
      console.log(`🔍 ${gameType} 투표한 게시글 ${postIds.size}개 발견`);
      return Array.from(postIds);
    } catch (error) {
      console.error(`${gameType} 투표한 게시글 조회 실패:`, error);
      return [];
    }
  },

  // 좋아요/투표한 게시글의 실제 게시글 데이터 가져오기
  async getUserVotedPostsData(userId, gameType) {
    try {
      // 투표 시스템이 구현되면 실제 데이터를 가져옴
      // 현재는 임시로 빈 배열 반환
      const postIds = await this.getUserVotedPosts(userId, gameType);
      const posts = [];
      
      for (const postId of postIds) {
        try {
          const postRef = doc(db, `${gameType}_posts`, postId);
          const postSnap = await getDoc(postRef);
          
          if (postSnap.exists()) {
            posts.push({
              id: postSnap.id,
              gameType,
              ...postSnap.data()
            });
          }
        } catch (error) {
          console.error(`게시글 ${postId} 조회 실패:`, error);
        }
      }
      
      // 최신순으로 정렬
      posts.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
      
      return posts;
    } catch (error) {
      console.error(`${gameType} 투표한 게시글 데이터 조회 실패:`, error);
      return [];
    }
  },

  // 찜한 멘토 추가
  async addLikedMentor(userId, mentorId) {
    try {
      const likedMentorRef = doc(db, `liked_mentors`, `${userId}_${mentorId}`);
      await setDoc(likedMentorRef, {
        userId: userId,
        mentorId: mentorId,
        createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('찜한 멘토 추가 실패:', error);
      throw error;
    }
  },

  // 찜한 멘토 제거
  async removeLikedMentor(userId, mentorId) {
    try {
      const likedMentorRef = doc(db, `liked_mentors`, `${userId}_${mentorId}`);
      await deleteDoc(likedMentorRef);
      return true;
    } catch (error) {
      console.error('찜한 멘토 제거 실패:', error);
      throw error;
    }
  },

  // 찜한 멘토 확인
  async isLikedMentor(userId, mentorId) {
    try {
      const likedMentorRef = doc(db, `liked_mentors`, `${userId}_${mentorId}`);
      const docSnap = await getDoc(likedMentorRef);
      return docSnap.exists();
    } catch (error) {
      console.error('찜한 멘토 확인 실패:', error);
      return false;
    }
  },

  // 찜한 멘토 목록 조회
  async getUserLikedMentors(userId) {
    try {
      const q = query(
        collection(db, 'liked_mentors'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const mentorData = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.mentorId) {
          mentorData.push({
            mentorId: data.mentorId,
            createdAt: data.createdAt
          });
        }
      });
      
      // 클라이언트에서 정렬 (최신순)
      mentorData.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      return mentorData.map(item => item.mentorId);
    } catch (error) {
      console.error('찜한 멘토 목록 조회 실패:', error);
      return [];
    }
  },

  // 찜한 멘토 수 조회
  async getUserLikedMentorsCount(userId) {
    try {
      const mentorIds = await this.getUserLikedMentors(userId);
      return mentorIds.length;
    } catch (error) {
      console.error('찜한 멘토 수 조회 실패:', error);
      return 0;
    }
  },

  // 찜한 멘토의 상세 정보 조회
  async getUserLikedMentorsData(userId) {
    try {
      const mentorIds = await this.getUserLikedMentors(userId);
      const mentors = [];
      
      for (const mentorId of mentorIds) {
        try {
          const mentorRef = doc(db, 'mentors', mentorId);
          const mentorSnap = await getDoc(mentorRef);
          
          if (mentorSnap.exists()) {
            mentors.push({
              id: mentorSnap.id,
              ...mentorSnap.data()
            });
          }
        } catch (error) {
          console.error(`멘토 ${mentorId} 정보 조회 실패:`, error);
        }
      }
      
      return mentors;
    } catch (error) {
      console.error('찜한 멘토 상세 정보 조회 실패:', error);
      return [];
    }
  },

  // 사용자가 신청한 피드백 목록 조회
  async getUserRequestedFeedbacks(userId) {
    try {
      const q = query(
        collection(db, 'feedback_requests'),
        where('userId', '==', userId)
      );
      
      const snapshot = await getDocs(q);
      const feedbacks = [];
      
      snapshot.forEach((doc) => {
        feedbacks.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 클라이언트에서 날짜순 정렬 (최신순)
      feedbacks.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      return feedbacks;
    } catch (error) {
      console.error('신청한 피드백 목록 조회 실패:', error);
      return [];
    }
  },

  // 멘토가 받은 피드백 요청 목록 조회
  async getMentorReceivedFeedbacks(mentorId) {
    try {
      const q = query(
        collection(db, 'feedback_requests'),
        where('mentorId', '==', mentorId)
      );
      
      const snapshot = await getDocs(q);
      const feedbacks = [];
      
      snapshot.forEach((doc) => {
        feedbacks.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 클라이언트에서 날짜순 정렬 (최신순)
      feedbacks.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      return feedbacks;
    } catch (error) {
      console.error('받은 피드백 요청 목록 조회 실패:', error);
      return [];
    }
  }
};