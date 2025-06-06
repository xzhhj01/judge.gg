"use client";

import { useState, useEffect } from "react";
import ModernPostCard from "../../../components/ModernPostCard";
import PostFilter from "../../../components/PostFilter";
import CommunityHeader from "../../../components/CommunityHeader";
import Snackbar from "../../../components/Snackbar";
import communityTags from "@/data/communityTags.json";
import { communityService } from "@/app/services/community/community.service";
import { useAuth } from "@/app/utils/providers";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoLCommunityPage() {
    const { user } = useAuth();
    const { data: session } = useSession();
    const router = useRouter();
    const [selectedSituations, setSelectedSituations] = useState([]);
    const [selectedLanes, setSelectedLanes] = useState([]);
    const [selectedChampions, setSelectedChampions] = useState([]);
    const [championSearch, setChampionSearch] = useState("");
    const [showMoreChampions, setShowMoreChampions] = useState(false);
    const [sortBy, setSortBy] = useState("latest");
    const [searchQuery, setSearchQuery] = useState("");
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({
        message: "",
        type: "success",
        isVisible: false,
    });

    const showSnackbar = (message, type = "success") => {
        setSnackbar({
            message,
            type,
            isVisible: true,
        });
    };

    const closeSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, isVisible: false }));
    };

    // 태그 데이터
    const tagData = communityTags.lol;

    // 필터 변경 시 API 호출
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                // 선택된 태그들을 모두 합침
                const allSelectedTags = [
                    ...selectedSituations,
                    ...selectedLanes,
                    ...selectedChampions,
                ];

                console.log("Fetching posts with tags:", allSelectedTags);

                const result = await communityService.getPosts(
                    "lol",
                    allSelectedTags,
                    searchQuery,
                    1,
                    20
                );

                let filteredPosts = result.posts || [];

                // 정렬 처리
                switch (sortBy) {
                    case "popular":
                        filteredPosts.sort(
                            (a, b) => (b.likes || 0) - (a.likes || 0)
                        );
                        break;
                    case "views":
                        filteredPosts.sort(
                            (a, b) => (b.views || 0) - (a.views || 0)
                        );
                        break;
                    case "comments":
                        filteredPosts.sort(
                            (a, b) =>
                                (b.commentCount || 0) - (a.commentCount || 0)
                        );
                        break;
                    case "latest":
                    default:
                        filteredPosts.sort((a, b) => {
                            const dateA = a.createdAt?.toDate
                                ? a.createdAt.toDate()
                                : new Date(a.createdAt);
                            const dateB = b.createdAt?.toDate
                                ? b.createdAt.toDate()
                                : new Date(b.createdAt);
                            return dateB - dateA;
                        });
                }

                // 게시글 데이터를 PostCard에 맞게 변환
                const formattedPosts = filteredPosts.map((post) => ({
                    id: post.id,
                    title: post.title,
                    content: post.content,
                    votes: post.likes || 0,
                    likes: post.likes || 0,
                    totalVotes: post.totalVotes || 0,
                    voteOptions: post.voteOptions,
                    voteResults: post.voteResults,
                    allowNeutral: post.allowNeutral,
                    voteDeadline: post.voteDeadline,
                    views: post.views || 0,
                    tags: post.tags || [],
                    author: {
                        nickname: post.authorName || "알 수 없음",
                        profileImage: post.authorPhoto,
                        tier: post.authorTier || "Unranked",
                    },
                    commentCount: post.commentCount || 0,
                    createdAt: post.createdAt?.toDate
                        ? post.createdAt.toDate()
                        : new Date(post.createdAt),
                    videoUrl: post.videoUrl,
                }));

                setPosts(formattedPosts);
            } catch (error) {
                console.error("Error fetching posts:", error);
                setPosts([]);
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

    // Handle post edit
    const handlePostEdit = (post) => {
        router.push(`/lol/community/post/${post.id}/edit`);
    };

    // Handle post delete
    const handlePostDelete = (post) => {
        setPostToDelete(post);
        setShowDeleteModal(true);
    };

    // Confirm post deletion
    const confirmDelete = async () => {
        if (!postToDelete) return;

        try {
            const response = await fetch(
                `/api/community/lol/posts/${postToDelete.id}`,
                {
                    method: "DELETE",
                }
            );

            if (response.ok) {
                // Remove post from local state
                setPosts(posts.filter((p) => p.id !== postToDelete.id));
                alert("게시글이 삭제되었습니다.");
            } else {
                alert("게시글 삭제에 실패했습니다.");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("게시글 삭제 중 오류가 발생했습니다.");
        }

        setShowDeleteModal(false);
        setPostToDelete(null);
    };

    // Handle post share
    const handlePostShare = (post) => {
        const url = `${window.location.origin}/lol/community/post/${post.id}`;

        if (navigator.share) {
            navigator
                .share({
                    title: post.title,
                    text: `${post.title} - Judge.gg`,
                    url: url,
                })
                .catch((err) => {
                    console.log("Error sharing:", err);
                    copyToClipboard(url);
                });
        } else {
            copyToClipboard(url);
        }
    };

    // Copy URL to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                showSnackbar("링크가 클립보드에 복사되었습니다!", "success");
            })
            .catch((err) => {
                console.error("Could not copy text: ", err);
                showSnackbar("링크 복사에 실패했습니다.", "error");
            });
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0c0032] to-[#190061]">
            <div className="relative h-32 overflow-hidden">
                <div
                    className="absolute inset-0 w-full h-full"
                    style={{
                        backgroundImage: `url('/community-banner-lol.jpg')`,
                        backgroundSize: "cover",
                        backgroundPosition: "top -50px center",
                        backgroundRepeat: "no-repeat",
                    }}
                ></div>
                <div
                    className="absolute inset-0 w-full h-full"
                    style={{
                        background:
                            "linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6))",
                        backgroundPosition: "top -50px center",
                    }}
                ></div>
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                            <img
                                alt="LoL"
                                className="w-8 h-8"
                                src="/logo-lol.svg"
                            />
                        </div>
                        <div className="text-white">
                            <h1 className="text-2xl font-bold mb-1">
                                리그 오브 레전드 법원
                            </h1>
                            <p className="text-lol-100 text-sm">
                                소환사의 협곡에서 발생한 분쟁을 공정하게
                                심판합니다
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">
                    {/* 왼쪽 필터 */}
                    <div className="w-48 flex-shrink-0">
                        <div className="filter-section bg-white rounded-lg shadow-sm border border-gray-200 p-2 sticky top-24">
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
                                <span className="text-sm text-gray-900">
                                    전체
                                </span>
                            </label>

                            {/* 상황별 */}
                            <div className="mt-3">
                                <h3 className="font-medium text-gray-900 px-2 mb-2 text-sm">
                                    상황별
                                </h3>
                                {tagData.situations.map((tag) => (
                                    <label
                                        key={tag}
                                        className="flex items-center px-2 py-0.5 hover:bg-gray-50 rounded cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedSituations.includes(
                                                tag
                                            )}
                                            onChange={() =>
                                                toggleSituation(tag)
                                            }
                                            className="w-4 h-4 mr-2 rounded border-gray-300 text-lol-600 focus:ring-lol-500"
                                        />
                                        <span className="text-sm text-gray-900">
                                            {tag}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {/* 라인별 */}
                            <div className="mt-3">
                                <h3 className="font-medium text-gray-900 px-2 mb-2 text-sm">
                                    라인별
                                </h3>
                                {tagData.lanes.map((tag) => (
                                    <label
                                        key={tag}
                                        className="flex items-center px-2 py-0.5 hover:bg-gray-50 rounded cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedLanes.includes(
                                                tag
                                            )}
                                            onChange={() => toggleLane(tag)}
                                            className="w-4 h-4 mr-2 rounded border-gray-300 text-lol-600 focus:ring-lol-500"
                                        />
                                        <span className="text-sm text-gray-900">
                                            {tag}
                                        </span>
                                    </label>
                                ))}
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
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-lol-500 text-gray-900"
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
                                                <span className="text-sm text-gray-900">
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
                                        <ModernPostCard
                                            key={post.id}
                                            post={post}
                                            gameType="lol"
                                            currentUser={user || session?.user}
                                            onEdit={handlePostEdit}
                                            onDelete={handlePostDelete}
                                            onShare={handlePostShare}
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

            {/* 스낵바 */}
            <Snackbar
                isVisible={snackbar.isVisible}
                message={snackbar.message}
                type={snackbar.type}
                onClose={closeSnackbar}
            />
        </div>
    );
}
