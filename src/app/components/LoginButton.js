'use client';

import { signIn, signOut, useSession } from "next-auth/react";
import { useEffect } from 'react';
import { loginService } from "../services/user/login.service";

export default function LoginButton() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.idToken) {
      loginService
        .login(session.idToken)
        .catch((err) => {
          console.error("communityService 로그인 실패:", err);
        });
    }
  }, [status, session]);

  if (status === "loading") {
    return null;
  }

  if (session) {
    return (
      <button
        onClick={() => signOut()}
        className="px-4 py-2 bg-red-500 text-white rounded"
      >
        로그아웃
      </button>
    );
  }

  return (
    <button
      onClick={() => signIn('google')}
      className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded"
    >
      <img
        src="https://www.google.com/favicon.ico"
        alt="Google"
        className="w-4 h-4"
      />
      <span className="text-sm text-black">구글로 로그인</span>
    </button>
  );
}
