"use client";

import { useState, useEffect } from "react";
import { loginService } from "../services/user/login.service";
import { auth } from "@/lib/firebase/firebase.config";
import { onAuthStateChanged } from "firebase/auth";

export default function LoginButton() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        // 페이지 로드 시 리디렉션 결과 처리
        loginService.handleRedirectResult().catch((error) => {
            console.error('리디렉션 결과 처리 실패:', error);
        });

        return () => unsubscribe();
    }, []);

    const handleLogin = async () => {
        try {
            setLoading(true);
            const result = await loginService.login();
            
            // 리디렉션 방식인 경우 result가 null일 수 있음
            if (result === null) {
                // 리디렉션이 진행 중이므로 로딩 상태 유지
                return;
            }
            
        } catch (error) {
            console.error("로그인 실패:", error);
            
            let errorMessage = "로그인에 실패했습니다.";
            
            if (error.code === 'auth/popup-blocked') {
                errorMessage = "팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용하고 다시 시도해주세요.";
            } else if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = "로그인 창이 닫혔습니다. 다시 시도해주세요.";
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = "네트워크 연결을 확인하고 다시 시도해주세요.";
            } else if (error.code === 'auth/unauthorized-domain') {
                errorMessage = "현재 도메인에서는 로그인할 수 없습니다.";
            }
            
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await loginService.logout();
        } catch (error) {
            console.error("로그아웃 실패:", error);
        }
    };

    if (loading) {
        return (
            <div className="px-4 py-2 bg-gray-200 rounded animate-pulse">
                로딩...
            </div>
        );
    }

    if (user) {
        return (
            <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                    {user.photoURL && (
                        <img
                            src={user.photoURL}
                            alt="프로필"
                            className="w-8 h-8 rounded-full"
                        />
                    )}
                    <span className="text-sm text-gray-700">
                        {user.displayName || user.email}
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
