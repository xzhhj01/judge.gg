"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const [currentGame, setCurrentGame] = useState("lol");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

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

    const currentGameData = {
        lol: {
            name: "LoL",
            logo: "/logo-lol.svg",
        },
        valorant: {
            name: "VALORANT",
            logo: "/logo-valorant.svg",
        },
        none: {
            name: "게임",
            logo: "/logo-service.svg", // 기본 로고 사용
        },
    };

    const games = [
        {
            key: "lol",
            name: "LoL",
            logo: "/logo-lol.svg",
        },
        {
            key: "valorant",
            name: "VALORANT",
            logo: "/logo-valorant.svg",
        },
    ];

    return (
        <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50 animate-slide-in">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* 왼쪽: 서비스 로고 + 게임 드롭다운 */}
                    <div className="flex items-center space-x-6">
                        {/* 서비스 로고 */}
                        <Link
                            href="/"
                            className="flex items-center hover:opacity-80 transition-opacity"
                        >
                            <img
                                src="/logo-service.svg"
                                alt="Judge.gg"
                                className="h-8 w-auto"
                                onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display =
                                        "block";
                                }}
                            />
                            <span
                                className="text-xl font-bold text-gray-900 hidden"
                                style={{ display: "none" }}
                            >
                                Judge.gg
                            </span>
                        </Link>

                        {/* 구분선 */}
                        <div className="h-6 w-px bg-gray-300"></div>

                        {/* 게임 드롭다운 */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() =>
                                    setIsDropdownOpen(!isDropdownOpen)
                                }
                                className={`flex items-center justify-between w-48 px-3 py-2 rounded-lg transition-all duration-200 border ${
                                    currentGame === "none"
                                        ? "bg-gray-100 border-gray-300 text-gray-500"
                                        : "bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    {/* 현재 게임 로고 */}
                                    {currentGame !== "none" && (
                                        <img
                                            src={
                                                currentGameData[currentGame]
                                                    .logo
                                            }
                                            alt={
                                                currentGameData[currentGame]
                                                    .name
                                            }
                                            className="h-4 w-4"
                                            onError={(e) => {
                                                e.target.style.display = "none";
                                            }}
                                        />
                                    )}
                                    {currentGame === "none" && (
                                        <svg
                                            className="h-4 w-4 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2"
                                            />
                                        </svg>
                                    )}

                                    {/* 게임 이름 */}
                                    <span
                                        className={`text-sm font-medium ${
                                            currentGame === "none"
                                                ? "text-gray-500"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {currentGameData[currentGame].name}
                                    </span>
                                </div>

                                {/* 드롭다운 화살표 */}
                                <svg
                                    className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${
                                        currentGame === "none"
                                            ? "text-gray-400"
                                            : "text-gray-500"
                                    } ${isDropdownOpen ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </button>

                            {/* 드롭다운 메뉴 */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 animate-fade-in">
                                    {games.map((game) => (
                                        <button
                                            key={game.key}
                                            onClick={() =>
                                                handleGameChange(game.key)
                                            }
                                            className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                                                currentGame === game.key &&
                                                currentGame !== "none"
                                                    ? "bg-gray-100"
                                                    : ""
                                            }`}
                                        >
                                            <img
                                                src={game.logo}
                                                alt={game.name}
                                                className="h-5 w-5"
                                            />
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {game.name}
                                                </div>
                                            </div>
                                            {currentGame === game.key &&
                                                currentGame !== "none" && (
                                                    <svg
                                                        className="w-4 h-4 text-primary-500 ml-auto"
                                                        fill="currentColor"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 중앙: 네비게이션 메뉴 */}
                    <nav className="flex items-center space-x-8">
                        <Link
                            href={`/${
                                currentGame === "none" ? "lol" : currentGame
                            }/community`}
                            className={`text-gray-700 hover:text-primary-600 font-medium transition-all duration-200 hover:scale-105 ${
                                pathname.includes("/community")
                                    ? "text-primary-600 font-semibold"
                                    : ""
                            }`}
                        >
                            법원
                        </Link>
                        <Link
                            href="/mentor"
                            className={`text-gray-700 hover:text-primary-600 font-medium transition-all duration-200 hover:scale-105 ${
                                pathname.includes("/mentor")
                                    ? "text-primary-600 font-semibold"
                                    : ""
                            }`}
                        >
                            변호사
                        </Link>
                    </nav>

                    {/* 오른쪽: 마이페이지 + 로그인 */}
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/mypage"
                            className={`text-gray-700 hover:text-primary-600 font-medium transition-all duration-200 hover:scale-105 ${
                                pathname.includes("/mypage")
                                    ? "text-primary-600 font-semibold"
                                    : ""
                            }`}
                        >
                            마이페이지
                        </Link>
                        <Link
                            href="/login"
                            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg"
                        >
                            로그인
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
}
