"use client";

import { useState, useEffect } from "react";
import PostCard from "../../../components/PostCard";
import PostFilter from "../../../components/PostFilter";
import CommunityHeader from "../../../components/CommunityHeader";
import Snackbar from "../../../components/Snackbar";
import communityTags from "@/data/communityTags.json";
import { communityService } from '@/app/services/community/community.service';
import { useAuth } from '@/app/utils/providers';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ValorantCommunityPage() {
    const { user } = useAuth();
    const { data: session } = useSession();
    const router = useRouter();
    const [selectedSituations, setSelectedSituations] = useState([]);
    const [selectedMaps, setSelectedMaps] = useState([]);
    const [selectedAgents, setSelectedAgents] = useState([]);
    const [agentSearch, setAgentSearch] = useState("");
    const [showMoreAgents, setShowMoreAgents] = useState(false);
    const [sortBy, setSortBy] = useState("latest");
    const [searchQuery, setSearchQuery] = useState("");
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({
        message: "",
        type: "success",
        isVisible: false
    });

    const showSnackbar = (message, type = "success") => {
        setSnackbar({
            message,
            type,
            isVisible: true
        });
    };

    const closeSnackbar = () => {
        setSnackbar(prev => ({ ...prev, isVisible: false }));
    };

    // 태그 데이터
    const tagData = communityTags.valorant;

    // 역할군별 요원 그룹화
    const agentsByRole = {
        타격대: tagData.agents
            .filter((agent) => agent.role === "타격대")
            .map((agent) => agent.name),
        감시자: tagData.agents
            .filter((agent) => agent.role === "감시자")
            .map((agent) => agent.name),
        척후대: tagData.agents
            .filter((agent) => agent.role === "척후대")
            .map((agent) => agent.name),
        전략가: tagData.agents
            .filter((agent) => agent.role === "전략가")
            .map((agent) => agent.name),
    };

    // 요원의 역할군 찾기
    const getAgentRole = (agentName) => {
        const agent = tagData.agents.find((a) => a.name === agentName);
        return agent ? agent.role : null;
    };

    // 검색어에 맞는 요원 필터링
    const filteredAgents = agentSearch
        ? Object.entries(agentsByRole).reduce((acc, [role, agents]) => {
              const filtered = agents.filter((agent) =>
                  agent.toLowerCase().includes(agentSearch.toLowerCase())
              );
              if (filtered.length > 0) {
                  acc[role] = filtered;
              }
              return acc;
          }, {})
        : agentsByRole;

    // 필터 변경 시 API 호출
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                // 선택된 태그들을 모두 합침
                const allSelectedTags = [
                    ...selectedSituations,
                    ...selectedMaps,
                    ...selectedAgents
                ];
                
                console.log("Fetching posts with tags:", allSelectedTags);
                
                const result = await communityService.getPosts(
                    'valorant',
                    allSelectedTags,
                    searchQuery,
                    1,
                    20
                );
                
                let filteredPosts = result.posts || [];
                
                // 정렬 처리
                switch (sortBy) {
                    case "popular":
                        filteredPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                        break;
                    case "views":
                        filteredPosts.sort((a, b) => (b.views || 0) - (a.views || 0));
                        break;
                    case "comments":
                        filteredPosts.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
                        break;
                    case "controversial":
                        // 댓글 수대비 좋아요 비율로 논란 정도 계산
                        filteredPosts.sort((a, b) => {
                            const ratioA = (a.commentCount || 0) / Math.max(a.likes || 1, 1);
                            const ratioB = (b.commentCount || 0) / Math.max(b.likes || 1, 1);
                            return ratioB - ratioA;
                        });
                        break;
                    case "latest":
                    default:
                        filteredPosts.sort((a, b) => {
                            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                            return dateB - dateA;
                        });
                }
                
                // 게시글 데이터를 PostCard에 맞게 변환
                const formattedPosts = filteredPosts.map(post => ({
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
                        nickname: post.authorName || '알 수 없음',
                        profileImage: post.authorPhoto,
                        tier: post.authorTier || 'Unranked'
                    },
                    commentCount: post.commentCount || 0,
                    createdAt: post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.createdAt),
                    videoUrl: post.videoUrl
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
    }, [selectedSituations, selectedMaps, selectedAgents, sortBy, searchQuery]);

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

    const toggleMap = (map) => {
        setSelectedMaps((prev) =>
            prev.includes(map) ? prev.filter((m) => m !== map) : [...prev, map]
        );
    };

    const toggleAgent = (agent) => {
        setSelectedAgents((prev) =>
            prev.includes(agent)
                ? prev.filter((a) => a !== agent)
                : [...prev, agent]
        );
    };

    // 전체 필터 초기화
    const clearAllFilters = () => {
        setSelectedSituations([]);
        setSelectedMaps([]);
        setSelectedAgents([]);
    };

    // Handle post edit
    const handlePostEdit = (post) => {
        router.push(`/valorant/community/post/${post.id}/edit`);
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
            const response = await fetch(`/api/community/valorant/posts/${postToDelete.id}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                // Remove post from local state
                setPosts(posts.filter(p => p.id !== postToDelete.id));
                alert('게시글이 삭제되었습니다.');
            } else {
                alert('게시글 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('게시글 삭제 중 오류가 발생했습니다.');
        }
        
        setShowDeleteModal(false);
        setPostToDelete(null);
    };

    // Handle post share
    const handlePostShare = (post) => {
        const url = `${window.location.origin}/valorant/community/post/${post.id}`;
        
        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: `${post.title} - Judge.gg`,
                url: url
            }).catch(err => {
                console.log('Error sharing:', err);
                copyToClipboard(url);
            });
        } else {
            copyToClipboard(url);
        }
    };

    // Copy URL to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            showSnackbar('링크가 클립보드에 복사되었습니다!', 'success');
        }).catch(err => {
            console.error('Could not copy text: ', err);
            showSnackbar('링크 복사에 실패했습니다.', 'error');
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <CommunityHeader
                gameType="valorant"
                title="발로란트 법원"
                description="발로란트에서 발생한 분쟁을 공정하게 심판합니다"
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
                                        !selectedMaps.length &&
                                        !selectedAgents.length
                                    }
                                    onChange={() => {
                                        if (
                                            selectedSituations.length ||
                                            selectedMaps.length ||
                                            selectedAgents.length
                                        ) {
                                            clearAllFilters();
                                        }
                                    }}
                                    className="w-4 h-4 mr-2 rounded border-gray-300 text-valorant-600 focus:ring-valorant-500"
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
                                                className="w-4 h-4 mr-2 rounded border-gray-300 text-valorant-600 focus:ring-valorant-500"
                                            />
                                            <span className="text-sm">
                                                {situation}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 맵별 */}
                            <div className="mt-3">
                                <h3 className="font-medium text-gray-900 px-2 mb-2 text-sm">
                                    맵별
                                </h3>
                                <div>
                                    {tagData.maps.map((map) => (
                                        <label
                                            key={map}
                                            className="flex items-center px-2 py-0.5 hover:bg-gray-50 rounded cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedMaps.includes(
                                                    map
                                                )}
                                                onChange={() => toggleMap(map)}
                                                className="w-4 h-4 mr-2 rounded border-gray-300 text-valorant-600 focus:ring-valorant-500"
                                            />
                                            <span className="text-sm">
                                                {map}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* 요원별 */}
                            <div className="mt-3">
                                <h3 className="font-medium text-gray-900 px-2 mb-2 text-sm">
                                    요원별
                                </h3>
                                <div className="px-2 mb-2">
                                    <input
                                        type="text"
                                        placeholder="요원 검색..."
                                        value={agentSearch}
                                        onChange={(e) =>
                                            setAgentSearch(e.target.value)
                                        }
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-valorant-500"
                                    />
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    {Object.entries(filteredAgents).map(
                                        ([role, agents]) => (
                                            <div key={role} className="mb-2">
                                                <div className="px-2 py-1 text-xs font-medium text-gray-500">
                                                    {role}
                                                </div>
                                                {agents.map((agent) => (
                                                    <label
                                                        key={agent}
                                                        className="flex items-center px-2 py-0.5 hover:bg-gray-50 rounded cursor-pointer"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedAgents.includes(
                                                                agent
                                                            )}
                                                            onChange={() =>
                                                                toggleAgent(
                                                                    agent
                                                                )
                                                            }
                                                            className="w-4 h-4 mr-2 rounded border-gray-300 text-valorant-600 focus:ring-valorant-500"
                                                        />
                                                        <span className="text-sm">
                                                            {agent}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        )
                                    )}
                                </div>
                                {!showMoreAgents &&
                                    Object.values(agentsByRole).flat().length >
                                        10 && (
                                        <button
                                            onClick={() =>
                                                setShowMoreAgents(true)
                                            }
                                            className="w-full text-xs text-valorant-600 hover:text-valorant-700 mt-1 px-2"
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
                            gameType="valorant"
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
                                            gameType="valorant"
                                            currentUser={session?.user || user}
                                            onEdit={handlePostEdit}
                                            onDelete={handlePostDelete}
                                            onShare={handlePostShare}
                                        />
                                    ))}
                                </div>

                                <div className="text-center mt-8">
                                    <button className="px-6 py-3 bg-valorant-500 text-white rounded-lg hover:bg-valorant-600 transition-colors">
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

            {/* 게시글 삭제 확인 모달 */}
            {showDeleteModal && postToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                게시글 삭제
                            </h3>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setPostToDelete(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="mb-6">
                            <p className="text-gray-700 mb-2">
                                정말로 이 게시글을 삭제하시겠습니까?
                            </p>
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="font-medium text-gray-900 text-sm">
                                    {postToDelete.title}
                                </p>
                            </div>
                            <p className="text-red-600 text-sm mt-2">
                                이 작업은 되돌릴 수 없습니다.
                            </p>
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setPostToDelete(null);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                            >
                                취소
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                            >
                                삭제하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
            
            <Snackbar
                message={snackbar.message}
                type={snackbar.type}
                isVisible={snackbar.isVisible}
                onClose={closeSnackbar}
            />
        </div>
    );
}
