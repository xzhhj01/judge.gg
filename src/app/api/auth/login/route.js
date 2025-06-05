import { NextResponse } from 'next/server';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/firebase.config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Firebase Authentication으로 로그인
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 마지막 로그인 시간 업데이트
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      }
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    
    let errorMessage = '로그인에 실패했습니다.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = '등록되지 않은 이메일입니다.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = '비밀번호가 올바르지 않습니다.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = '올바르지 않은 이메일 형식입니다.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }
}