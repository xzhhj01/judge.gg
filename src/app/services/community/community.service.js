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
  deleteDoc,
  setDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const communityService = {
  // 사용자 랭크 정보 캐시 (세션 동안 유지)
  _userTierCache: new Map(),
  
  // 캐시 무효화 함수
  clearTierCache(userId, gameType) {
    if (userId && gameType) {
      const cacheKey = `${userId}_${gameType}`;
      this._userTierCache.delete(cacheKey);
      console.log(`🎮 캐시 무효화 - ${cacheKey}`);
    }
  },
  
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

  // 게시글 목록에 사용자 랭크 정보 추가
  async enrichPostsWithUserTiers(posts, gameType) {
    try {
      // 각 게시글의 authorTier가 없는 경우 동적으로 조회
      const enrichedPosts = await Promise.all(posts.map(async (post) => {
        if (post.authorTier && post.authorTier !== 'Unranked') {
          // 이미 랭크 정보가 있으면 그대로 사용
          return post;
        }
        
        try {
          // 작성자의 랭크 정보 조회
          const userTier = await this.getUserTierInfo(post.authorId, gameType);
          return {
            ...post,
            authorTier: userTier
          };
        } catch (error) {
          console.error(`게시글 ${post.id} 작성자 랭크 조회 실패:`, error);
          return {
            ...post,
            authorTier: post.authorTier || 'Unranked'
          };
        }
      }));
      
      return enrichedPosts;
    } catch (error) {
      console.error('게시글 랭크 정보 보완 실패:', error);
      return posts;
    }
  },

  // 특정 사용자의 게임별 랭크 정보 조회 (실시간 API 사용)
  async getUserTierInfo(userId, gameType, sessionUser = null) {
    try {
      if (!userId) {
        console.log('🎮 getUserTierInfo: userId가 없음');
        return 'Unranked';
      }
      
      console.log(`🎮 getUserTierInfo 시작 - userId: "${userId}", gameType: "${gameType}"`);
      
      // 캐시 키 생성
      const cacheKey = `${userId}_${gameType}`;
      
      // 캐시에서 먼저 확인 (1분간 캐시 - 매우 짧게 하여 최신 정보 보장)
      const cached = this._userTierCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < 1 * 60 * 1000)) {
        console.log(`🎮 캐시에서 티어 반환 - userId: ${userId}, tier: ${cached.tier}`);
        return cached.tier;
      }
      
      // Firebase에서 사용자 정보 조회
      let userData = null;
      let foundUser = false;
      
      // 첫 번째 시도: 정확한 userId로 검색
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        userData = userSnap.data();
        foundUser = true;
        console.log(`🎮 사용자 문서 발견 (정확한 ID) - userId: ${userId}`);
      } else {
        console.log(`🎮 정확한 userId로 사용자 문서를 찾을 수 없음 - userId: ${userId}`);
        
        // 두 번째 시도: sessionUser의 이메일로 검색
        if (sessionUser?.email) {
          console.log(`🎮 이메일로 사용자 검색 시도 - email: ${sessionUser.email}`);
          const emailUserRef = doc(db, 'users', sessionUser.email);
          const emailUserSnap = await getDoc(emailUserRef);
          
          if (emailUserSnap.exists()) {
            userData = emailUserSnap.data();
            foundUser = true;
            console.log(`🎮 사용자 문서 발견 (이메일) - email: ${sessionUser.email}`);
          }
        }
      }
      
      if (!foundUser) {
        console.log(`🎮 사용자 문서를 찾을 수 없음 - userId: ${userId}`);
        const tier = 'Unranked';
        this._userTierCache.set(cacheKey, { tier, timestamp: Date.now() });
        return tier;
      }
      let tier = 'Unranked';
      
      console.log(`🎮 사용자 데이터 확인 - userId: ${userId}`, {
        lolVerified: userData.lolVerified,
        valorantVerified: userData.valorantVerified,
        hasLolPuuid: !!userData.lolPuuid,
        hasValorantData: !!userData.valorantVerified
      });
      
      if (gameType === 'lol') {
        // LoL 연동이 되어 있으면 실시간 API로 티어 조회
        if (userData.lolVerified && userData.lolPuuid) {
          try {
            console.log(`🎮 LoL 실시간 티어 조회 시작 - userId: ${userId}, puuid: ${userData.lolPuuid}`);
            
            // Riot API를 직접 호출하여 실시간 티어 조회
            const tierResponse = await fetch(`/api/riot/lol?puuid=${userData.lolPuuid}&tierOnly=true`);
            
            if (tierResponse.ok) {
              const tierData = await tierResponse.json();
              
              console.log(`🎮 LoL API 응답 - userId: ${userId}:`, tierData);
              
              if (tierData.verified && tierData.ranks?.solo) {
                const soloRank = tierData.ranks.solo;
                tier = `${soloRank.tier} ${soloRank.rank}`;
                console.log(`🎮 LoL 실시간 티어 조회 성공 - userId: ${userId}, tier: ${tier}`);
              } else {
                console.log(`🎮 LoL 실시간 티어 조회 실패 또는 솔로랭크 없음 - userId: ${userId}`, tierData);
              }
            } else {
              console.log(`🎮 LoL API 호출 실패 - userId: ${userId}, status: ${tierResponse.status}`);
            }
          } catch (apiError) {
            console.error(`🎮 LoL 실시간 티어 조회 오류 - userId: ${userId}:`, apiError);
            // API 실패 시 Firebase에 저장된 정적 데이터 사용 (fallback)
            if (userData.lolProfileData?.ranks?.solo) {
              const soloRank = userData.lolProfileData.ranks.solo;
              tier = `${soloRank.tier} ${soloRank.rank}`;
              console.log(`🎮 LoL 정적 데이터 fallback - userId: ${userId}, tier: ${tier}`);
            }
          }
        } else {
          console.log(`🎮 LoL 연동되지 않음 - userId: ${userId}, verified: ${userData.lolVerified}, hasPuuid: ${!!userData.lolPuuid}`);
        }
      } else if (gameType === 'valorant') {
        // Valorant 연동이 되어 있으면 Firebase 데이터 사용 (실시간 API 없음)
        if (userData.valorantVerified && userData.valorantProfileData) {
          if (userData.valorantProfileData.currentTier) {
            tier = userData.valorantProfileData.currentTier;
            console.log(`🎮 Valorant 티어 조회 성공 - userId: ${userId}, tier: ${tier}`);
          } else if (userData.valorantCurrentTier) {
            tier = userData.valorantCurrentTier;
            console.log(`🎮 Valorant 티어 조회 성공 (대체 필드) - userId: ${userId}, tier: ${tier}`);
          } else {
            console.log(`🎮 Valorant 티어 정보 없음 - userId: ${userId}`, userData.valorantProfileData);
          }
        } else {
          console.log(`🎮 Valorant 연동되지 않음 - userId: ${userId}, verified: ${userData.valorantVerified}`);
        }
      }
      
      // 캐시에 저장
      this._userTierCache.set(cacheKey, { tier, timestamp: Date.now() });
      console.log(`🎮 최종 티어 결과 - userId: ${userId}, gameType: ${gameType}, tier: ${tier}`);
      return tier;
    } catch (error) {
      console.error('사용자 랭크 정보 조회 실패:', error);
      return 'Unranked';
    }
  },

  // 일관된 사용자 ID 생성 (기존 우선순위 복원 + 이메일 지원)
  generateConsistentUserId(user) {
    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 generateConsistentUserId: user 없음');
      }
      return null;
    }
    
    let userId = null;
    
    // NextAuth 사용자 (Google OAuth) - 기존 우선순위 복원
    if (user.id) {
      userId = user.id;
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 generateConsistentUserId: NextAuth ID 사용 - ${userId}`);
      }
      return userId;
    }
    
    // Firebase 사용자
    if (user.uid) {
      userId = user.uid;
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 generateConsistentUserId: Firebase UID 사용 - ${userId}`);
      }
      return userId;
    }
    
    // 이메일 fallback (마지막 우선순위)
    if (user.email) {
      userId = user.email;
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔍 generateConsistentUserId: 이메일 사용 - ${userId}`);
      }
      return userId;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 generateConsistentUserId: ID 생성 실패, user 객체:', user);
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
      
      // 각 게시글의 작성자 랭크 정보 보완
      posts = await this.enrichPostsWithUserTiers(posts, gameType);
      
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
      
      // 사용자의 실제 랭크 정보 조회 (캐시 무효화 후 최신 정보 가져오기)
      let userTier = "Unranked";
      try {
        console.log('🔍 게시글 작성 - 랭크 정보 조회 시작');
        // 게시글 작성 시에는 항상 최신 티어 정보를 사용
        this.clearTierCache(userId, gameType);
        userTier = await this.getUserTierInfo(userId, gameType, currentUser);
        console.log('🔍 게시글 작성 - 사용자 랭크:', userTier);
      } catch (error) {
        console.error('🔍 게시글 작성 - 랭크 정보 조회 실패:', error);
        // 에러가 발생해도 게시글 작성은 계속 진행 (Unranked로)
      }
      
      console.log('🔍 게시글 작성 - 사용자 정보:', {
        currentUser,
        userId,
        userName,
        userPhoto,
        userTier,
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
        authorTier: userTier, // 사용자 랭크 정보 추가
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
        dislikes: 0,
        views: 0,
        commentCount: 0,
        // 추천 관련 필드 추가 (투표와 별개)
        recommendations: 0,
        unrecommendations: 0
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
        
        const postData = {
          id: docSnap.id,
          ...docSnap.data(),
          views: (docSnap.data().views || 0) + 1
        };
        
        // 랭크 정보 보완
        if (!postData.authorTier || postData.authorTier === 'Unranked') {
          try {
            const userTier = await this.getUserTierInfo(postData.authorId, gameType);
            postData.authorTier = userTier;
          } catch (error) {
            console.error('게시글 작성자 랭크 조회 실패:', error);
          }
        }
        
        return postData;
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
      
      // 포괄적인 사용자 ID 매칭
      const postData = docSnap.data();
      
      // All possible user identifiers from currentUser
      const userIdentifiers = new Set();
      if (currentUser.id) userIdentifiers.add(currentUser.id);
      if (currentUser.uid) userIdentifiers.add(currentUser.uid);
      if (currentUser.email) {
          userIdentifiers.add(currentUser.email);
          userIdentifiers.add(currentUser.email.replace(/[^a-zA-Z0-9]/g, '_'));
          userIdentifiers.add(currentUser.email.split('@')[0]);
      }
      if (currentUser.sub) userIdentifiers.add(currentUser.sub);
      
      // All possible author identifiers from post
      const authorIdentifiers = new Set();
      if (postData.authorId) authorIdentifiers.add(postData.authorId);
      if (postData.authorUid) authorIdentifiers.add(postData.authorUid);
      if (postData.authorEmail) authorIdentifiers.add(postData.authorEmail);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 updatePost 권한 확인:', {
          currentUser: currentUser,
          userIdentifiers: Array.from(userIdentifiers),
          authorIdentifiers: Array.from(authorIdentifiers),
          postData: postData
        });
      }
      
      // Check for any match
      const isAuthor = Array.from(userIdentifiers).some(userId => 
          authorIdentifiers.has(userId)
      );
      
      if (!isAuthor) {
        throw new Error(`수정 권한이 없습니다. 본인이 작성한 글만 수정할 수 있습니다.`);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('권한 확인 완료:', { isAuthor, email: currentUser.email });
      }

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
      
      // 포괄적인 사용자 ID 매칭
      const postData = docSnap.data();
      
      // All possible user identifiers from currentUser
      const userIdentifiers = new Set();
      if (currentUser.id) userIdentifiers.add(currentUser.id);
      if (currentUser.uid) userIdentifiers.add(currentUser.uid);
      if (currentUser.email) {
          userIdentifiers.add(currentUser.email);
          userIdentifiers.add(currentUser.email.replace(/[^a-zA-Z0-9]/g, '_'));
          userIdentifiers.add(currentUser.email.split('@')[0]);
      }
      if (currentUser.sub) userIdentifiers.add(currentUser.sub);
      
      // All possible author identifiers from post
      const authorIdentifiers = new Set();
      if (postData.authorId) authorIdentifiers.add(postData.authorId);
      if (postData.authorUid) authorIdentifiers.add(postData.authorUid);
      if (postData.authorEmail) authorIdentifiers.add(postData.authorEmail);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 deletePost 권한 확인:', {
          currentUser: currentUser,
          userIdentifiers: Array.from(userIdentifiers),
          authorIdentifiers: Array.from(authorIdentifiers),
          postData: postData
        });
      }
      
      // Check for any match
      const isAuthor = Array.from(userIdentifiers).some(userId => 
          authorIdentifiers.has(userId)
      );
      
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
      
      // 사용자의 실제 랭크 정보 조회 (캐시 무효화 후 최신 정보 가져오기)
      let userTier = "Unranked";
      try {
        console.log('🔍 댓글 작성 - 랭크 정보 조회 시작');
        // 댓글 작성 시에는 항상 최신 티어 정보를 사용
        this.clearTierCache(userId, gameType);
        userTier = await this.getUserTierInfo(userId, gameType, currentUser);
        console.log('🔍 댓글 작성 - 사용자 랭크:', userTier);
      } catch (error) {
        console.error('🔍 댓글 작성 - 랭크 정보 조회 실패:', error);
        // 에러가 발생해도 댓글 작성은 계속 진행 (Unranked로)
      }

      const commentData = {
        postId,
        content: commentText,
        authorId: userId,
        authorUid: userId, // 동일한 값으로 두 필드 모두 저장
        authorName: userName,
        authorPhoto: userPhoto,
        authorTier: userTier, // 사용자 랭크 정보 추가
        likes: 0, // 댓글 좋아요 초기값
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
      
      // 각 댓글의 작성자 랭크 정보 보완
      const enrichedComments = await Promise.all(comments.map(async (comment) => {
        if (!comment.authorTier || comment.authorTier === 'Unranked') {
          try {
            const userTier = await this.getUserTierInfo(comment.authorId, gameType);
            return {
              ...comment,
              authorTier: userTier
            };
          } catch (error) {
            console.error(`댓글 ${comment.id} 작성자 랭크 조회 실패:`, error);
            return {
              ...comment,
              authorTier: comment.authorTier || 'Unranked'
            };
          }
        }
        return comment;
      }));
      
      return enrichedComments;
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

  // 사용자의 추천 여부 확인 (투표와 별개)
  async checkUserRecommendation(gameType, postId, sessionUser = null) {
    try {
      let currentUser = sessionUser;
      if (!currentUser) {
        currentUser = auth.currentUser;
        if (!currentUser) {
          return null;
        }
      }

      const userId = this.generateConsistentUserId(currentUser);
      if (!userId) return null;

      const recRef = doc(db, `${gameType}_post_recommendations`, `${postId}_${userId}`);
      const recSnap = await getDoc(recRef);
      
      if (recSnap.exists()) {
        return recSnap.data().recommendationType;
      }
      
      return null;
    } catch (error) {
      console.error('추천 확인 실패:', error);
      return null;
    }
  },

  // 게시글 추천 (투표와 별개의 좋아요/싫어요)
  async recommendPost(gameType, postId, recommendationType, sessionUser = null) {
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
      if (!userId) {
        throw new Error('사용자 정보를 확인할 수 없습니다.');
      }

      // 기존 추천 확인
      const existingRecommendation = await this.checkUserRecommendation(gameType, postId, sessionUser);
      
      const postRef = doc(db, `${gameType}_posts`, postId);
      const postSnap = await getDoc(postRef);
      
      if (!postSnap.exists()) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }

      const currentData = postSnap.data();
      const recDocRef = doc(db, `${gameType}_post_recommendations`, `${postId}_${userId}`);
      
      // 같은 추천을 다시 누른 경우 추천 취소
      if (existingRecommendation === recommendationType) {
        // 추천 취소
        await deleteDoc(recDocRef);
        
        // 추천 수 감소
        if (recommendationType === 'recommend') {
          await updateDoc(postRef, {
            recommendations: Math.max(0, (currentData.recommendations || 0) - 1)
          });
        } else if (recommendationType === 'unrecommend') {
          await updateDoc(postRef, {
            unrecommendations: Math.max(0, (currentData.unrecommendations || 0) - 1)
          });
        }
        
        return { action: 'removed', recommendationType };
      }
      
      // 다른 추천이 있는 경우 기존 추천 제거 후 새 추천 추가
      if (existingRecommendation && existingRecommendation !== recommendationType) {
        const updateData = {};
        
        if (existingRecommendation === 'recommend') {
          updateData.recommendations = Math.max(0, (currentData.recommendations || 0) - 1);
        } else if (existingRecommendation === 'unrecommend') {
          updateData.unrecommendations = Math.max(0, (currentData.unrecommendations || 0) - 1);
        }
        
        if (recommendationType === 'recommend') {
          updateData.recommendations = (updateData.recommendations !== undefined ? updateData.recommendations : (currentData.recommendations || 0)) + 1;
        } else if (recommendationType === 'unrecommend') {
          updateData.unrecommendations = (updateData.unrecommendations !== undefined ? updateData.unrecommendations : (currentData.unrecommendations || 0)) + 1;
        }
        
        await updateDoc(postRef, updateData);
      } else if (!existingRecommendation) {
        // 새로운 추천 추가
        if (recommendationType === 'recommend') {
          await updateDoc(postRef, {
            recommendations: (currentData.recommendations || 0) + 1
          });
        } else if (recommendationType === 'unrecommend') {
          await updateDoc(postRef, {
            unrecommendations: (currentData.unrecommendations || 0) + 1
          });
        }
      }

      // 추천 기록 저장/업데이트
      await setDoc(recDocRef, {
        userId: userId,
        postId: postId,
        recommendationType: recommendationType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { action: 'added', recommendationType };
    } catch (error) {
      console.error('추천 실패:', error);
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

  // 사용자의 투표 여부 확인
  async checkUserVote(gameType, postId, sessionUser = null) {
    try {
      let currentUser = sessionUser;
      if (!currentUser) {
        currentUser = auth.currentUser;
        if (!currentUser) {
          console.log('🔍 checkUserVote: 사용자 없음');
          return null;
        }
      }

      const userId = this.generateConsistentUserId(currentUser);
      if (!userId) {
        console.log('🔍 checkUserVote: userId 생성 실패');
        return null;
      }

      const voteDocId = `${postId}_${userId}`;
      console.log(`🔍 checkUserVote: 투표 확인 시도 - gameType: ${gameType}, docId: ${voteDocId}`);

      const voteRef = doc(db, `${gameType}_post_votes`, voteDocId);
      const voteSnap = await getDoc(voteRef);
      
      if (voteSnap.exists()) {
        const voteData = voteSnap.data();
        console.log(`🔍 checkUserVote: 기존 투표 발견 - ${voteData.voteType}`);
        return voteData.voteType;
      }
      
      console.log('🔍 checkUserVote: 기존 투표 없음');
      return null;
    } catch (error) {
      console.error('투표 확인 실패:', error);
      return null;
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

      const userId = this.generateConsistentUserId(currentUser);
      if (!userId) {
        throw new Error('사용자 정보를 확인할 수 없습니다.');
      }

      // 기존 투표 확인
      const existingVote = await this.checkUserVote(gameType, postId, sessionUser);
      
      const postRef = doc(db, `${gameType}_posts`, postId);
      const postSnap = await getDoc(postRef);
      
      if (!postSnap.exists()) {
        throw new Error('게시글을 찾을 수 없습니다.');
      }

      const currentData = postSnap.data();
      const voteDocRef = doc(db, `${gameType}_post_votes`, `${postId}_${userId}`);
      
      // 같은 투표를 다시 누른 경우 투표 취소
      if (existingVote === voteType) {
        // 투표 취소
        await deleteDoc(voteDocRef);
        
        // 투표 수 감소
        if (this.validateVoteOptions(currentData.voteOptions)) {
          const voteResults = [...(currentData.voteResults || new Array(currentData.voteOptions.length).fill(0))];
          const totalVotes = Math.max(0, (currentData.totalVotes || 0) - 1);
          
          if (voteType.startsWith('option_')) {
            const optionIndex = parseInt(voteType.split('_')[1]);
            if (optionIndex >= 0 && optionIndex < voteResults.length) {
              voteResults[optionIndex] = Math.max(0, voteResults[optionIndex] - 1);
            }
          } else if (voteType === 'neutral' && currentData.allowNeutral) {
            voteResults[voteResults.length - 1] = Math.max(0, voteResults[voteResults.length - 1] - 1);
          }
          
          await updateDoc(postRef, {
            voteResults: voteResults,
            totalVotes: totalVotes
          });
        } else {
          // 기본 좋아요/싫어요 투표 취소
          if (voteType === 'like') {
            await updateDoc(postRef, {
              likes: Math.max(0, (currentData.likes || 0) - 1)
            });
          } else if (voteType === 'dislike') {
            await updateDoc(postRef, {
              dislikes: Math.max(0, (currentData.dislikes || 0) - 1)
            });
          }
        }
        
        return { action: 'removed', voteType };
      }
      
      // 다른 투표가 있는 경우 기존 투표 제거 후 새 투표 추가
      if (existingVote && existingVote !== voteType) {
        // 기존 투표 제거
        if (this.validateVoteOptions(currentData.voteOptions)) {
          const voteResults = [...(currentData.voteResults || new Array(currentData.voteOptions.length).fill(0))];
          
          if (existingVote.startsWith('option_')) {
            const optionIndex = parseInt(existingVote.split('_')[1]);
            if (optionIndex >= 0 && optionIndex < voteResults.length) {
              voteResults[optionIndex] = Math.max(0, voteResults[optionIndex] - 1);
            }
          } else if (existingVote === 'neutral' && currentData.allowNeutral) {
            voteResults[voteResults.length - 1] = Math.max(0, voteResults[voteResults.length - 1] - 1);
          }
          
          // 새 투표 추가
          if (voteType.startsWith('option_')) {
            const optionIndex = parseInt(voteType.split('_')[1]);
            if (optionIndex >= 0 && optionIndex < voteResults.length) {
              voteResults[optionIndex] += 1;
            }
          } else if (voteType === 'neutral' && currentData.allowNeutral) {
            voteResults[voteResults.length - 1] += 1;
          }
          
          await updateDoc(postRef, {
            voteResults: voteResults
          });
        } else {
          // 기본 좋아요/싫어요 투표 변경
          const updateData = {};
          
          if (existingVote === 'like') {
            updateData.likes = Math.max(0, (currentData.likes || 0) - 1);
          } else if (existingVote === 'dislike') {
            updateData.dislikes = Math.max(0, (currentData.dislikes || 0) - 1);
          }
          
          if (voteType === 'like') {
            updateData.likes = (updateData.likes !== undefined ? updateData.likes : (currentData.likes || 0)) + 1;
          } else if (voteType === 'dislike') {
            updateData.dislikes = (updateData.dislikes !== undefined ? updateData.dislikes : (currentData.dislikes || 0)) + 1;
          }
          
          await updateDoc(postRef, updateData);
        }
      } else if (!existingVote) {
        // 새로운 투표 추가
        if (this.validateVoteOptions(currentData.voteOptions)) {
          const voteResults = [...(currentData.voteResults || new Array(currentData.voteOptions.length).fill(0))];
          const totalVotes = (currentData.totalVotes || 0) + 1;
          
          if (voteType.startsWith('option_')) {
            const optionIndex = parseInt(voteType.split('_')[1]);
            if (optionIndex >= 0 && optionIndex < voteResults.length) {
              voteResults[optionIndex] += 1;
            }
          } else if (voteType === 'neutral' && currentData.allowNeutral) {
            voteResults[voteResults.length - 1] += 1;
          }
          
          await updateDoc(postRef, {
            voteResults: voteResults,
            totalVotes: totalVotes
          });
        } else {
          // 기본 좋아요/싫어요 투표
          if (voteType === 'like') {
            await updateDoc(postRef, {
              likes: (currentData.likes || 0) + 1
            });
          } else if (voteType === 'dislike') {
            await updateDoc(postRef, {
              dislikes: (currentData.dislikes || 0) + 1
            });
          }
        }
      }

      // 투표 기록 저장/업데이트
      const voteDocId = `${postId}_${userId}`;
      console.log(`🔍 votePost: 투표 저장 - gameType: ${gameType}, docId: ${voteDocId}, voteType: ${voteType}`);
      
      await setDoc(voteDocRef, {
        userId: userId,
        postId: postId,
        voteType: voteType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`🔍 votePost: 투표 저장 완료`);
      return { action: 'added', voteType };
    } catch (error) {
      console.error('투표 실패:', error);
      throw error;
    }
  },

  // 사용자의 댓글 투표 여부 확인
  async checkUserCommentVote(gameType, commentId, sessionUser = null) {
    try {
      let currentUser = sessionUser;
      if (!currentUser) {
        currentUser = auth.currentUser;
        if (!currentUser) {
          return null;
        }
      }

      const userId = this.generateConsistentUserId(currentUser);
      if (!userId) return null;

      const voteRef = doc(db, `${gameType}_comment_votes`, `${commentId}_${userId}`);
      const voteSnap = await getDoc(voteRef);
      
      if (voteSnap.exists()) {
        return voteSnap.data().voteType;
      }
      
      return null;
    } catch (error) {
      console.error('댓글 투표 확인 실패:', error);
      return null;
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
      if (!userId) {
        throw new Error('사용자 정보를 확인할 수 없습니다.');
      }

      // 기존 투표 확인
      const existingVote = await this.checkUserCommentVote(gameType, commentId, sessionUser);

      const commentRef = doc(db, `${gameType}_comments`, commentId);
      const commentSnap = await getDoc(commentRef);
      
      if (!commentSnap.exists()) {
        throw new Error('댓글을 찾을 수 없습니다.');
      }

      const currentData = commentSnap.data();
      const voteDocRef = doc(db, `${gameType}_comment_votes`, `${commentId}_${userId}`);

      // 같은 투표를 다시 누른 경우 투표 취소
      if (existingVote === voteType) {
        // 투표 취소
        await deleteDoc(voteDocRef);
        
        // 투표 수 감소
        if (voteType === 'like') {
          await updateDoc(commentRef, {
            likes: Math.max(0, (currentData.likes || 0) - 1)
          });
        } else if (voteType === 'dislike') {
          await updateDoc(commentRef, {
            dislikes: Math.max(0, (currentData.dislikes || 0) - 1)
          });
        }
        
        return { action: 'removed', voteType };
      }

      // 다른 투표가 있는 경우 기존 투표 제거 후 새 투표 추가
      if (existingVote && existingVote !== voteType) {
        const updateData = {};
        
        if (existingVote === 'like') {
          updateData.likes = Math.max(0, (currentData.likes || 0) - 1);
        } else if (existingVote === 'dislike') {
          updateData.dislikes = Math.max(0, (currentData.dislikes || 0) - 1);
        }
        
        if (voteType === 'like') {
          updateData.likes = (updateData.likes !== undefined ? updateData.likes : (currentData.likes || 0)) + 1;
        } else if (voteType === 'dislike') {
          updateData.dislikes = (updateData.dislikes !== undefined ? updateData.dislikes : (currentData.dislikes || 0)) + 1;
        }
        
        await updateDoc(commentRef, updateData);
      } else if (!existingVote) {
        // 새로운 투표 추가
        if (voteType === 'like') {
          await updateDoc(commentRef, {
            likes: (currentData.likes || 0) + 1
          });
        } else if (voteType === 'dislike') {
          await updateDoc(commentRef, {
            dislikes: (currentData.dislikes || 0) + 1
          });
        }
      }

      // 투표 기록 저장/업데이트
      await setDoc(voteDocRef, {
        userId: userId,
        commentId: commentId,
        voteType: voteType,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return { action: 'added', voteType };
    } catch (error) {
      console.error('댓글 투표 실패:', error);
      throw error;
    }
  }
};