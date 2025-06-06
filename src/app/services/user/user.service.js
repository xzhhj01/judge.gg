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
      
      // 문서가 존재하는지 확인
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        // 문서가 없으면 생성
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          ...profileData,
          updatedAt: serverTimestamp()
        });
      } else {
        // 문서가 있으면 업데이트
        await updateDoc(userRef, {
          ...profileData,
          updatedAt: serverTimestamp()
        });
      }

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

  // Riot ID 연결 (기존 방식 - 단순 저장)
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

      // 문서가 존재하는지 확인
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        // 문서가 없으면 생성
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          ...updateData
        });
      } else {
        // 문서가 있으면 업데이트
        await updateDoc(userRef, updateData);
      }
      return true;
    } catch (error) {
      console.error('Riot ID 연결 실패:', error);
      throw error;
    }
  },

  // LoL Riot API를 통한 검증된 계정 연동
  async verifyAndConnectLolAccount(riotId, sessionUser = null) {
    try {
      console.log('🔍 LoL 계정 검증 시작:', riotId);
      
      // 1. Riot ID를 gameName#tagLine으로 파싱
      const [gameName, tagLine] = riotId.split('#');
      if (!gameName || !tagLine) {
        throw new Error('Riot ID 형식이 올바르지 않습니다. (예: Hide on bush#KR1)');
      }

      // 2. Riot API를 통해 PUUID 조회
      const accountResponse = await fetch(`/api/riot?gameName=${encodeURIComponent(gameName)}&tagLine=${encodeURIComponent(tagLine)}`);
      
      let accountData;
      try {
        accountData = await accountResponse.json();
      } catch (jsonError) {
        // JSON 파싱 실패 시 응답을 텍스트로 읽기
        const errorText = await accountResponse.text();
        console.error('API 응답 JSON 파싱 실패:', errorText);
        throw new Error(`API 서버 오류: ${accountResponse.status} ${accountResponse.statusText}`);
      }
      
      if (!accountResponse.ok) {
        throw new Error(accountData.message || `계정을 찾을 수 없습니다. (${accountResponse.status})`);
      }

      console.log('🔍 계정 정보 조회 성공:', accountData);

      // 3. PUUID로 LoL 프로필 조회
      const lolResponse = await fetch(`/api/riot/lol?puuid=${accountData.puuid}`);
      
      let lolData;
      try {
        lolData = await lolResponse.json();
      } catch (jsonError) {
        const errorText = await lolResponse.text();
        console.error('LoL API 응답 JSON 파싱 실패:', errorText);
        throw new Error(`LoL API 서버 오류: ${lolResponse.status} ${lolResponse.statusText}`);
      }
      
      if (!lolResponse.ok) {
        throw new Error(lolData.message || `LoL 프로필을 찾을 수 없습니다. (${lolResponse.status})`);
      }

      console.log('🔍 LoL 프로필 조회 성공:', lolData);

      // 4. 사용자 정보에 저장
      // 세션 사용자 정보에서 userId 결정
      let userId;
      if (sessionUser) {
        const { communityService } = await import('@/app/services/community/community.service');
        userId = communityService.generateConsistentUserId(sessionUser);
      } else {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('로그인이 필요합니다.');
        }
        userId = user.uid;
      }

      console.log('🔍 LoL 연동 정보 저장할 userId:', userId);
      const userRef = doc(db, 'users', userId);
      
      // 문서가 존재하는지 확인
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        // 문서가 없으면 생성
        await setDoc(userRef, {
          uid: sessionUser?.uid || sessionUser?.id,
          email: sessionUser?.email,
          displayName: sessionUser?.displayName || sessionUser?.name,
          photoURL: sessionUser?.photoURL || sessionUser?.image,
          createdAt: serverTimestamp(),
          lolRiotId: riotId,
          lolPuuid: accountData.puuid,
          lolSummonerId: lolData.summoner.id,
          lolVerified: true,
          lolProfileData: lolData,
          updatedAt: serverTimestamp()
        });
      } else {
        // 문서가 있으면 업데이트
        await updateDoc(userRef, {
          lolRiotId: riotId,
          lolPuuid: accountData.puuid,
          lolSummonerId: lolData.summoner.id,
          lolVerified: true,
          lolProfileData: lolData,
          updatedAt: serverTimestamp()
        });
      }

      return {
        verified: true,
        riotId: riotId,
        puuid: accountData.puuid,
        profile: lolData
      };
    } catch (error) {
      console.error('LoL 계정 검증 및 연동 실패:', error);
      throw error;
    }
  },

  // 사용자의 LoL 티어 정보만 조회 (빠른 조회)
  async getLolTierInfo(sessionUser = null) {
    try {
      // 사용자 ID 결정: 세션 사용자 우선, 없으면 Firebase Auth 사용자
      let userId;
      if (sessionUser) {
        const { communityService } = await import('@/app/services/community/community.service');
        userId = communityService.generateConsistentUserId(sessionUser);
      } else {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('로그인이 필요합니다.');
        }
        userId = user.uid;
      }

      console.log('🔍 getLolTierInfo - 사용할 userId:', userId);

      // 사용자 정보에서 LoL PUUID 조회
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      const userData = userSnap.data();
      
      if (!userData.lolVerified || !userData.lolPuuid) {
        return {
          verified: false,
          message: 'LoL 계정이 연동되지 않았습니다.'
        };
      }

      // 티어 정보만 조회
      const tierResponse = await fetch(`/api/riot/lol?puuid=${userData.lolPuuid}&tierOnly=true`);
      
      let tierData;
      try {
        tierData = await tierResponse.json();
      } catch (jsonError) {
        const errorText = await tierResponse.text();
        console.error('티어 API 응답 JSON 파싱 실패:', errorText);
        throw new Error(`티어 API 서버 오류: ${tierResponse.status} ${tierResponse.statusText}`);
      }
      
      if (!tierResponse.ok) {
        throw new Error(tierData.message || `티어 정보를 가져올 수 없습니다. (${tierResponse.status})`);
      }

      return {
        verified: true,
        riotId: userData.lolRiotId,
        puuid: userData.lolPuuid,
        summoner: tierData.summoner,
        ranks: tierData.ranks,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('LoL 티어 정보 조회 실패:', error);
      return {
        verified: false,
        error: error.message
      };
    }
  },

  // 사용자의 LoL 프로필 정보 조회
  async getLolProfile(sessionUser = null) {
    try {
      let userId;
      if (sessionUser) {
        const { communityService } = await import('@/app/services/community/community.service');
        userId = communityService.generateConsistentUserId(sessionUser);
      } else {
        const user = auth.currentUser;
        if (!user) {
          throw new Error('로그인이 필요합니다.');
        }
        userId = user.uid;
      }

      // 사용자 정보에서 LoL 프로필 데이터 조회
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      const userData = userSnap.data();
      
      if (!userData.lolVerified || !userData.lolPuuid) {
        throw new Error('LoL 계정이 연동되지 않았습니다.');
      }

      // 최신 프로필 정보 갱신 (선택적)
      try {
        const lolResponse = await fetch(`/api/riot/lol?puuid=${userData.lolPuuid}`);
        if (lolResponse.ok) {
          const lolData = await lolResponse.json();
          
          // 최신 정보로 업데이트 (문서 존재 확인 후)
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            await updateDoc(userRef, {
              lolProfileData: lolData,
              updatedAt: serverTimestamp()
            });
          }

          return {
            verified: true,
            riotId: userData.lolRiotId,
            puuid: userData.lolPuuid,
            profile: lolData
          };
        }
      } catch (error) {
        console.error('최신 프로필 갱신 실패:', error);
      }

      // 저장된 데이터 반환
      return {
        verified: userData.lolVerified,
        riotId: userData.lolRiotId,
        puuid: userData.lolPuuid,
        profile: userData.lolProfileData
      };
    } catch (error) {
      console.error('LoL 프로필 조회 실패:', error);
      throw error;
    }
  },

  // 발로란트 Riot API를 통한 검증된 계정 연동
  async verifyAndConnectValorantAccount(riotId, sessionUser = null) {
    try {
      // API 엔드포인트를 통해 검증 및 연동
      const response = await fetch('/api/riot/valorant/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ riotId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '발로란트 계정 연동에 실패했습니다.');
      }

      return result;
    } catch (error) {
      console.error('발로란트 계정 검증 및 연동 실패:', error);
      throw error;
    }
  },

  // 사용자의 발로란트 프로필 정보 조회
  async getValorantProfile(sessionUser = null) {
    try {
      const response = await fetch('/api/riot/valorant/verify', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('로그인이 필요합니다.');
        }
        throw new Error(result.error || '발로란트 프로필 조회에 실패했습니다.');
      }

      return result;
    } catch (error) {
      console.error('발로란트 프로필 조회 실패:', error);
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
      
      // 사용자 ID의 모든 가능한 형태 생성 (이전 방식들과의 호환성 보장)
      const possibleIds = new Set([
        userId,
        userId?.toString(),
        // 이메일 형태 변환
        userId?.includes('@') ? userId.replace(/[^a-zA-Z0-9]/g, '_') : null,
        userId?.includes('@') ? userId.split('@')[0] : null,
      ]);
      
      // 사용자 객체에서 모든 가능한 ID 형태 추가
      if (userObject) {
        // NextAuth ID
        if (userObject.id) {
          possibleIds.add(userObject.id);
          possibleIds.add(userObject.id.toString());
        }
        
        // Firebase UID
        if (userObject.uid) {
          possibleIds.add(userObject.uid);
          possibleIds.add(userObject.uid.toString());
        }
        
        // 이메일 기반 ID들
        if (userObject.email) {
          const email = userObject.email;
          possibleIds.add(email);
          possibleIds.add(email.replace(/[^a-zA-Z0-9]/g, '_'));
          possibleIds.add(email.split('@')[0]);
          console.log(`🔍 사용자 이메일 기반 ID 추가: ${email}`);
        }
        
        // sub 필드 (JWT에서 사용되는 경우)
        if (userObject.sub) {
          possibleIds.add(userObject.sub);
          possibleIds.add(userObject.sub.toString());
        }
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
      
      // 쿼리를 순차적으로 실행 (연결 안정성 향상)
      const snapshots = [];
      for (const q of queries) {
        try {
          const snapshot = await getDocs(q);
          snapshots.push(snapshot);
          // 첫 번째 결과가 있으면 더 이상 실행하지 않음
          if (!snapshot.empty) {
            break;
          }
        } catch (error) {
          console.error('🔍 개별 쿼리 실행 오류:', error);
          snapshots.push({ docs: [] });
        }
      }
      
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
      console.log('🔍 getUserInfo 호출 - userId:', userId);
      
      if (!userId) {
        console.log('🔍 getUserInfo - userId가 없음');
        return null;
      }
      
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log('🔍 getUserInfo - Firebase에서 사용자 정보 조회 성공:', {
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          lolRiotId: userData.lolRiotId,
          lolVerified: userData.lolVerified,
          valorantRiotId: userData.valorantRiotId,
          valorantVerified: userData.valorantVerified
        });
        return userData;
      }
      
      console.log('🔍 getUserInfo - Firebase에 사용자 문서가 없음');
      return null;
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      // 에러가 발생해도 null 반환 (앱이 크래시하지 않도록)
      return null;
    }
  },

  // 사용자 통계 조회
  async getUserStats(userId, userObject = null) {
    try {
      console.log(`🔍 getUserStats 시작 - userId: ${userId}`);
      
      const stats = {
        all: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0, requestedFeedbacks: 0, receivedFeedbacks: 0 },
        lol: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0, requestedFeedbacks: 0, receivedFeedbacks: 0 },
        valorant: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0, requestedFeedbacks: 0, receivedFeedbacks: 0 }
      };

      // 작성한 게시글 수 계산 (사용자 객체 정보 전달)
      const lolPosts = await this.getUserPostsByGame(userId, 'lol', userObject);
      const valorantPosts = await this.getUserPostsByGame(userId, 'valorant', userObject);
      
      console.log(`🔍 통계 계산 - LoL 게시글: ${lolPosts.length}개, Valorant 게시글: ${valorantPosts.length}개`);
      
      stats.lol.posts = lolPosts.length;
      stats.valorant.posts = valorantPosts.length;
      stats.all.posts = lolPosts.length + valorantPosts.length;

      // 댓글 단 게시글 수 계산 (실제 존재하는 게시글만)
      const lolCommentedPostsData = await this.getUserCommentedPostsData(userId, 'lol', userObject);
      const valorantCommentedPostsData = await this.getUserCommentedPostsData(userId, 'valorant', userObject);
      
      console.log(`🔍 통계 계산 - LoL 댓글 (실존): ${lolCommentedPostsData.length}개, Valorant 댓글 (실존): ${valorantCommentedPostsData.length}개`);
      
      stats.lol.commentedPosts = lolCommentedPostsData.length;
      stats.valorant.commentedPosts = valorantCommentedPostsData.length;
      stats.all.commentedPosts = lolCommentedPostsData.length + valorantCommentedPostsData.length;

      // 투표한 게시글 수 계산 (실제 존재하는 게시글만)
      const lolVotedPostsData = await this.getUserVotedPostsData(userId, 'lol', userObject);
      const valorantVotedPostsData = await this.getUserVotedPostsData(userId, 'valorant', userObject);
      
      console.log(`🔍 통계 계산 - LoL 투표 (실존): ${lolVotedPostsData.length}개, Valorant 투표 (실존): ${valorantVotedPostsData.length}개`);
      
      stats.lol.votedPosts = lolVotedPostsData.length;
      stats.valorant.votedPosts = valorantVotedPostsData.length;
      stats.all.votedPosts = lolVotedPostsData.length + valorantVotedPostsData.length;

      // 찜한 멘토 수 계산
      const likedMentorsCount = await this.getUserLikedMentorsCount(userId);
      stats.lol.likedMentors = likedMentorsCount;
      stats.valorant.likedMentors = likedMentorsCount;
      stats.all.likedMentors = likedMentorsCount;

      // 피드백 통계 계산
      const requestedFeedbacks = await this.getUserRequestedFeedbacks(userId, userObject);
      
      // 받은 피드백 계산 (userId로 직접 조회)
      let receivedFeedbacks = [];
      try {
        receivedFeedbacks = await this.getMentorReceivedFeedbacks(userId, userObject);
        console.log(`🔍 사용자 ${userId}의 받은 피드백: ${receivedFeedbacks.length}개`);
      } catch (error) {
        console.error('받은 피드백 조회 실패:', error);
      }
      
      // 게임별로 피드백 분류
      const lolRequestedFeedbacks = requestedFeedbacks.filter(f => f.game === 'lol');
      const valorantRequestedFeedbacks = requestedFeedbacks.filter(f => f.game === 'valorant');
      const lolReceivedFeedbacks = receivedFeedbacks.filter(f => f.game === 'lol');
      const valorantReceivedFeedbacks = receivedFeedbacks.filter(f => f.game === 'valorant');
      
      stats.lol.requestedFeedbacks = lolRequestedFeedbacks.length;
      stats.valorant.requestedFeedbacks = valorantRequestedFeedbacks.length;
      stats.all.requestedFeedbacks = requestedFeedbacks.length;
      
      stats.lol.receivedFeedbacks = lolReceivedFeedbacks.length;
      stats.valorant.receivedFeedbacks = valorantReceivedFeedbacks.length;
      stats.all.receivedFeedbacks = receivedFeedbacks.length;
      
      console.log(`🔍 피드백 통계 - 신청: ${requestedFeedbacks.length}개, 받음: ${receivedFeedbacks.length}개`);
      console.log(`🔍 최종 통계:`, stats);
      return stats;
    } catch (error) {
      console.error('사용자 통계 조회 실패:', error);
      return {
        all: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0, requestedFeedbacks: 0, receivedFeedbacks: 0 },
        lol: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0, requestedFeedbacks: 0, receivedFeedbacks: 0 },
        valorant: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0, requestedFeedbacks: 0, receivedFeedbacks: 0 }
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
      
      // 쿼리를 순차적으로 실행 (연결 안정성 향상)
      const snapshots = [];
      for (const q of queries) {
        try {
          const snapshot = await getDocs(q);
          snapshots.push(snapshot);
          // 첫 번째 결과가 있으면 더 이상 실행하지 않음
          if (!snapshot.empty) {
            break;
          }
        } catch (error) {
          console.error('🔍 개별 댓글 쿼리 실행 오류:', error);
          snapshots.push({ docs: [] });
        }
      }
      
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
      console.log(`🔍 getUserCommentedPostsData 시작 - userId: ${userId}, gameType: ${gameType}`);
      
      const postIds = await this.getUserCommentedPosts(userId, gameType, userObject);
      const posts = [];
      
      console.log(`🔍 댓글 단 게시글 ID 목록: ${postIds.length}개`);
      
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
          } else {
            console.log(`🔍 삭제된 댓글 단 게시글 발견: ${postId}`);
          }
        } catch (error) {
          console.error(`게시글 ${postId} 조회 실패:`, error);
        }
      }
      
      console.log(`🔍 실제 존재하는 댓글 단 게시글: ${posts.length}개 (삭제된 게시글: ${postIds.length - posts.length}개)`);
      
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
      console.log(`🔍 getUserVotedPostsData 시작 - userId: ${userId}, gameType: ${gameType}`);
      
      // 투표한 게시글 ID 목록 가져오기
      const postIds = await this.getUserVotedPosts(userId, gameType);
      const posts = [];
      const existingPostIds = [];
      
      console.log(`🔍 투표한 게시글 ID 목록: ${postIds.length}개`);
      
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
            existingPostIds.push(postId);
          } else {
            console.log(`🔍 삭제된 게시글 발견: ${postId}`);
          }
        } catch (error) {
          console.error(`게시글 ${postId} 조회 실패:`, error);
        }
      }
      
      console.log(`🔍 실제 존재하는 투표한 게시글: ${posts.length}개 (삭제된 게시글: ${postIds.length - posts.length}개)`);
      
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

  // 찜한 멘토 수 조회 (삭제된 멘토 제외)
  async getUserLikedMentorsCount(userId) {
    try {
      // 삭제된 멘토를 제외한 실제 존재하는 멘토만 카운트
      const mentorsData = await this.getUserLikedMentorsData(userId);
      return mentorsData.length;
    } catch (error) {
      console.error('찜한 멘토 수 조회 실패:', error);
      return 0;
    }
  },

  // 찜한 멘토의 상세 정보 조회 (삭제된 멘토 제외)
  async getUserLikedMentorsData(userId) {
    try {
      const mentorIds = await this.getUserLikedMentors(userId);
      const mentors = [];
      const deletedMentorIds = []; // 삭제된 멘토 ID 추적
      
      for (const mentorId of mentorIds) {
        try {
          const mentorRef = doc(db, 'mentors', mentorId);
          const mentorSnap = await getDoc(mentorRef);
          
          if (mentorSnap.exists()) {
            mentors.push({
              id: mentorSnap.id,
              ...mentorSnap.data()
            });
          } else {
            // 멘토 문서가 존재하지 않는 경우 (삭제됨)
            console.log(`삭제된 멘토 발견: ${mentorId}`);
            deletedMentorIds.push(mentorId);
          }
        } catch (error) {
          console.error(`멘토 ${mentorId} 정보 조회 실패:`, error);
        }
      }
      
      // 삭제된 멘토들을 liked_mentors에서 제거
      if (deletedMentorIds.length > 0) {
        console.log(`삭제된 멘토 ${deletedMentorIds.length}개를 찜 목록에서 제거 중...`);
        for (const mentorId of deletedMentorIds) {
          try {
            await this.removeLikedMentor(userId, mentorId);
            console.log(`찜 목록에서 삭제된 멘토 제거 완료: ${mentorId}`);
          } catch (error) {
            console.error(`찜 목록에서 멘토 제거 실패 ${mentorId}:`, error);
          }
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

  // 멘토가 받은 피드백 요청 목록 조회 (userId로 모든 멘토 프로필의 피드백 조회)
  async getMentorReceivedFeedbacks(userId, userObject = null) {
    try {
      console.log('🔍 getMentorReceivedFeedbacks 시작 - userId:', userId);
      
      if (!userId) {
        console.log('🔍 userId가 없음');
        return [];
      }
      
      // 1. 해당 사용자의 모든 멘토 프로필 조회 (승인/미승인 관계없이)
      const { mentorService } = await import('@/app/services/mentor/mentor.service');
      const userEmail = userObject?.email;
      const allMentors = await mentorService.getAllMentorsByUserId(userId, userEmail);
      
      if (allMentors.length === 0) {
        console.log('🔍 해당 userId의 멘토 프로필 없음:', userId);
        return [];
      }
      
      console.log('🔍 찾은 멘토 프로필들:', allMentors.map(m => ({
        id: m.id,
        nickname: m.nickname,
        selectedGame: m.selectedGame,
        isApproved: m.isApproved
      })));
      
      // 2. 모든 멘토 프로필로 들어온 피드백 요청 조회
      const allFeedbacks = [];
      
      for (const mentor of allMentors) {
        try {
          const feedbackQuery = query(
            collection(db, 'feedback_requests'),
            where('mentorId', '==', mentor.id)
          );
          
          const snapshot = await getDocs(feedbackQuery);
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            console.log(`🔍 멘토 ${mentor.nickname}(${mentor.id})의 피드백 요청:`, {
              id: doc.id,
              userName: data.userName,
              service: data.service,
              status: data.status,
              createdAt: data.createdAt
            });
            
            allFeedbacks.push({
              id: doc.id,
              ...data,
              // 멘토 정보도 포함
              mentorInfo: {
                id: mentor.id,
                nickname: mentor.nickname,
                selectedGame: mentor.selectedGame,
                isApproved: mentor.isApproved
              }
            });
          });
        } catch (error) {
          console.error(`멘토 ${mentor.id}의 피드백 조회 실패:`, error);
        }
      }
      
      console.log(`🔍 총 찾은 피드백 요청: ${allFeedbacks.length}개`);
      
      // 클라이언트에서 날짜순 정렬 (최신순)
      allFeedbacks.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      return allFeedbacks;
    } catch (error) {
      console.error('받은 피드백 요청 목록 조회 실패:', error);
      return [];
    }
  },

  // 멘토의 최근 활동 조회 (게시글 + 댓글)
  async getMentorRecentActivity(userId, limit = 10) {
    try {
      console.log('🔍 getMentorRecentActivity 시작 - userId:', userId);
      
      if (!userId) {
        return [];
      }

      const activities = [];

      // 1. 멘토가 작성한 게시글 조회 (LoL, Valorant)
      const [lolPosts, valorantPosts] = await Promise.all([
        this.getUserPostsByGame(userId, 'lol'),
        this.getUserPostsByGame(userId, 'valorant')
      ]);

      // 게시글을 활동으로 변환
      [...lolPosts, ...valorantPosts].forEach(post => {
        activities.push({
          type: 'post',
          id: post.id,
          title: post.title,
          content: post.content?.substring(0, 100) + (post.content?.length > 100 ? '...' : ''),
          gameType: post.gameType,
          createdAt: post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt),
          likes: post.likes || 0,
          commentCount: post.commentCount || 0,
          views: post.views || 0
        });
      });

      // 2. 멘토가 작성한 댓글 조회 (LoL, Valorant)
      const [lolCommentedPosts, valorantCommentedPosts] = await Promise.all([
        this.getUserCommentedPostsData(userId, 'lol'),
        this.getUserCommentedPostsData(userId, 'valorant')
      ]);

      // 댓글을 활동으로 변환 (댓글 내용을 가져오기 위해 추가 처리 필요)
      for (const post of [...lolCommentedPosts, ...valorantCommentedPosts]) {
        // 해당 게시글에서 이 사용자의 댓글들을 찾기
        try {
          const comments = await this.getUserCommentsOnPost(userId, post.gameType, post.id);
          comments.forEach(comment => {
            activities.push({
              type: 'comment',
              id: comment.id,
              content: comment.content?.substring(0, 100) + (comment.content?.length > 100 ? '...' : ''),
              postTitle: post.title,
              postId: post.id,
              gameType: post.gameType,
              createdAt: comment.createdAt?.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt),
              likes: comment.likes || 0
            });
          });
        } catch (error) {
          console.error(`댓글 조회 실패 - postId: ${post.id}`, error);
        }
      }

      // 최신순으로 정렬하고 제한된 수만 반환
      activities.sort((a, b) => b.createdAt - a.createdAt);
      
      console.log(`🔍 멘토 최근 활동: ${activities.length}개 (제한: ${limit}개)`);
      return activities.slice(0, limit);
    } catch (error) {
      console.error('멘토 최근 활동 조회 실패:', error);
      return [];
    }
  },

  // 특정 게시글에서 사용자의 댓글 조회
  async getUserCommentsOnPost(userId, gameType, postId) {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      // 사용자 ID의 다양한 형태 생성
      const possibleIds = new Set([
        userId,
        userId?.toString(),
        userId?.includes('@') ? userId.replace(/[^a-zA-Z0-9]/g, '_') : null,
        userId?.includes('@') ? userId.split('@')[0] : null,
      ]);
      const finalIds = Array.from(possibleIds).filter(Boolean);

      const queries = [];
      finalIds.forEach(id => {
        queries.push(query(
          collection(db, `${gameType}_comments`), 
          where('postId', '==', postId),
          where('authorId', '==', id)
        ));
        queries.push(query(
          collection(db, `${gameType}_comments`), 
          where('postId', '==', postId),
          where('authorUid', '==', id)
        ));
      });

      // 쿼리를 순차적으로 실행 (연결 안정성 향상)
      const snapshots = [];
      for (const q of queries) {
        try {
          const snapshot = await getDocs(q);
          snapshots.push(snapshot);
          // 첫 번째 결과가 있으면 더 이상 실행하지 않음
          if (!snapshot.empty) {
            break;
          }
        } catch (error) {
          console.error('개별 댓글 쿼리 실행 오류:', error);
          snapshots.push({ docs: [] });
        }
      }

      const comments = [];
      const commentIds = new Set();

      snapshots.forEach(snapshot => {
        const docs = snapshot.docs || [];
        docs.forEach(doc => {
          if (!commentIds.has(doc.id)) {
            comments.push({
              id: doc.id,
              ...doc.data()
            });
            commentIds.add(doc.id);
          }
        });
      });

      return comments;
    } catch (error) {
      console.error('게시글 댓글 조회 실패:', error);
      return [];
    }
  }
};