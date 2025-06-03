"use client";

import { useState } from "react";
import PostCard from "../../../components/PostCard";
import PostFilter from "../../../components/PostFilter";
import CommunityHeader from "../../../components/CommunityHeader";

export default function ValorantCommunityPage() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedSituation, setSelectedSituation] = useState("");
    const [selectedMap, setSelectedMap] = useState("");
    const [selectedAgentCategory, setSelectedAgentCategory] = useState("");
    const [selectedAgent, setSelectedAgent] = useState("");
    const [agentSearch, setAgentSearch] = useState("");
    const [sortBy, setSortBy] = useState("latest");
    const [searchQuery, setSearchQuery] = useState("");
    const [showMoreAgents, setShowMoreAgents] = useState(false);

    // 더미 데이터
    const mockPosts = [
        {
            id: 1,
            title: "스파이크 설치 후 팀원이 이상한 곳에서 수비하는 상황",
            votes: 31,
            views: 203,
            tags: ["스파이크", "포지셔닝", "팀워크"],
            author: { nickname: "레이나마스터", tier: "Diamond" },
            commentCount: 18,
            createdAt: new Date(Date.now() - 1000 * 60 * 45), // 45분 전
        },
        {
            id: 2,
            title: "듀얼리스트가 엔트리 안 하고 뒤에서 킬 스틸만 하는 경우",
            votes: 52,
            views: 341,
            tags: ["듀얼리스트", "엔트리", "역할"],
            author: { nickname: "제트원챔", tier: "Immortal" },
            commentCount: 27,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1시간 전
        },
        {
            id: 3,
            title: "센티넬이 사이트 안 지키고 로밍하는 상황",
            votes: 24,
            views: 127,
            tags: ["센티넬", "사이트 수비", "로밍"],
            author: { nickname: "사이퍼장인", tier: "Ascendant" },
            commentCount: 12,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3시간 전
        },
    ];

    const situations = [];

    const maps = [];

    const agentCategories = [];

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
            <CommunityHeader
                gameType="valorant"
                title="발로란트 법원"
                description="전술적 FPS에서 발생한 분쟁을 공정하게 심판합니다"
            />

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
                                        ? "bg-valorant-100 text-valorant-700 font-medium"
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
                                            ? "bg-valorant-100 text-valorant-700 font-medium"
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
                                                        ? "bg-valorant-50 text-valorant-600"
                                                        : "hover:bg-gray-50"
                                                }`}
                                            >
                                                {situation}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 맵별 */}
                            <div className="mb-4">
                                <button
                                    onClick={() => setSelectedCategory("map")}
                                    className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
                                        selectedCategory === "map"
                                            ? "bg-valorant-100 text-valorant-700 font-medium"
                                            : "hover:bg-gray-100"
                                    }`}
                                >
                                    맵별
                                </button>

                                {selectedCategory === "map" && (
                                    <div className="ml-4 space-y-1">
                                        {maps.map((map) => (
                                            <button
                                                key={map}
                                                onClick={() =>
                                                    setSelectedMap(map)
                                                }
                                                className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                                                    selectedMap === map
                                                        ? "bg-valorant-50 text-valorant-600"
                                                        : "hover:bg-gray-50"
                                                }`}
                                            >
                                                {map}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 에이전트별 */}
                            <div>
                                <button
                                    onClick={() => setSelectedCategory("agent")}
                                    className={`w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
                                        selectedCategory === "agent"
                                            ? "bg-valorant-100 text-valorant-700 font-medium"
                                            : "hover:bg-gray-100"
                                    }`}
                                >
                                    에이전트별
                                </button>

                                {selectedCategory === "agent" && (
                                    <div className="ml-4">
                                        {/* 에이전트 검색 */}
                                        <input
                                            type="text"
                                            placeholder="에이전트 검색..."
                                            value={agentSearch}
                                            onChange={(e) =>
                                                setAgentSearch(e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-valorant-500 focus:border-transparent"
                                        />

                                        {/* 에이전트 카테고리 */}
                                        <div className="space-y-2">
                                            {agentCategories.map((category) => (
                                                <div key={category.key}>
                                                    <button
                                                        onClick={() =>
                                                            setSelectedAgentCategory(
                                                                category.key
                                                            )
                                                        }
                                                        className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                                                            selectedAgentCategory ===
                                                            category.key
                                                                ? "bg-valorant-50 text-valorant-600 font-medium"
                                                                : "hover:bg-gray-50"
                                                        }`}
                                                    >
                                                        {category.name}
                                                    </button>

                                                    {selectedAgentCategory ===
                                                        category.key && (
                                                        <div className="ml-4 mt-1">
                                                            <div className="text-xs text-gray-500 text-center py-2">
                                                                에이전트 데이터
                                                                준비중...
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {!showMoreAgents && (
                                            <button
                                                onClick={() =>
                                                    setShowMoreAgents(true)
                                                }
                                                className="w-full text-sm text-valorant-600 hover:text-valorant-700 py-2 mt-2"
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
                            gameType="valorant"
                            onSortChange={handleSortChange}
                            onSearchChange={handleSearchChange}
                        />

                        {/* 4. Body - 게시글 목록 */}
                        <div className="space-y-4">
                            {mockPosts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    gameType="valorant"
                                />
                            ))}
                        </div>

                        {/* 더 보기 버튼 */}
                        <div className="text-center mt-8">
                            <button className="px-6 py-3 bg-valorant-500 text-white rounded-lg hover:bg-valorant-600 transition-colors">
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
                        (window.location.href = "/valorant/community/write")
                    }
                    className="w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center"
                    style={{
                        backgroundColor: "#EF4444",
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#DC2626";
                        e.target.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#EF4444";
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
