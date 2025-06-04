"use client";

import { useState, useEffect } from "react";
import PostCard from "../../../components/PostCard";
import PostFilter from "../../../components/PostFilter";
import CommunityHeader from "../../../components/CommunityHeader";
import communityTags from "@/data/communityTags.json";

export default function LoLCommunityPage() {
    const [selectedSituations, setSelectedSituations] = useState([]);
    const [selectedLanes, setSelectedLanes] = useState([]);
    const [selectedChampions, setSelectedChampions] = useState([]);
    const [championSearch, setChampionSearch] = useState("");
    const [showMoreChampions, setShowMoreChampions] = useState(false);
    const [sortBy, setSortBy] = useState("latest");
    const [searchQuery, setSearchQuery] = useState("");
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    // 태그 데이터
    const tagData = communityTags.lol;

    // 필터 변경 시 API 호출
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                // TODO: 실제 API 호출로 대체
                const filters = {
                    situations: selectedSituations,
                    lanes: selectedLanes,
                    champions: selectedChampions,
                    sortBy,
                    search: searchQuery,
                };
                console.log("Fetching posts with filters:", filters);

                // 임시 데이터
                const mockPosts = [
                    {
                        id: 1,
                        title: "정글러가 갱킹 안 와주는데 이게 정상인가요?",
                        votes: 23,
                        views: 156,
                        tags: ["정글", "갱킹", "라이너"],
                        author: { nickname: "소환사123", tier: "Gold" },
                        commentCount: 15,
                        createdAt: new Date(Date.now() - 1000 * 60 * 30),
                    },
                    // ... 기존 mockPosts 데이터
                ];

                setPosts(mockPosts);
            } catch (error) {
                console.error("Error fetching posts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [
        selectedSituations,
        selectedLanes,
        selectedChampions,
        sortBy,
        searchQuery,
    ]);

    // 필터 핸들러 함수들
    const handleSortChange = (sortType) => {
        setSortBy(sortType);
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
    };

    // 필터 토글 핸들러
    const toggleSituation = (situation) => {
        setSelectedSituations((prev) =>
            prev.includes(situation)
                ? prev.filter((s) => s !== situation)
                : [...prev, situation]
        );
    };

    const toggleLane = (lane) => {
        setSelectedLanes((prev) =>
            prev.includes(lane)
                ? prev.filter((l) => l !== lane)
                : [...prev, lane]
        );
    };

    const toggleChampion = (champion) => {
        setSelectedChampions((prev) =>
            prev.includes(champion)
                ? prev.filter((c) => c !== champion)
                : [...prev, champion]
        );
    };

    // 전체 필터 초기화
    const clearAllFilters = () => {
        setSelectedSituations([]);
        setSelectedLanes([]);
        setSelectedChampions([]);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <CommunityHeader
                gameType="lol"
                title="리그 오브 레전드 법원"
                description="소환사의 협곡에서 발생한 분쟁을 공정하게 심판합니다"
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">
                    {/* 왼쪽 필터 */}
                    <div className="w-48 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sticky top-24">
                            {/* 전체 */}
                            <label className="flex items-center px-2 py-1 hover:bg-gray-50 rounded cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={
                                        !selectedSituations.length &&
                                        !selectedLanes.length &&
                                        !selectedChampions.length
                                    }
                                    onChange={() => {
                                        if (
                                            selectedSituations.length ||
                                            selectedLanes.length ||
                                            selectedChampions.length
                                        ) {
                                            clearAllFilters();
                                        }
                                    }}
                                    className="w-4 h-4 mr-2 rounded border-gray-300 text-lol-600 focus:ring-lol-500"
                                />
                                <span className="text-sm">전체</span>
                            </label>

                            {/* 상황별 */}
                            <div className="mt-3">
                                <h3 className="font-medium text-gray-900 px-2 mb-2 text-sm">
                                    상황별
                                </h3>
                                <div>
                                    {tagData.situations.map((situation) => (
                                        <label
                                            key={situation}
                                            className="flex items-center px-2 py-0.5 hover:bg-gray-50 rounded cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedSituations.includes(
                                                    situation
                                                )}
                                                onChange={() =>
                                                    toggleSituation(situation)
                                                }
                                                className="w-4 h-4 mr-2 rounded border-gray-300 text-lol-600 focus:ring-lol-500"
                                            />
                                            <span className="text-sm">
                                                {situation}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 라인별 */}
                            <div className="mt-3">
                                <h3 className="font-medium text-gray-900 px-2 mb-2 text-sm">
                                    라인별
                                </h3>
                                <div>
                                    {tagData.lanes.map((lane) => (
                                        <label
                                            key={lane}
                                            className="flex items-center px-2 py-0.5 hover:bg-gray-50 rounded cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedLanes.includes(
                                                    lane
                                                )}
                                                onChange={() =>
                                                    toggleLane(lane)
                                                }
                                                className="w-4 h-4 mr-2 rounded border-gray-300 text-lol-600 focus:ring-lol-500"
                                            />
                                            <span className="text-sm">
                                                {lane}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 챔피언별 */}
                            <div className="mt-3">
                                <h3 className="font-medium text-gray-900 px-2 mb-2 text-sm">
                                    챔피언별
                                </h3>
                                <div className="px-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="챔피언 검색..."
                                        value={championSearch}
                                        onChange={(e) =>
                                            setChampionSearch(e.target.value)
                                        }
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-lol-500"
                                    />
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    {tagData.champions
                                        .filter((champion) =>
                                            champion
                                                .toLowerCase()
                                                .includes(
                                                    championSearch.toLowerCase()
                                                )
                                        )
                                        .slice(
                                            0,
                                            showMoreChampions ? undefined : 10
                                        )
                                        .map((champion) => (
                                            <label
                                                key={champion}
                                                className="flex items-center px-2 py-0.5 hover:bg-gray-50 rounded cursor-pointer"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedChampions.includes(
                                                        champion
                                                    )}
                                                    onChange={() =>
                                                        toggleChampion(champion)
                                                    }
                                                    className="w-4 h-4 mr-2 rounded border-gray-300 text-lol-600 focus:ring-lol-500"
                                                />
                                                <span className="text-sm">
                                                    {champion}
                                                </span>
                                            </label>
                                        ))}
                                </div>
                                {!showMoreChampions &&
                                    tagData.champions.length > 10 && (
                                        <button
                                            onClick={() =>
                                                setShowMoreChampions(true)
                                            }
                                            className="w-full text-xs text-lol-600 hover:text-lol-700 mt-1 px-2"
                                        >
                                            더 보기
                                        </button>
                                    )}
                            </div>
                        </div>
                    </div>

                    {/* 메인 컨텐츠 */}
                    <div className="flex-1">
                        <PostFilter
                            gameType="lol"
                            onSortChange={handleSortChange}
                            onSearchChange={handleSearchChange}
                        />

                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="text-gray-500">로딩 중...</div>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {posts.map((post) => (
                                        <PostCard
                                            key={post.id}
                                            post={post}
                                            gameType="lol"
                                        />
                                    ))}
                                </div>

                                <div className="text-center mt-8">
                                    <button className="px-6 py-3 bg-lol-500 text-white rounded-lg hover:bg-lol-600 transition-colors">
                                        더 많은 게시글 보기
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 플로팅 글쓰기 버튼 */}
            <div className="fixed bottom-6 right-32 z-50 group flex flex-col items-center">
                <div
                    className="mb-4 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all duration-200"
                    style={{
                        animation: "float 3s ease-in-out infinite",
                    }}
                >
                    ⚖️ 새 재판 열기
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
