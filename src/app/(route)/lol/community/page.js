"use client";

import { useState, useEffect } from "react";
import ModernPostCard from "../../../components/ModernPostCard";
import PostFilter from "../../../components/PostFilter";
import CommunityHeader from "../../../components/CommunityHeader";
import Snackbar from "../../../components/Snackbar";
import communityTags from "@/data/communityTags.json";
import { communityService } from '@/app/services/community/community.service';
import { useAuth } from '@/app/utils/providers';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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
                    ...selectedChampions
                ];
                
                console.log("Fetching posts with tags:", allSelectedTags);
                
                const result = await communityService.getPosts(
                    'lol',
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
            const response = await fetch(`/api/community/lol/posts/${postToDelete.id}`, {
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
        const url = `${window.location.origin}/lol/community/post/${post.id}`;
        
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
        <div className="min-h-screen bg-gray-50 dark:bg-dark-950">
            {/* 게임 헤더 */}
            <div className="bg-gradient-to-r from-lol-600 to-lol-700 dark:from-lol-700 dark:to-lol-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                                <div className="w-8 h-8 bg-lol-500 rounded"></div>
                            </div>
                            <h1 className="text-3xl font-bold text-white">리그 오브 레전드 법원</h1>
                        </div>
                        <p className="text-lol-100 text-lg">소환사의 협곡에서 발생한 분쟁을 공정하게 심판합니다</p>
                        
                        {/* 글쓰기 버튼 */}
                        <div className="mt-6">
                            <a 
                                href="/lol/community/write"
                                className="inline-flex items-center px-6 py-3 bg-white text-lol-600 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-lg"
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                글쓰기
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex gap-6">
                    {/* 왼쪽 필터 사이드바 */}
                    <div className="hidden lg:block w-64 flex-shrink-0">
                        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4 sticky top-24">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">필터</h3>
                            
                            {/* 전체 */}
                            <label className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg cursor-pointer transition-colors">
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
                                    className="w-4 h-4 mr-3 rounded border-gray-300 dark:border-dark-600 text-lol-600 focus:ring-lol-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">전체</span>
                            </label>

                            {/* 상황별 */}
                            <div className="mt-6">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-3 text-sm">
                                    상황별
                                </h4>
                                <div className="space-y-1">
                                    {tagData.situations.map((situation) => (
                                        <label
                                            key={situation}
                                            className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedSituations.includes(
                                                    situation
                                                )}
                                                onChange={() =>
                                                    toggleSituation(situation)
                                                }
                                                className="w-4 h-4 mr-3 rounded border-gray-300 dark:border-dark-600 text-lol-600 focus:ring-lol-500"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
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

                    {/* 메인 콘텐츠 */}
                    <div className="flex-1">
                        {/* 상단 필터 및 정렬 */}
                        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-4 mb-6">
                            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                                {/* 검색 */}
                                <div className="flex-1 max-w-md">
                                    <div className="relative">
                                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder="게시글 검색..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500"
                                        />
                                    </div>
                                </div>

                                {/* 정렬 */}
                                <div className="flex items-center space-x-3">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">정렬:</span>
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="bg-gray-50 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                                    >
                                        <option value="latest">최신순</option>
                                        <option value="popular">인기순</option>
                                        <option value="views">조회순</option>
                                        <option value="comments">댓글순</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 게시글 목록 */}
                        {loading ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-600"></div>
                            </div>
                        ) : posts.length === 0 ? (
                            <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">게시글이 없습니다</h3>
                                <p className="text-gray-600 dark:text-gray-400">첫 번째 재판을 열어보세요!</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {posts.map((post) => (
                                        <ModernPostCard
                                            key={post.id}
                                            post={post}
                                            gameType="lol"
                                            currentUser={session?.user || user}
                                            onEdit={handlePostEdit}
                                            onDelete={handlePostDelete}
                                            onShare={handlePostShare}
                                        />
                                    ))}
                                </div>

                                {posts.length >= 10 && (
                                    <div className="text-center mt-8">
                                        <button className="px-6 py-3 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors shadow-sm">
                                            더 많은 게시글 보기
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 모바일 필터 패널 */}
            <div className="lg:hidden fixed bottom-6 left-4 z-50">
                <button className="w-12 h-12 bg-white dark:bg-dark-800 rounded-full shadow-lg border border-gray-200 dark:border-dark-700 flex items-center justify-center hover:shadow-xl transition-all">
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                </button>
            </div>

            {/* 게시글 삭제 확인 모달 */}
            {showDeleteModal && postToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-dark-800 rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                게시글 삭제
                            </h3>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setPostToDelete(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="mb-6">
                            <p className="text-gray-700 dark:text-gray-300 mb-2">
                                정말로 이 게시글을 삭제하시겠습니까?
                            </p>
                            <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3">
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                    {postToDelete.title}
                                </p>
                            </div>
                            <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                                이 작업은 되돌릴 수 없습니다.
                            </p>
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setPostToDelete(null);
                                }}
                                className="px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 font-medium"
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
            
            <Snackbar
                message={snackbar.message}
                type={snackbar.type}
                isVisible={snackbar.isVisible}
                onClose={closeSnackbar}
            />
        </div>
    );
}
