"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginButton() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        try {
            setLoading(true);
            const result = await signIn('google', { 
                callbackUrl: '/',
                redirect: true 
            });
        } catch (error) {
            console.error("로그인 실패:", error);
            alert("로그인에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            // 세션 완전 정리를 위해 강제 새로고침과 함께 로그아웃
            await signOut({ 
                callbackUrl: '/',
                redirect: false 
            });
            
            // 로컬 스토리지 및 세션 스토리지 정리
            localStorage.clear();
            sessionStorage.clear();
            
            // 강제 페이지 새로고침으로 모든 상태 초기화
            window.location.href = '/';
        } catch (error) {
            console.error("로그아웃 실패:", error);
            // 에러가 발생해도 강제로 메인 페이지로 이동
            window.location.href = '/';
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="px-4 py-2 bg-gray-200 rounded animate-pulse">
                로딩...
            </div>
        );
    }

    if (session?.user) {
        return (
            <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                    {session.user.image && (
                        <img
                            src={session.user.image}
                            alt="프로필"
                            className="w-8 h-8 rounded-full"
                        />
                    )}
                    <span className="text-sm text-gray-700">
                        {session.user.name || session.user.email}
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                >
                    로그아웃
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={handleLogin}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
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
