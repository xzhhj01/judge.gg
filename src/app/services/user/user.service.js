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

  // 비밀번호 변경 (Firebase Auth 사용시 이메일로 재설정)
  async changePassword(newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      // Firebase Auth에서 비밀번호 업데이트
      await updatePassword(user, newPassword);
      return true;
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
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
      // orderBy를 제거하고 클라이언트에서 정렬
      const q = query(
        collection(db, `${gameType}_posts`),
        where('authorId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const posts = [];
      
      querySnapshot.forEach((doc) => {
        posts.push({
          id: doc.id,
          gameType,
          ...doc.data()
        });
      });
      
      // 클라이언트에서 정렬
      posts.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
      
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
      const q = query(
        collection(db, `${gameType}_comments`),
        where('authorId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const postIds = new Set(); // 중복 제거를 위한 Set 사용
      
      querySnapshot.forEach((doc) => {
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
  }
};