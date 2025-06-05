import { NextResponse } from 'next/server';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/firebase.config';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    const {
      username,
      email,
      password,
      nickname,
      role = 'USER',
      lolTier = null,
      lolNickname = null,
      lolUserNum = null,
      valTier = null,
      valNickname = null,
      valUserNum = null
    } = await request.json();

    if (!username || !email || !password || !nickname) {
      return NextResponse.json(
        { error: '모든 필수 정보를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Firebase Authentication으로 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 사용자 프로필 업데이트
    await updateProfile(user, {
      displayName: nickname
    });

    // Firestore에 사용자 정보 저장
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      username,
      nickname,
      email,
      role,
      lolTier,
      lolNickname,
      lolUserNum,
      valTier,
      valNickname,
      valUserNum,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      isMentor: false,
      mentorInfo: null
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: nickname
      }
    });

  } catch (error) {
    console.error('회원가입 오류:', error);
    
    let errorMessage = '회원가입에 실패했습니다.';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = '이미 사용 중인 이메일입니다.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = '비밀번호가 너무 약합니다. 6자 이상으로 설정해주세요.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '올바르지 않은 이메일 형식입니다.';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}