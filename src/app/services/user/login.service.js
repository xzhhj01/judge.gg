import { auth, db } from "@/lib/firebase/firebase.config";
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export const loginService = {
  // Google 로그인 (팝업 방식)
  async login() {
    try {
      const provider = new GoogleAuthProvider();
      
      // 먼저 팝업 방식 시도
      try {
        const result = await signInWithPopup(auth, provider);
        await this.handleUserData(result.user);
        return this.formatUserData(result.user);
      } catch (popupError) {
        // 팝업이 차단된 경우 리디렉션 방식 사용
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
          console.log('팝업이 차단되어 리디렉션 방식으로 전환합니다.');
          await signInWithRedirect(auth, provider);
          return null; // 리디렉션 후에는 페이지가 새로고침됨
        }
        throw popupError;
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error;
    }
  },

  // 리디렉션 결과 처리 (페이지 로드 시 호출)
  async handleRedirectResult() {
    try {
      const result = await getRedirectResult(auth);
      if (result && result.user) {
        await this.handleUserData(result.user);
        return this.formatUserData(result.user);
      }
      return null;
    } catch (error) {
      console.error('리디렉션 로그인 처리 실패:', error);
      throw error;
    }
  },

  // 사용자 데이터 처리
  async handleUserData(user) {
    const userRef = doc(db, 'users', user.uid);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      // 새 사용자인 경우 기본 프로필 생성
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        lolRiotId: '',
        valorantRiotId: '',
        isMentor: false,
        mentorInfo: null
      });
    } else {
      // 기존 사용자인 경우 마지막 로그인 시간 업데이트
      await setDoc(userRef, {
        lastLoginAt: serverTimestamp()
      }, { merge: true });
    }
  },

  // 사용자 데이터 포맷
  formatUserData(user) {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
  },

  // 로그아웃
  async logout() {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw error;
    }
  },

  // 인증 상태 변화 감지
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  },

  // 현재 사용자 정보 가져오기
  getCurrentUser() {
    return auth.currentUser;
  },

  // 사용자 프로필 가져오기
  async getUserProfile(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnapshot = await getDoc(userRef);
      
      if (userSnapshot.exists()) {
        return userSnapshot.data();
      }
      return null;
    } catch (error) {
      console.error('사용자 프로필 가져오기 실패:', error);
      throw error;
    }
  }
};
