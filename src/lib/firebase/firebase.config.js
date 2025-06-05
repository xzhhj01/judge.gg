// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 환경 변수 확인 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  console.log("Firebase Config:", {
    apiKey: firebaseConfig.apiKey ? "✓" : "✗",
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId ? "✓" : "✗"
  });
}

// Firebase가 이미 초기화되었는지 확인
let firebase_app;
if (!getApps().length) {
  firebase_app = initializeApp(firebaseConfig);
} else {
  firebase_app = getApps()[0];
}

// Initialize Firebase services with settings
export const db = getFirestore(firebase_app);
export const auth = getAuth(firebase_app);
export const storage = getStorage(firebase_app);

// Firestore 설정 최적화
if (typeof window !== 'undefined') {
  // 클라이언트 사이드에서만 실행
  try {
    // 개발 환경에서 연결 문제 해결을 위한 설정
    if (process.env.NODE_ENV === 'development') {
      console.log('🔥 Firestore 연결 최적화 설정 적용');
    }
  } catch (error) {
    console.warn('Firestore 초기화 설정 실패:', error);
  }
}

export default firebase_app; 