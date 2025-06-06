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
            const result = await signIn("google", {
                callbackUrl: "/",
                redirect: true,
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
            setLoading(true);

            // NextAuth 로그아웃
            await signOut({
                callbackUrl: "/login",
                redirect: false,
            });

            // 로그인 페이지로 이동 및 상태 새로고침
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("로그아웃 실패:", error);
            // 에러가 발생해도 로그인 페이지로 이동
            router.push("/login");
        } finally {
            setLoading(false);
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
                            className="w-6 h-6 rounded-full"
                        />
                    )}
                    <span className="text-sm text-white">
                        {session.user.name || session.user.email}
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
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
