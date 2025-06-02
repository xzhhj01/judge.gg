"use client";

import { useState } from "react";
import PostCard from "../../../components/PostCard";
import PostFilter from "../../../components/PostFilter";

export default function LoLCommunityPage() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedSituation, setSelectedSituation] = useState("");
    const [selectedChampion, setSelectedChampion] = useState("");
    const [championSearch, setChampionSearch] = useState("");
    const [showMoreChampions, setShowMoreChampions] = useState(false);

    // 더미 데이터
    const mockPosts = [
        {
            id: 1,
            title: "정글러가 갱킹 안 와주는데 이게 정상인가요?",
            votes: 23,
            views: 156,
            tags: ["정글", "갱킹", "라이너"],
            author: { nickname: "소환사123", tier: "Gold" },
            commentCount: 15,
            createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30분 전
        },
        {
            id: 2,
            title: "야스오 픽했는데 팀이 욕하는 상황",
            votes: 45,
            views: 289,
            tags: ["야스오", "챔피언 선택", "팀워크"],
            author: { nickname: "바람검객", tier: "Platinum" },
            commentCount: 32,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2시간 전
        },
        {
            id: 3,
            title: "서포터가 와드 안 박는데 어떻게 해야 하나요?",
            votes: 18,
            views: 94,
            tags: ["서포터", "와드", "시야"],
            author: { nickname: "ADC마스터", tier: "Diamond" },
            commentCount: 8,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5시간 전
        },
    ];

    const situations = [];

    // 필터 핸들러 함수들
    const handleSortChange = (sortType) => {
        console.log("정렬 변경:", sortType);
        // TODO: 백엔드 API 호출
    };

    const handleSearchChange = (query) => {
        console.log("검색어 변경:", query);
        // TODO: 백엔드 API 호출
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 1. Community Info */}
            <div className="relative h-40 bg-gradient-to-r from-lol-400 to-lol-600 overflow-hidden">
                {/* 배경 이미지 영역 */}
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-6">
                    {/* 게임 로고 아이콘 영역 */}
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-lg">
                            <img
                                src="/logo-lol.svg"
                                alt="LoL"
                                className="w-10 h-10"
                            />
                        </div>

                        {/* 설명 */}
                        <div className="text-white">
                            <h1 className="text-3xl font-bold mb-2">
                                리그 오브 레전드 법원
                            </h1>
                            <p className="text-lol-100">
                                소환사의 협곡에서 발생한 분쟁을 공정하게
                                심판합니다
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    {/* 2. Sidebar */}
                    <div className="w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-24">
                            <h3 className="font-semibold text-gray-900 mb-4">
                                카테고리
                            </h3>

                            {/* 전체 */}
                            <button
                                onClick={() => setSelectedCategory("all")}
                                className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
                                    selectedCategory === "all"
                                        ? "bg-lol-100 text-lol-700 font-medium"
                                        : "hover:bg-gray-100"
                                }`}
                            >
                                전체
                            </button>

                            {/* 상황별 */}
                            <div className="mb-4">
                                <button
                                    onClick={() =>
                                        setSelectedCategory("situation")
                                    }
                                    className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
                                        selectedCategory === "situation"
                                            ? "bg-lol-100 text-lol-700 font-medium"
                                            : "hover:bg-gray-100"
                                    }`}
                                >
                                    상황별
                                </button>

                                {selectedCategory === "situation" && (
                                    <div className="ml-4 space-y-1">
                                        {situations.map((situation) => (
                                            <button
                                                key={situation}
                                                onClick={() =>
                                                    setSelectedSituation(
                                                        situation
                                                    )
                                                }
                                                className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                                                    selectedSituation ===
                                                    situation
                                                        ? "bg-lol-50 text-lol-600"
                                                        : "hover:bg-gray-50"
                                                }`}
                                            >
                                                {situation}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 챔피언별 */}
                            <div>
                                <button
                                    onClick={() =>
                                        setSelectedCategory("champion")
                                    }
                                    className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
                                        selectedCategory === "champion"
                                            ? "bg-lol-100 text-lol-700 font-medium"
                                            : "hover:bg-gray-100"
                                    }`}
                                >
                                    챔피언별
                                </button>

                                {selectedCategory === "champion" && (
                                    <div className="ml-4">
                                        {/* 챔피언 검색 */}
                                        <input
                                            type="text"
                                            placeholder="챔피언 검색..."
                                            value={championSearch}
                                            onChange={(e) =>
                                                setChampionSearch(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-lol-500 focus:border-transparent"
                                        />

                                        {/* 챔피언 목록 (일단 빈 상태) */}
                                        <div className="text-sm text-gray-500 text-center py-4">
                                            챔피언 데이터 준비중...
                                        </div>

                                        {!showMoreChampions && (
                                            <button
                                                onClick={() =>
                                                    setShowMoreChampions(true)
                                                }
                                                className="w-full text-sm text-lol-600 hover:text-lol-700 py-2"
                                            >
                                                더보기
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 메인 컨텐츠 */}
                    <div className="flex-1">
                        {/* 3. Filter */}
                        <PostFilter
                            gameType="lol"
                            onSortChange={handleSortChange}
                            onSearchChange={handleSearchChange}
                        />

                        {/* 4. Body - 게시글 목록 */}
                        <div className="space-y-4">
                            {mockPosts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    gameType="lol"
                                />
                            ))}
                        </div>

                        {/* 더 보기 버튼 */}
                        <div className="text-center mt-8">
                            <button className="px-6 py-3 bg-lol-500 text-white rounded-lg hover:bg-lol-600 transition-colors">
                                더 많은 게시글 보기
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 플로팅 글쓰기 버튼 */}
            <div className="fixed bottom-6 right-32 z-50 group flex flex-col items-center">
                {/* 말풍선 툴팁 */}
                <div
                    className="mb-4 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-200"
                    style={{
                        animation: "float 3s ease-in-out infinite",
                    }}
                >
                    ⚖️ 새 재판 열기
                    {/* 말풍선 꼬리 */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                </div>

                <button
                    onClick={() =>
                        (window.location.href = "/lol/community/write")
                    }
                    className="w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
                    style={{
                        backgroundColor: "#3B82F6",
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#2563EB";
                        e.target.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#3B82F6";
                        e.target.style.transform = "scale(1)";
                    }}
                >
                    <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                </button>
            </div>

            {/* CSS 애니메이션 정의 */}
            <style jsx>{`
                @keyframes float {
                    0%,
                    100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-8px);
                    }
                }
            `}</style>
        </div>
    );
}
