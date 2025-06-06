import { db, auth } from "@/lib/firebase/firebase.config";
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { communityService } from '@/app/services/community/community.service';

export const mentorService = {
  // 멘토 등록
  async registerMentor(mentorData, user = null) {
    try {
      console.log('멘토 서비스 registerMentor 호출됨');
      console.log('받은 mentorData:', mentorData);
      console.log('받은 user:', user);
      
      // If user is not provided, try to get from auth
      let currentUser = user;
      if (!currentUser) {
        console.log('user가 없어서 auth.currentUser 확인');
        currentUser = auth.currentUser;
        if (!currentUser) {
          console.log('auth.currentUser도 없음');
          throw new Error('로그인이 필요합니다.');
        }
      }

      console.log('현재 사용자 정보:', currentUser);

      // Use consistent user ID generation from community service
      const userId = communityService.generateConsistentUserId(currentUser);
      console.log('🔍 멘토 등록 - 사용자 ID 생성:', {
        userId: userId,
        currentUser: currentUser,
        sessionUserId: currentUser?.id,
        sessionUserEmail: currentUser?.email,
        firebaseUid: currentUser?.uid,
        firebaseEmail: currentUser?.email
      });
      
      if (!userId) {
        console.log('userId 생성 실패');
        throw new Error('사용자 정보가 올바르지 않습니다.');
      }

      // 태그 데이터를 배열로 변환
      const characterTags = Array.isArray(mentorData.tags?.situations) ? mentorData.tags.situations : [];
      const lineTags = Array.isArray(mentorData.tags?.lanes) ? mentorData.tags.lanes : 
                       Array.isArray(mentorData.tags?.agents) ? mentorData.tags.agents : [];
      const championTags = Array.isArray(mentorData.tags?.champions) ? mentorData.tags.champions : [];
      const experienceType = Array.isArray(mentorData.tags?.experience) ? mentorData.tags.experience : [];

      // 커리큘럼 데이터를 객체로 변환
      const curriculum = {
        mentoring_types: {
          video_feedback: {
            isSelected: mentorData.curriculums?.includes('영상 피드백') || false,
            price: 50000 // 기본값, 실제로는 폼에서 받아와야 함
          },
          realtime_onepoint: {
            isSelected: mentorData.curriculums?.includes('실시간 원포인트 피드백') || false,
            price: 30000
          },
          realtime_private: {
            isSelected: mentorData.curriculums?.includes('실시간 1:1 강의') || false,
            price: 80000
          }
        }
      };

      // Firestore에 저장할 데이터 준비 (undefined 값 제거)
      const firestoreData = {
        userId: userId,
        userEmail: currentUser.email || '',
        userName: currentUser.name || currentUser.displayName || '',
        userPhoto: currentUser.image || currentUser.photoURL || '',
        ...mentorData,
        // 태그들을 적절한 필드명으로 매핑
        characterTags: characterTags,
        lineTags: lineTags,
        championTags: championTags,
        experienceType: experienceType,
        curriculum: curriculum,
        detailedIntroduction: mentorData.detailedIntro,
        isApproved: false, // 기본값은 false (승인/미승인만 관리)
        appliedAt: serverTimestamp(),
        rating: 0,
        totalFeedbacks: 0,
        totalReviews: 0
      };

      // undefined 값들을 제거
      Object.keys(firestoreData).forEach(key => {
        if (firestoreData[key] === undefined) {
          delete firestoreData[key];
        }
      });

      // 별도 멘토 컬렉션에 저장 (users 컬렉션 업데이트는 일단 스킵)
      const mentorRef = await addDoc(collection(db, 'mentors'), firestoreData);

      const result = {
        id: mentorRef.id,
        userId: userId,
        ...mentorData
      };

      return result;
    } catch (error) {
      console.error('멘토 등록 실패:', error);
      throw error;
    }
  },

  // 멘토 목록 조회 (승인된 멘토만)
  async getMentors(gameType = 'all', filters = {}) {
    try {
      let q = collection(db, 'mentors');
      
      // 승인된 멘토만 조회 (isApproved가 true인 멘토만)
      q = query(q, where('isApproved', '==', true));
      
      // 게임 타입 필터
      if (gameType !== 'all') {
        q = query(q, where('selectedGame', '==', gameType));
      }
      
      // orderBy 제거하여 복합 인덱스 요구사항 회피
      const querySnapshot = await getDocs(q);
      const mentors = [];
      
      querySnapshot.forEach((doc) => {
        mentors.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 클라이언트에서 평점순 정렬
      mentors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
      return mentors;
    } catch (error) {
      console.error('멘토 목록 조회 실패:', error);
      throw error;
    }
  },

  // 멘토 목록 조회 (서버사이드용 - 직접 Firestore 호출, 승인된 멘토만)
  async getMentorsDirect(gameType = 'all', filters = {}) {
    try {
      let q = collection(db, 'mentors');
      
      // 승인된 멘토만 조회 (isApproved가 true인 멘토만)
      q = query(q, where('isApproved', '==', true));
      
      // 게임 타입 필터
      if (gameType !== 'all') {
        q = query(q, where('selectedGame', '==', gameType));
      }
      
      const querySnapshot = await getDocs(q);
      const mentors = [];
      
      querySnapshot.forEach((doc) => {
        mentors.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 클라이언트에서 정렬 (평점순)
      mentors.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
      return mentors;
    } catch (error) {
      console.error('멘토 목록 조회 실패:', error);
      throw error;
    }
  },

  // 상태별 멘토 목록 조회 (관리자용 - API 호출)
  async getMentorsByStatus(status) {
    try {
      const response = await fetch(`/api/admin/mentors?status=${status}`);
      if (!response.ok) {
        throw new Error('API 호출 실패');
      }
      
      const data = await response.json();
      return data.mentors;
    } catch (error) {
      console.error('상태별 멘토 목록 조회 실패:', error);
      throw error;
    }
  },

  // 멘토 상태 업데이트 (관리자용 - API 호출)
  async updateMentorStatus(mentorId, status, reason = '') {
    try {
      const response = await fetch(`/api/admin/mentors/${mentorId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, reason }),
      });

      if (!response.ok) {
        throw new Error('API 호출 실패');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('멘토 상태 업데이트 실패:', error);
      throw error;
    }
  },

  // 상태별 멘토 목록 조회 (서버사이드용 - 직접 Firestore 호출)
  async getMentorsByStatusDirect(status) {
    try {
      console.log('getMentorsByStatusDirect - 요청된 상태:', status);
      let q;
      
      if (status === 'pending') {
        // 대기 중: isApproved가 false이고 rejectionReason이 없는 멘토들 (아직 처리되지 않은 신청)
        q = query(
          collection(db, 'mentors'), 
          where('isApproved', '==', false)
        );
      } else if (status === 'approved') {
        // 승인됨: isApproved가 true인 멘토들
        q = query(collection(db, 'mentors'), where('isApproved', '==', true));
      } else if (status === 'rejected') {
        // 거절됨: rejectionReason이 있는 멘토들
        q = collection(db, 'mentors'); // 클라이언트에서 필터링
      } else {
        // 기본적으로 모든 멘토 조회
        q = collection(db, 'mentors');
      }
      
      const querySnapshot = await getDocs(q);
      let mentors = [];
      
      querySnapshot.forEach((doc) => {
        mentors.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('getMentorsByStatusDirect - 전체 멘토 수:', mentors.length);
      
      // 상태별 추가 필터링 (클라이언트에서)
      if (status === 'pending') {
        // 대기 중: isApproved가 false이고 rejectionReason이 없는 것들만
        mentors = mentors.filter(mentor => 
          mentor.isApproved === false && !mentor.rejectionReason
        );
        console.log('getMentorsByStatusDirect - 대기 중 멘토 수:', mentors.length);
      } else if (status === 'rejected') {
        // 거절됨: rejectionReason이 있는 것들만
        mentors = mentors.filter(mentor => mentor.rejectionReason);
        console.log('getMentorsByStatusDirect - 거절된 멘토 수:', mentors.length);
      }
      
      console.log('getMentorsByStatusDirect - 최종 반환 멘토 수:', mentors.length);
      return mentors;
    } catch (error) {
      console.error('상태별 멘토 목록 조회 실패:', error);
      throw error;
    }
  },

  // 멘토 상태 업데이트 (서버사이드용 - 직접 Firestore 호출)
  async updateMentorStatusDirect(mentorId, status, reason = '') {
    try {
      const mentorRef = doc(db, 'mentors', mentorId);
      const updateData = {
        updatedAt: serverTimestamp()
      };

      if (status === 'approved') {
        updateData.isApproved = true; // 승인 시 true
        updateData.approvedAt = serverTimestamp();
      } else if (status === 'rejected') {
        updateData.isApproved = false; // 거절 시 false
        updateData.rejectionReason = reason;
        updateData.rejectedAt = serverTimestamp();
      } else {
        updateData.isApproved = false; // 기본값은 false
      }

      await updateDoc(mentorRef, updateData);
      
      console.log(`멘토 ${mentorId} 상태가 ${status}로 업데이트됨`);
      return true;
    } catch (error) {
      console.error('멘토 상태 업데이트 실패:', error);
      throw error;
    }
  },

  // 개별 멘토 조회
  async getMentorById(mentorId) {
    try {
      const docRef = doc(db, 'mentors', mentorId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error('멘토를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('멘토 조회 실패:', error);
      throw error;
    }
  },

  // 피드백 요청
  async requestFeedback(mentorId, requestData, user = null) {
    try {
      // If user is not provided, try to get from auth
      let currentUser = user;
      if (!currentUser) {
        currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('로그인이 필요합니다.');
        }
      }

      console.log('🔍 requestFeedback 사용자 정보:', currentUser);

      // Use consistent user ID generation from community service
      const userId = communityService.generateConsistentUserId(currentUser);
      if (!userId) {
        throw new Error('사용자 정보가 올바르지 않습니다.');
      }

      const feedbackData = {
        mentorId,
        userId: userId,
        userName: currentUser.displayName || currentUser.name || currentUser.email,
        userPhoto: currentUser.photoURL || currentUser.image || null,
        userEmail: currentUser.email || '',
        ...requestData,
        status: 'pending', // pending, accepted, rejected, completed
        createdAt: serverTimestamp()
      };

      console.log('🔍 저장할 피드백 데이터:', feedbackData);

      const docRef = await addDoc(collection(db, 'feedback_requests'), feedbackData);
      
      console.log('🔍 피드백 요청 저장 완료:', docRef.id);
      
      return {
        id: docRef.id,
        ...feedbackData
      };
    } catch (error) {
      console.error('피드백 요청 실패:', error);
      throw error;
    }
  },

  // 멘토의 피드백 요청 목록 조회
  async getMentorFeedbackRequests(mentorId) {
    try {
      const q = query(
        collection(db, 'feedback_requests'),
        where('mentorId', '==', mentorId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const requests = [];
      
      querySnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return requests;
    } catch (error) {
      console.error('피드백 요청 목록 조회 실패:', error);
      throw error;
    }
  },

  // 피드백 요청 처리 (수락/거절)
  async handleFeedbackRequest(requestId, action, response = '', user = null) {
    try {
      // If user is not provided, try to get from auth
      let currentUser = user;
      if (!currentUser) {
        currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('로그인이 필요합니다.');
        }
      }

      console.log('🔍 handleFeedbackRequest:', { requestId, action, response, user: currentUser?.email });

      const requestRef = doc(db, 'feedback_requests', requestId);
      const updateData = {
        status: action, // 'accepted' or 'rejected'
        responseAt: serverTimestamp(),
        mentorResponse: response
      };

      await updateDoc(requestRef, updateData);
      
      console.log('🔍 피드백 요청 처리 완료:', { requestId, action });
      return true;
    } catch (error) {
      console.error('피드백 요청 처리 실패:', error);
      throw error;
    }
  },

  // 피드백 제출
  async submitFeedback(requestId, feedbackText, user = null) {
    try {
      // If user is not provided, try to get from auth
      let currentUser = user;
      if (!currentUser) {
        currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('로그인이 필요합니다.');
        }
      }

      console.log('🔍 submitFeedback:', { requestId, feedbackText, user: currentUser?.email });

      const requestRef = doc(db, 'feedback_requests', requestId);
      const updateData = {
        status: 'completed',
        feedback: feedbackText,
        completedAt: serverTimestamp()
      };

      await updateDoc(requestRef, updateData);
      
      // 멘토의 피드백 수 증가
      const requestSnap = await getDoc(requestRef);
      if (requestSnap.exists()) {
        const requestData = requestSnap.data();
        const mentorRef = doc(db, 'mentors', requestData.mentorId);
        const mentorSnap = await getDoc(mentorRef);
        
        if (mentorSnap.exists()) {
          await updateDoc(mentorRef, {
            totalFeedbacks: (mentorSnap.data().totalFeedbacks || 0) + 1
          });
          console.log('🔍 멘토 피드백 카운트 증가 완료');
        }
      }
      
      console.log('🔍 피드백 제출 완료:', requestId);
      return true;
    } catch (error) {
      console.error('피드백 제출 실패:', error);
      throw error;
    }
  },

  // 멘토 리뷰 추가 (새로운 형식)
  async addMentorReview(reviewData) {
    try {
      const docRef = await addDoc(collection(db, 'mentor_reviews'), {
        ...reviewData,
        createdAt: serverTimestamp()
      });
      
      // 멘토의 평점 업데이트
      await this.updateMentorRating(reviewData.mentorId);
      
      return {
        id: docRef.id,
        ...reviewData
      };
    } catch (error) {
      console.error('멘토 리뷰 추가 실패:', error);
      throw error;
    }
  },

  // 멘토 리뷰 추가 (기존 형식 - 호환성 유지)
  async addMentorReviewLegacy(mentorId, rating, reviewText) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const reviewData = {
        mentorId,
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL || null,
        rating,
        review: reviewText,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'mentor_reviews'), reviewData);
      
      // 멘토의 평점 업데이트
      await this.updateMentorRating(mentorId);
      
      return reviewData;
    } catch (error) {
      console.error('멘토 리뷰 추가 실패:', error);
      throw error;
    }
  },

  // 멘토 평점 업데이트
  async updateMentorRating(mentorId) {
    try {
      const q = query(
        collection(db, 'mentor_reviews'),
        where('mentorId', '==', mentorId)
      );
      
      const querySnapshot = await getDocs(q);
      let totalRating = 0;
      let reviewCount = 0;
      
      querySnapshot.forEach((doc) => {
        totalRating += doc.data().rating;
        reviewCount++;
      });
      
      const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;
      
      const mentorRef = doc(db, 'mentors', mentorId);
      await updateDoc(mentorRef, {
        rating: Number(averageRating.toFixed(1)),
        totalReviews: reviewCount
      });
      
      return averageRating;
    } catch (error) {
      console.error('멘토 평점 업데이트 실패:', error);
      throw error;
    }
  },

  // 멘토 리뷰 목록 조회
  async getMentorReviews(mentorId) {
    try {
      const q = query(
        collection(db, 'mentor_reviews'),
        where('mentorId', '==', mentorId)
      );
      
      const querySnapshot = await getDocs(q);
      const reviews = [];
      
      querySnapshot.forEach((doc) => {
        reviews.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 클라이언트에서 날짜순 정렬 (최신순)
      reviews.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      return reviews;
    } catch (error) {
      console.error('멘토 리뷰 목록 조회 실패:', error);
      return [];
    }
  },

  // userId로 사용자의 모든 멘토 프로필 조회 (승인/미승인 관계없이)
  async getAllMentorsByUserId(userId, userEmail = null) {
    try {
      console.log('🔍 getAllMentorsByUserId 시작:', {
        userId: userId,
        userEmail: userEmail,
        userIdType: typeof userId,
        userEmailType: typeof userEmail
      });
      
      if (!userId) {
        console.log('🔍 userId가 없음');
        return [];
      }

      // 먼저 모든 멘토를 조회하여 디버깅
      const allMentorsQuery = query(collection(db, 'mentors'));
      const allMentorsSnapshot = await getDocs(allMentorsQuery);
      console.log('🔍 전체 멘토 수:', allMentorsSnapshot.size);
      
      // userId 매칭 테스트
      const matchingMentors = [];
      const allMentorUserIds = new Set();
      allMentorsSnapshot.forEach(doc => {
        const data = doc.data();
        allMentorUserIds.add(data.userId);
        console.log(`🔍 멘토 비교:`, {
          mentorId: doc.id,
          mentorNickname: data.nickname,
          dbUserId: data.userId,
          requestUserId: userId,
          isMatch: data.userId === userId,
          userEmail: data.userEmail
        });
        if (data.userId === userId) {
          matchingMentors.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      console.log('🔍 DB에 있는 모든 멘토의 userId 목록:', Array.from(allMentorUserIds));
      console.log('🔍 요청한 userId:', userId);

      console.log(`🔍 정확히 일치하는 멘토: ${matchingMentors.length}개`);
      
      if (matchingMentors.length > 0) {
        return matchingMentors;
      }

      // 정확한 매칭이 없으면 이메일 기반으로도 찾아보기
      console.log('🔍 정확한 userId 매칭 실패, 이메일 기반으로 재검색');
      
      // 현재 사용자의 이메일을 가져와서 이메일 기반으로 검색
      let currentUserEmail = userEmail; // 전달받은 이메일 우선 사용
      if (!currentUserEmail && userId?.includes('@')) {
        currentUserEmail = userId; // userId가 이메일인 경우
      }
      
      if (currentUserEmail) {
        console.log('🔍 이메일 기반 검색:', currentUserEmail);
        allMentorsSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.userEmail === currentUserEmail) {
            console.log('🔍 이메일로 멘토 발견:', {
              mentorId: doc.id,
              mentorNickname: data.nickname,
              mentorEmail: data.userEmail
            });
            matchingMentors.push({
              id: doc.id,
              ...data
            });
          }
        });
        
        if (matchingMentors.length > 0) {
          console.log(`🔍 이메일 기반으로 ${matchingMentors.length}개 멘토 발견`);
          return matchingMentors;
        }
      }

      // 그래도 없으면 다양한 형태로 시도
      const possibleIds = new Set([
        userId,
        userId?.toString(),
        // 이메일 형태일 경우 변환
        userId?.includes('@') ? userId.replace(/[^a-zA-Z0-9]/g, '_') : null,
        userId?.includes('@') ? userId.split('@')[0] : null,
      ]);
      
      // null 값 제거
      const finalIds = Array.from(possibleIds).filter(Boolean);
      console.log('🔍 멘토 검색할 ID 목록:', finalIds);
      
      // 각 ID에 대해 멘토 검색 (승인/미승인 관계없이 모든 멘토)
      const queries = [];
      finalIds.forEach(id => {
        queries.push(query(
          collection(db, 'mentors'),
          where('userId', '==', id)
        ));
      });
      
      // 쿼리를 순차적으로 실행 (연결 안정성 향상)
      const allMentors = [];
      for (const q of queries) {
        try {
          const snapshot = await getDocs(q);
          snapshot.forEach(doc => {
            allMentors.push({
              id: doc.id,
              ...doc.data()
            });
          });
        } catch (error) {
          console.error('🔍 개별 멘토 쿼리 실행 오류:', error);
        }
      }
      
      console.log('🔍 찾은 모든 멘토 프로필:', allMentors.length + '개');
      return allMentors;
    } catch (error) {
      console.error('userId로 모든 멘토 조회 실패:', error);
      return [];
    }
  },

  // userId로 멘토 정보 조회 (멘토 상태 확인용)
  async getMentorByUserId(userId) {
    try {
      console.log('🔍 getMentorByUserId 시작 - userId:', userId);
      
      if (!userId) {
        console.log('🔍 userId가 없음');
        return null;
      }

      // 사용자 ID의 다양한 형태 생성 (일관된 ID 검색)
      const possibleIds = new Set([
        userId,
        userId?.toString(),
        // 이메일 형태일 경우 변환
        userId?.includes('@') ? userId.replace(/[^a-zA-Z0-9]/g, '_') : null,
        userId?.includes('@') ? userId.split('@')[0] : null,
      ]);
      
      // null 값 제거
      const finalIds = Array.from(possibleIds).filter(Boolean);
      console.log('🔍 멘토 검색할 ID 목록:', finalIds);
      
      // 각 ID에 대해 멘토 검색
      const queries = [];
      finalIds.forEach(id => {
        queries.push(query(
          collection(db, 'mentors'),
          where('userId', '==', id)
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
          console.error('🔍 개별 멘토 쿼리 실행 오류:', error);
          snapshots.push({ docs: [] });
        }
      }
      
      // 승인된 멘토 정보만 반환 (승인된 멘토만이 피드백을 받을 수 있음)
      let mentorDoc = null;
      
      for (const snapshot of snapshots) {
        const approvedMentor = snapshot.docs.find(doc => doc.data().isApproved === true);
        if (approvedMentor) {
          mentorDoc = approvedMentor;
          break;
        }
      }
      
      if (!mentorDoc) {
        console.log('🔍 해당 userId의 승인된 멘토 정보 없음');
        return null;
      }
      
      const mentorData = {
        id: mentorDoc.id,
        ...mentorDoc.data()
      };
      
      console.log('🔍 찾은 멘토 정보:', mentorData);
      return mentorData;
    } catch (error) {
      console.error('userId로 멘토 조회 실패:', error);
      return null;
    }
  }
};