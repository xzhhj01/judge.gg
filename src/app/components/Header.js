"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/utils/providers";
import { useSession } from "next-auth/react";
import { useTheme } from "./ThemeProvider";
import LoginButton from "./LoginButton";

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading } = useAuth();
    const { data: session, status } = useSession();

    const { theme, toggleTheme } = useTheme();
    const [currentGame, setCurrentGame] = useState("lol");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 현재 경로에서 게임 타입 감지
    const detectCurrentGame = () => {
        if (pathname.includes("/mypage")) return "none"; // 마이페이지는 게임 선택 안함
        if (pathname.includes("/mentor")) return "none"; // 멘토 페이지는 게임 선택 안함
        if (pathname.includes("/login")) return "none"; // 로그인 페이지는 게임 선택 안함
        if (pathname.includes("/signup")) return "none"; // 회원가입 페이지는 게임 선택 안함
        if (pathname.includes("/valorant")) return "valorant";
        return "lol";
    };

    // 페이지 로드 시 현재 게임 상태 설정
    useEffect(() => {
        setCurrentGame(detectCurrentGame());
    }, [pathname]);

    // 드롭다운 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // 게임 변경 핸들러
    const handleGameChange = (game) => {
        setCurrentGame(game);
        setIsDropdownOpen(false);

        // 멘토 페이지에서는 게임 변경 시 해당 게임의 커뮤니티로 이동
        if (pathname.includes("/mentor")) {
            router.push(`/${game}/community`);
            return;
        }

        // 현재 경로에서 게임 부분만 변경
        let newPath = pathname;
        if (pathname.includes("/lol")) {
            newPath = pathname.replace("/lol", `/${game}`);
        } else if (pathname.includes("/valorant")) {
            newPath = pathname.replace("/valorant", `/${game}`);
        } else {
            // 메인 페이지인 경우
            newPath = `/${game}`;
        }

        router.push(newPath);
    };

    if (!mounted) {
        return null;
    }

    return (
        <header className="bg-[#0c0032] border-b border-[#0c0032] sticky top-0 z-50 backdrop-blur-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* 왼쪽: 로고 + 게임 선택 */}
                    <div className="flex items-center space-x-6">
                        {/* Judge.gg 로고 */}
                        <Link
                            href="/"
                            className="flex items-center hover:opacity-80 transition-opacity"
                        >
                            <img
                                src="/logo.svg"
                                alt="Judge.gg"
                                className="w-40 h-40"
                            />
                        </Link>

                        {/* 게임 탭 */}
                        <div className="hidden md:flex items-center space-x-1 bg-[#0c0032] rounded-lg p-1 border border-white/10">
                            <button
                                onClick={() => handleGameChange("lol")}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    currentGame === "lol"
                                        ? "bg-white/10 text-white shadow-sm border border-white/20"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <img
                                        src="/logo-lol.svg"
                                        alt="LoL"
                                        className="w-5 h-5"
                                    />
                                    <span>LoL</span>
                                </div>
                            </button>
                            <button
                                onClick={() => handleGameChange("valorant")}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    currentGame === "valorant"
                                        ? "bg-white/10 text-white shadow-sm border border-white/20"
                                        : "text-white/60 hover:text-white hover:bg-white/5"
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <img
                                        src="/logo-valorant.svg"
                                        alt="VALORANT"
                                        className="w-5 h-5"
                                    />
                                    <span>VALORANT</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* 중앙: 네비게이션 */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link
                            href={`/${
                                currentGame === "none" ? "lol" : currentGame
                            }/community`}
                            className={`text-sm font-medium transition-colors ${
                                pathname.includes("/community")
                                    ? "text-white"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            법원
                        </Link>
                        <Link
                            href="/mentor"
                            className={`text-sm font-medium transition-colors ${
                                pathname.includes("/mentor")
                                    ? "text-white"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            멘토
                        </Link>
                    </nav>

                    {/* 오른쪽: 다크모드 토글 + 사용자 메뉴 */}
                    <div className="flex items-center space-x-4">
                        {/* 다크모드 토글 */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg bg-[#0c0032] hover:bg-[#0c0032] transition-colors text-white/60 hover:text-white"
                            aria-label="다크모드 토글"
                        >
                            {theme === "light" ? (
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                            )}
                        </button>

                        {/* 로그인/사용자 정보 */}
                        {!loading && status !== "loading" && (
                            <>
                                {user || session ? (
                                    <div className="flex items-center space-x-3">
                                        <Link
                                            href="/mypage"
                                            className={`text-sm font-medium transition-colors ${
                                                pathname.includes("/mypage")
                                                    ? "text-white"
                                                    : "text-white/60 hover:text-white"
                                            }`}
                                        >
                                            마이페이지
                                        </Link>
                                        <LoginButton />
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-3">
                                        <Link
                                            href="/login"
                                            className="text-white/60 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/20"
                                        >
                                            로그인
                                        </Link>
                                        <LoginButton />
                                    </div>
                                )}
                            </>
                        )}

                        {/* 모바일 메뉴 버튼 */}
                        <button
                            onClick={() =>
                                setIsMobileMenuOpen(!isMobileMenuOpen)
                            }
                            className="md:hidden p-2 rounded-lg bg-[#0c0032] hover:bg-[#0c0032] transition-colors text-white/60 hover:text-white"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d={
                                        isMobileMenuOpen
                                            ? "M6 18L18 6M6 6l12 12"
                                            : "M4 6h16M4 12h16M4 18h16"
                                    }
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 모바일 메뉴 */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-white/10 py-4 space-y-4">
                        {/* 모바일 게임 선택 */}
                        <div className="flex space-x-2">
                            <button
                                onClick={() => {
                                    handleGameChange("lol");
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`flex-1 p-3 rounded-lg text-sm font-medium transition-all ${
                                    currentGame === "lol"
                                        ? "bg-[#0c0032] text-white border border-white/20"
                                        : "bg-[#0c0032] text-white/60"
                                }`}
                            >
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 bg-lol-500 rounded"></div>
                                    <span>LoL</span>
                                </div>
                            </button>
                            <button
                                onClick={() => {
                                    handleGameChange("valorant");
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`flex-1 p-3 rounded-lg text-sm font-medium transition-all ${
                                    currentGame === "valorant"
                                        ? "bg-[#0c0032] text-white border border-white/20"
                                        : "bg-[#0c0032] text-white/60"
                                }`}
                            >
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 bg-valorant-500 rounded"></div>
                                    <span>VALORANT</span>
                                </div>
                            </button>
                        </div>

                        {/* 모바일 네비게이션 */}
                        <div className="space-y-2">
                            <Link
                                href={`/${
                                    currentGame === "none" ? "lol" : currentGame
                                }/community`}
                                className="block w-full text-left p-3 rounded-lg text-white/60 hover:text-white transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                법원
                            </Link>
                            <Link
                                href="/mentor"
                                className="block w-full text-left p-3 rounded-lg text-white/60 hover:text-white transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                멘토
                            </Link>
                            {user || session ? (
                                <Link
                                    href="/mypage"
                                    className="block w-full text-left p-3 rounded-lg text-white/60 hover:text-white transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    마이페이지
                                </Link>
                            ) : (
                                <div className="space-y-2">
                                    <Link
                                        href="/login"
                                        className="block w-full text-left p-3 rounded-lg text-white/60 hover:text-white transition-colors"
                                        onClick={() =>
                                            setIsMobileMenuOpen(false)
                                        }
                                    >
                                        로그인
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
