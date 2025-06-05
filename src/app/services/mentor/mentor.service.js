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

      // Create a unique user ID from email if uid is not available
      const userId = currentUser.uid || currentUser.email?.replace(/[^a-zA-Z0-9]/g, '_');
      console.log('생성된 userId:', userId);
      
      if (!userId) {
        console.log('userId 생성 실패');
        throw new Error('사용자 정보가 올바르지 않습니다.');
      }

      // Firestore에 저장할 데이터 준비 (undefined 값 제거)
      const firestoreData = {
        userId: userId,
        userEmail: currentUser.email || '',
        userName: currentUser.name || currentUser.displayName || '',
        userPhoto: currentUser.image || currentUser.photoURL || '',
        ...mentorData,
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
      let q;
      
      if (status === 'pending') {
        // 대기 중: isApproved가 false인 멘토들
        q = query(collection(db, 'mentors'), where('isApproved', '==', false));
      } else if (status === 'approved') {
        // 승인됨: isApproved가 true인 멘토들
        q = query(collection(db, 'mentors'), where('isApproved', '==', true));
      } else {
        // 기본적으로 모든 멘토 조회
        q = collection(db, 'mentors');
      }
      
      const querySnapshot = await getDocs(q);
      const mentors = [];
      
      querySnapshot.forEach((doc) => {
        mentors.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
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
  async requestFeedback(mentorId, requestData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const feedbackData = {
        mentorId,
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL || null,
        ...requestData,
        status: 'pending', // pending, accepted, rejected, completed
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'feedback_requests'), feedbackData);
      
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
  async handleFeedbackRequest(requestId, action, response = '') {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

      const requestRef = doc(db, 'feedback_requests', requestId);
      const updateData = {
        status: action, // 'accepted' or 'rejected'
        responseAt: serverTimestamp(),
        mentorResponse: response
      };

      await updateDoc(requestRef, updateData);
      
      return true;
    } catch (error) {
      console.error('피드백 요청 처리 실패:', error);
      throw error;
    }
  },

  // 피드백 제출
  async submitFeedback(requestId, feedbackText) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('로그인이 필요합니다.');
      }

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
        const mentorRef = doc(db, 'mentors', requestSnap.data().mentorId);
        const mentorSnap = await getDoc(mentorRef);
        
        if (mentorSnap.exists()) {
          await updateDoc(mentorRef, {
            totalFeedbacks: (mentorSnap.data().totalFeedbacks || 0) + 1
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('피드백 제출 실패:', error);
      throw error;
    }
  },

  // 멘토 리뷰 추가
  async addMentorReview(mentorId, rating, reviewText) {
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
  }
};