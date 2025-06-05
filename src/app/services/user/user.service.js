import { db, auth } from "@/lib/firebase/firebase.config";
import { doc, updateDoc, getDoc, serverTimestamp, query, collection, where, orderBy, getDocs } from "firebase/firestore";
import { updatePassword } from "firebase/auth";

export const userService = {
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
  async getUserPosts(userId) {
    try {
      // LoL과 Valorant 게시글을 모두 조회
      const lolPosts = await this.getUserPostsByGame(userId, 'lol');
      const valorantPosts = await this.getUserPostsByGame(userId, 'valorant');
      
      return [...lolPosts, ...valorantPosts].sort((a, b) => 
        b.createdAt?.toDate() - a.createdAt?.toDate()
      );
    } catch (error) {
      console.error('사용자 게시글 조회 실패:', error);
      throw error;
    }
  },

  async getUserPostsByGame(userId, gameType) {
    try {
      console.log(`🔍 getUserPostsByGame 시작 - userId: ${userId}, gameType: ${gameType}`);
      
      if (!userId) {
        console.log('🔍 userId가 없음, 빈 배열 반환');
        return [];
      }
      
      // 사용자 ID의 다양한 형태 생성
      const possibleIds = new Set([
        userId,
        userId?.toString(),
        // 이메일 형태일 경우 변환
        userId?.includes('@') ? userId.replace(/[^a-zA-Z0-9]/g, '_') : null,
        userId?.includes('@') ? userId.split('@')[0] : null,
        // 구글 OAuth ID 형태 처리
        userId?.startsWith('google-') ? userId : `google-${userId}`,
        // 역순으로도 시도
        userId?.startsWith('google-') ? userId.replace('google-', '') : null,
      ].filter(Boolean));
      
      console.log(`🔍 검색할 ID 목록:`, Array.from(possibleIds));
      
      // 각 ID에 대해 authorId와 authorUid 필드 모두 검색
      const queries = [];
      possibleIds.forEach(id => {
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
  async getUserStats(userId) {
    try {
      const stats = {
        all: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0 },
        lol: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0 },
        valorant: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0 }
      };

      // 작성한 게시글 수 계산
      const lolPosts = await this.getUserPostsByGame(userId, 'lol');
      const valorantPosts = await this.getUserPostsByGame(userId, 'valorant');
      
      stats.lol.posts = lolPosts.length;
      stats.valorant.posts = valorantPosts.length;
      stats.all.posts = lolPosts.length + valorantPosts.length;

      // 댓글 단 게시글 수 계산 (중복 제거)
      const lolCommentedPosts = await this.getUserCommentedPosts(userId, 'lol');
      const valorantCommentedPosts = await this.getUserCommentedPosts(userId, 'valorant');
      
      stats.lol.commentedPosts = lolCommentedPosts.length;
      stats.valorant.commentedPosts = valorantCommentedPosts.length;
      stats.all.commentedPosts = lolCommentedPosts.length + valorantCommentedPosts.length;

      // 투표한 글과 찜한 멘토는 추후 구현 (현재는 0으로 설정)
      // TODO: 투표 시스템과 멘토 찜 기능 구현 후 추가
      
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
  async getUserCommentedPosts(userId, gameType) {
    try {
      // authorId와 authorUid 모두 체크
      const q1 = query(
        collection(db, `${gameType}_comments`),
        where('authorId', '==', userId)
      );
      
      const q2 = query(
        collection(db, `${gameType}_comments`),
        where('authorUid', '==', userId)
      );
      
      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);
      
      const postIds = new Set(); // 중복 제거를 위한 Set 사용
      
      snapshot1.forEach((doc) => {
        const data = doc.data();
        if (data.postId) {
          postIds.add(data.postId);
        }
      });
      
      snapshot2.forEach((doc) => {
        const data = doc.data();
        if (data.postId) {
          postIds.add(data.postId);
        }
      });
      
      return Array.from(postIds);
    } catch (error) {
      console.error(`${gameType} 댓글 단 게시글 조회 실패:`, error);
      return [];
    }
  },

  // 댓글을 단 게시글의 실제 게시글 데이터 가져오기
  async getUserCommentedPostsData(userId, gameType) {
    try {
      const postIds = await this.getUserCommentedPosts(userId, gameType);
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
      // 투표 시스템이 구현되면 실제 데이터를 가져옴
      // 현재는 임시로 빈 배열 반환
      return [];
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
  }
};