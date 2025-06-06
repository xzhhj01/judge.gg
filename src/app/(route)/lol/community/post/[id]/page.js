"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CommunityHeader from "@/app/components/CommunityHeader";
import Snackbar from "@/app/components/Snackbar";
import { communityService } from '@/app/services/community/community.service';
import { useAuth } from '@/app/utils/providers';
import { useSession } from 'next-auth/react';
import {
    getCharacterCountDisplay,
    VALIDATION_LIMITS,
} from "@/app/utils/validation";

export default function LoLCommunityPostPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { data: session } = useSession();
    const postId = params.id;
    
    if (process.env.NODE_ENV === 'development') {
        console.log('🔍 인증 상태 디버깅:', {
            user: user,
            session: session,
            sessionUser: session?.user,
            hasUser: !!user,
            hasSession: !!session,
            isLoggedIn: !!(user || session)
        });
    }

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [comments, setComments] = useState([]);

    const [newComment, setNewComment] = useState("");
    const [selectedVote, setSelectedVote] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isVoting, setIsVoting] = useState(false);
    const [commentVoting, setCommentVoting] = useState({}); // 댓글별 투표 상태
    const [commentVotes, setCommentVotes] = useState({}); // 댓글별 사용자 투표 상태
    const [selectedRecommendation, setSelectedRecommendation] = useState(null); // 추천/비추천 상태 (투표와 별개)
    const [isRecommending, setIsRecommending] = useState(false); // 추천 중인지 상태
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

    // 게시글 데이터 로드
    useEffect(() => {
        const loadPost = async () => {
            try {
                setLoading(true);
                const postData = await communityService.getPostById('lol', postId);
                if (process.env.NODE_ENV === 'development') {
                    console.log('🔍 로드된 게시글 데이터:', postData);
                    console.log('🔍 투표 옵션:', postData.voteOptions);
                    console.log('🔍 투표 결과:', postData.voteResults);
                    console.log('🔍 총 투표 수:', postData.totalVotes);
                    console.log('🔍 중립 허용:', postData.allowNeutral);
                }
                setPost(postData);
                
                // 사용자의 투표 여부 확인
                const currentUser = session?.user || user;
                if (currentUser) {
                    const userId = communityService.generateConsistentUserId(currentUser);
                    if (process.env.NODE_ENV === 'development') {
                        console.log("🔍 페이지 로드 - 사용자 투표 확인:", {
                            currentUser: currentUser,
                            userId: userId,
                            postId: postId
                        });
                    }
                    const userVote = await communityService.checkUserVote('lol', postId, currentUser);
                    if (process.env.NODE_ENV === 'development') {
                        console.log("🔍 페이지 로드 - 기존 투표:", userVote);
                    }
                    setSelectedVote(userVote);
                    
                    // 사용자의 추천 여부 확인 (투표와 별개)
                    const userRecommendation = await communityService.checkUserRecommendation('lol', postId, currentUser);
                    setSelectedRecommendation(userRecommendation);
                }
                
                // 댓글도 함께 로드
                const commentsData = await communityService.getComments('lol', postId);
                setComments(commentsData);
                
                // 댓글 투표 상태 확인
                if (currentUser && commentsData.length > 0) {
                    const commentVotesData = {};
                    for (const comment of commentsData) {
                        const commentVote = await communityService.checkUserCommentVote('lol', comment.id, currentUser);
                        if (commentVote) {
                            commentVotesData[comment.id] = commentVote;
                        }
                    }
                    setCommentVotes(commentVotesData);
                }
                
                setError(null);
            } catch (err) {
                console.error('게시글 로드 실패:', err);
                setError('게시글을 불러오는 데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (postId) {
            loadPost();
        }
    }, [postId, user, session]);

    // 투표 처리
    const handleVote = async (voteType) => {
        if (isVoting || (!user && !session)) return;
        
        try {
            setIsVoting(true);
            const currentUser = session?.user || user;
            
            // 투표 전에 한 번 더 기존 투표 확인 (이중 투표 방지)
            const existingVote = await communityService.checkUserVote('lol', postId, currentUser);
            if (process.env.NODE_ENV === 'development') {
                console.log("🔍 투표 전 기존 투표 확인:", existingVote);
            }
            
            const result = await communityService.votePost('lol', postId, voteType, currentUser);
            
            // 게시글 데이터 새로고침
            const updatedPost = await communityService.getPostById('lol', postId);
            setPost(updatedPost);
            
            // 투표 상태 업데이트
            if (result.action === 'removed') {
                setSelectedVote(null);
                if (process.env.NODE_ENV === 'development') {
                    console.log("투표 취소:", voteType);
                }
            } else {
                setSelectedVote(voteType);
                if (process.env.NODE_ENV === 'development') {
                    console.log("투표 완료:", voteType);
                }
            }
        } catch (error) {
            console.error('투표 실패:', error);
            alert('투표에 실패했습니다: ' + error.message);
        } finally {
            setIsVoting(false);
        }
    };

    // 추천 처리 (투표와 별개)
    const handleRecommendation = async (recommendationType) => {
        if (isRecommending || (!user && !session)) return;
        
        try {
            setIsRecommending(true);
            const currentUser = session?.user || user;
            
            const result = await communityService.recommendPost('lol', postId, recommendationType, currentUser);
            
            // 게시글 데이터 새로고침
            const updatedPost = await communityService.getPostById('lol', postId);
            setPost(updatedPost);
            
            // 추천 상태 업데이트
            if (result.action === 'removed') {
                setSelectedRecommendation(null);
                showSnackbar('추천이 취소되었습니다.', 'info');
            } else {
                setSelectedRecommendation(recommendationType);
                const message = recommendationType === 'recommend' ? '추천했습니다!' : '비추천했습니다.';
                showSnackbar(message, 'success');
            }
        } catch (error) {
            console.error('추천 실패:', error);
            showSnackbar('추천에 실패했습니다.', 'error');
        } finally {
            setIsRecommending(false);
        }
    };

    // 댓글 입력 처리
    const handleCommentChange = (e) => {
        const value = e.target.value;
        setNewComment(value);
    };

    // 댓글 추가
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        
        const currentUser = session?.user || user;
        if (!currentUser) {
            showSnackbar('로그인이 필요합니다.', 'error');
            return;
        }

        try {
            const comment = await communityService.addComment('lol', postId, newComment.trim(), currentUser);
            setComments([...comments, comment]);
            setNewComment("");
            
            // 게시글의 댓글 수 업데이트
            if (post) {
                setPost({
                    ...post,
                    commentCount: (post.commentCount || 0) + 1
                });
            }
            
            showSnackbar('댓글이 작성되었습니다!', 'success');
        } catch (error) {
            console.error('댓글 추가 실패:', error);
            showSnackbar('댓글 작성에 실패했습니다.', 'error');
        }
    };

    // 댓글 좋아요/투표
    const handleCommentVote = async (commentId, voteType = 'like') => {
        // 두 가지 인증 상태 모두 확인
        if (!user && !session) {
            alert('로그인이 필요합니다.');
            return;
        }

        // 이미 투표 중인 댓글인지 확인
        if (commentVoting[commentId]) return;

        try {
            setCommentVoting(prev => ({ ...prev, [commentId]: true }));
            
            const currentUser = session?.user || user;
            const result = await communityService.voteComment('lol', commentId, voteType, currentUser);
            
            // 댓글 데이터 새로고침
            const updatedComments = await communityService.getComments('lol', postId);
            setComments(updatedComments);
            
            // 투표 상태 업데이트
            if (result.action === 'removed') {
                setCommentVotes(prev => {
                    const newVotes = { ...prev };
                    delete newVotes[commentId];
                    return newVotes;
                });
            } else {
                setCommentVotes(prev => ({
                    ...prev,
                    [commentId]: voteType
                }));
            }
            
        } catch (error) {
            console.error('댓글 투표 실패:', error);
            alert('투표에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setCommentVoting(prev => ({ ...prev, [commentId]: false }));
        }
    };

    // 게시글 삭제
    const handleDeletePost = async () => {
        if ((!user && !session) || !post) {
            alert('삭제 권한이 없습니다.');
            return;
        }

        const confirmDelete = window.confirm('정말로 이 게시글을 삭제하시겠습니까?\n삭제된 게시글은 복구할 수 없습니다.');
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/community/lol/posts/${postId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '게시글 삭제에 실패했습니다.');
            }

            alert('게시글이 성공적으로 삭제되었습니다.');
            router.push('/lol/community');
        } catch (error) {
            console.error('게시글 삭제 실패:', error);
            alert(error.message || '게시글 삭제에 실패했습니다.');
        } finally {
            setIsDeleting(false);
        }
    };

    // 시간 포맷팅
    const formatDate = (dateString) => {
        if (!dateString) return '날짜 정보 없음';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '날짜 정보 없음';
        
        return (
            date.toLocaleDateString("ko-KR") +
            " " +
            date.toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
            })
        );
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const postTime = new Date(timestamp);
        const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));

        if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
        if (diffInMinutes < 1440)
            return `${Math.floor(diffInMinutes / 60)}시간 전`;
        return `${Math.floor(diffInMinutes / 1440)}일 전`;
    };

    const getTierColor = (tier) => {
        const tierColors = {
            Iron: "text-gray-600",
            Bronze: "text-amber-600",
            Silver: "text-gray-500",
            Gold: "text-yellow-500",
            Platinum: "text-cyan-500",
            Diamond: "text-blue-500",
            Master: "text-purple-500",
            Grandmaster: "text-red-500",
            Challenger: "text-orange-500",
        };
        return tierColors[tier] || "text-gray-600";
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <CommunityHeader
                    gameType="lol"
                    title="리그 오브 레전드 법원"
                    description="소환사의 협곡에서 발생한 분쟁을 공정하게 심판합니다"
                />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-gray-50">
                <CommunityHeader
                    gameType="lol"
                    title="리그 오브 레전드 법원"
                    description="소환사의 협곡에서 발생한 분쟁을 공정하게 심판합니다"
                />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-8">
                    <div className="text-center py-12">
                        <p className="text-gray-500">{error || '게시글을 찾을 수 없습니다.'}</p>
                        <Link 
                            href="/lol/community"
                            className="mt-4 inline-block px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            목록으로 돌아가기
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Community Header */}
            <CommunityHeader
                gameType="lol"
                title="리그 오브 레전드 법원"
                description="소환사의 협곡에서 발생한 분쟁을 공정하게 심판합니다"
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <div className="flex justify-between items-start mb-4">
                        <h1 className="text-3xl font-bold text-gray-900">
                            {post.title}
                        </h1>
                        <div className="flex space-x-2">
                            {/* 작성자만 수정/삭제 버튼 표시 */}
                            {(() => {
                                const currentUser = session?.user || user;
                                if (!currentUser) return false;
                                
                                // All possible user identifiers from currentUser
                                const userIdentifiers = new Set();
                                if (currentUser.id) userIdentifiers.add(currentUser.id);
                                if (currentUser.uid) userIdentifiers.add(currentUser.uid);
                                if (currentUser.email) {
                                    userIdentifiers.add(currentUser.email);
                                    userIdentifiers.add(currentUser.email.replace(/[^a-zA-Z0-9]/g, '_'));
                                    userIdentifiers.add(currentUser.email.split('@')[0]);
                                }
                                if (currentUser.sub) userIdentifiers.add(currentUser.sub);
                                
                                // All possible author identifiers from post
                                const authorIdentifiers = new Set();
                                if (post.authorId) authorIdentifiers.add(post.authorId);
                                if (post.authorUid) authorIdentifiers.add(post.authorUid);
                                if (post.authorEmail) authorIdentifiers.add(post.authorEmail);
                                
                                // Check for any match
                                return Array.from(userIdentifiers).some(userId => 
                                    authorIdentifiers.has(userId)
                                );
                            })() && (
                                <>
                                    <Link
                                        href={`/lol/community/post/${postId}/edit`}
                                        className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                    >
                                        수정하기
                                    </Link>
                                    <button 
                                        onClick={handleDeletePost}
                                        disabled={isDeleting}
                                        className="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDeleting ? '삭제 중...' : '삭제하기'}
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        window.location.href
                                    ).then(() => {
                                        showSnackbar('링크가 클립보드에 복사되었습니다!', 'success');
                                    }).catch(err => {
                                        console.error('Could not copy text: ', err);
                                        showSnackbar('링크 복사에 실패했습니다.', 'error');
                                    });
                                }}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-700 border border-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                            >
                                <svg
                                    className="w-4 h-4 mr-1"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                                    />
                                </svg>
                                공유
                            </button>
                        </div>
                    </div>

                    {/* PostCard와 동일한 형태의 사용자 정보 */}
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <div className="flex items-center space-x-3">
                            {/* 유저 정보 */}
                            <div className="flex items-center space-x-1">
                                <span className="font-medium text-gray-700">
                                    {post.authorName || '알 수 없음'}
                                </span>
                                <span className={`font-medium ${getTierColor(post.authorTier?.split(' ')[0] || 'Unranked')}`}>
                                    {post.authorTier || 'Unranked'}
                                </span>
                            </div>

                            {/* 작성시간 */}
                            <span>{formatDate(post.createdAt?.toDate ? post.createdAt.toDate() : post.createdAt)}</span>
                        </div>

                        {/* 통계 정보들 */}
                        <div className="flex items-center space-x-3">
                            {/* 조회수 */}
                            <div className="flex items-center space-x-1">
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                </svg>
                                <span>{post.views}</span>
                            </div>

                            {/* 댓글 수 */}
                            <div className="flex items-center space-x-1">
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                                <span>{post.commentCount || 0}</span>
                            </div>

                            {/* 추천수 (추천 - 비추천의 총합) */}
                            <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded-lg">
                                <svg
                                    className="w-4 h-4 text-blue-500"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="text-sm font-medium text-blue-700">
                                    {(() => {
                                        // 투표 게시글인 경우 총 투표수 표시
                                        if (post.voteOptions && Array.isArray(post.voteOptions) && post.voteOptions.length >= 2) {
                                            return post.totalVotes || 0;
                                        }
                                        // 일반 게시글인 경우 추천 총합 (추천 - 비추천) 표시
                                        const recommendations = post.recommendations || 0;
                                        const unrecommendations = post.unrecommendations || 0;
                                        return recommendations - unrecommendations;
                                    })()}
                                </span>
                            </div>

                        </div>
                    </div>
                </div>

                {/* 태그 */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                        {post.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* 동영상 영역 - videoUrl이 있을 때만 표시 */}
                {post.videoUrl && (
                    <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            동영상
                        </h2>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                            <svg
                                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                            </svg>
                            <p className="text-gray-500">
                                동영상이 업로드되지 않았습니다
                            </p>
                        </div>
                    </section>
                )}

                {/* 본문 */}
                <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        본문
                    </h2>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                    </div>
                </section>

                {/* 투표 */}
                <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        이 상황에 대한 당신의 판단은?
                    </h2>
                    
                    {/* 투표 옵션이 있는 경우 */}
                    {post.voteOptions && Array.isArray(post.voteOptions) && post.voteOptions.length >= 2 ? (
                        <div className="space-y-4">
                            {/* 투표 옵션들 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {post.voteOptions.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleVote(`option_${index}`)}
                                        disabled={isVoting}
                                        className={`p-4 border-2 rounded-lg transition-all ${
                                            selectedVote === `option_${index}`
                                                ? 'border-blue-500 bg-blue-50 text-blue-900'
                                                : 'border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                                        } ${isVoting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <div className="text-center">
                                            <div className="font-medium text-lg mb-3">{option}</div>
                                            <div className="text-sm text-gray-600 mb-2">
                                                {post.voteResults?.[index] || 0}표
                                                {post.totalVotes > 0 && (
                                                    <span className="ml-1">
                                                        ({Math.round(((post.voteResults?.[index] || 0) / post.totalVotes) * 100)}%)
                                                    </span>
                                                )}
                                            </div>
                                            {/* 시각적 분포도 */}
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div 
                                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                                    style={{ 
                                                        width: post.totalVotes > 0 
                                                            ? `${Math.round(((post.voteResults?.[index] || 0) / post.totalVotes) * 100)}%`
                                                            : '0%'
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                        {isVoting && selectedVote === `option_${index}` && (
                                            <div className="mt-2 flex justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            
                            {/* 중립 옵션 */}
                            {post.allowNeutral && (
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => handleVote('neutral')}
                                        disabled={isVoting}
                                        className={`px-6 py-4 border-2 rounded-lg transition-all min-w-[200px] ${
                                            selectedVote === 'neutral'
                                                ? 'border-gray-500 bg-gray-50 text-gray-900'
                                                : 'border-gray-300 hover:border-gray-400'
                                        } ${isVoting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <div className="text-center">
                                            <div className="font-medium mb-2">판단하기 어려움</div>
                                            <div className="text-sm text-gray-600 mb-2">
                                                {post.voteResults?.neutral || 0}표
                                                {post.totalVotes > 0 && (
                                                    <span className="ml-1">
                                                        ({Math.round(((post.voteResults?.neutral || 0) / post.totalVotes) * 100)}%)
                                                    </span>
                                                )}
                                            </div>
                                            {/* 시각적 분포도 */}
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div 
                                                    className="bg-gray-500 h-2.5 rounded-full transition-all duration-300"
                                                    style={{ 
                                                        width: post.totalVotes > 0 
                                                            ? `${Math.round(((post.voteResults?.neutral || 0) / post.totalVotes) * 100)}%`
                                                            : '0%'
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                        {isVoting && selectedVote === 'neutral' && (
                                            <div className="mt-2 flex justify-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            )}
                            
                            {/* 투표 마감일 */}
                            {post.voteDeadline && (
                                <div className="text-center text-sm text-gray-500 mt-4">
                                    투표 마감: {new Date(post.voteDeadline).toLocaleString('ko-KR')}
                                </div>
                            )}
                            
                            {/* 총 투표 수 */}
                            <div className="text-center text-sm text-gray-600 mt-2">
                                총 {post.totalVotes || 0}명이 투표했습니다
                            </div>
                        </div>
                    ) : (
                        /* 기본 좋아요/싫어요 투표 */
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => handleVote('like')}
                                disabled={isVoting}
                                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                                    selectedVote === 'like'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                                } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18l-6-6h4V4h4v8h4l-6 6z" clipRule="evenodd" />
                                </svg>
                                <span>좋아요 ({post.likes || 0})</span>
                                {isVoting && selectedVote === 'like' && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                )}
                            </button>
                            <button
                                onClick={() => handleVote('dislike')}
                                disabled={isVoting}
                                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                                    selectedVote === 'dislike'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-red-50 text-red-700 hover:bg-red-100'
                                } ${isVoting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 2l6 6h-4v8H8V8H4l6-6z" clipRule="evenodd" />
                                </svg>
                                <span>싫어요 ({post.dislikes || 0})</span>
                                {isVoting && selectedVote === 'dislike' && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                )}
                            </button>
                        </div>
                    )}
                    
                    {/* 로그인 필요 메시지 */}
                    {!user && !session && (
                        <div className="text-center text-gray-500 py-4">
                            <p>투표하려면 <Link href="/login" className="text-blue-600 hover:text-blue-700">로그인</Link>이 필요합니다.</p>
                        </div>
                    )}
                    
                    {selectedVote && (
                        <p className="text-center text-green-600 mt-3 text-sm">
                            투표해주셔서 감사합니다! 같은 옵션을 다시 클릭하면 투표를 취소할 수 있습니다.
                        </p>
                    )}
                </section>

                {/* 추천/비추천 섹션 */}
                <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        이 게시글이 도움이 되었나요?
                    </h2>
                    <div className="flex justify-center space-x-4">
                        {/* 추천 버튼 */}
                        <button
                            onClick={() => handleRecommendation('recommend')}
                            disabled={isRecommending || (!user && !session)}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                                selectedRecommendation === 'recommend'
                                    ? 'bg-green-500 text-white'
                                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                            } ${isRecommending || (!user && !session) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>도움됨 ({post.recommendations || 0})</span>
                            {isRecommending && selectedRecommendation === 'recommend' && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                        </button>

                        {/* 비추천 버튼 */}
                        <button
                            onClick={() => handleRecommendation('unrecommend')}
                            disabled={isRecommending || (!user && !session)}
                            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                                selectedRecommendation === 'unrecommend'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                            } ${isRecommending || (!user && !session) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>도움 안됨 ({post.unrecommendations || 0})</span>
                            {isRecommending && selectedRecommendation === 'unrecommend' && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                        </button>
                    </div>
                    
                    {/* 로그인 필요 메시지 */}
                    {!user && !session && (
                        <div className="text-center text-gray-500 py-4">
                            <p>추천하려면 <Link href="/login" className="text-blue-600 hover:text-blue-700">로그인</Link>이 필요합니다.</p>
                        </div>
                    )}
                    
                    {/* 추천 완료 메시지 */}
                    {selectedRecommendation && (
                        <p className="text-center text-green-600 mt-3 text-sm">
                            {selectedRecommendation === 'recommend' ? '도움됨' : '도움 안됨'}으로 평가해주셔서 감사합니다! 같은 버튼을 다시 클릭하면 취소할 수 있습니다.
                        </p>
                    )}
                </section>

                {/* 댓글 */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                        댓글 ({comments.length})
                    </h2>

                    {/* 댓글 작성 폼 */}
                    {user || session ? (
                        <form onSubmit={handleAddComment} className="mb-6">
                            <div className="flex space-x-4">
                                <div className="flex-1">
                                    <textarea
                                        value={newComment}
                                        onChange={handleCommentChange}
                                        placeholder="댓글을 작성해주세요..."
                                        rows={3}
                                        maxLength={VALIDATION_LIMITS.COMMENT}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                    <p className="text-sm text-gray-500 mt-2">
                                        {newComment.length}/
                                        {VALIDATION_LIMITS.COMMENT}자
                                    </p>
                                </div>
                                <div className="flex-shrink-0">
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim()}
                                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors h-full"
                                    >
                                        댓글 작성
                                    </button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-600 mb-3">댓글을 작성하려면 로그인이 필요합니다.</p>
                            <Link
                                href="/login"
                                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                로그인하기
                            </Link>
                        </div>
                    )}

                    {/* 댓글 목록 */}
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="border-b border-gray-100 pb-4 last:border-b-0"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium text-gray-900">
                                            {comment.authorName || '알 수 없음'}
                                        </span>
                                        <span className={`text-sm font-medium ${getTierColor(comment.authorTier?.split(' ')[0] || 'Unranked')}`}>
                                            {comment.authorTier || 'Unranked'}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {formatDate(comment.createdAt?.toDate ? comment.createdAt.toDate() : comment.createdAt)}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => handleCommentVote(comment.id, 'like')}
                                        disabled={commentVoting[comment.id]}
                                        className={`text-sm flex items-center space-x-1 transition-colors ${
                                            commentVoting[comment.id] 
                                                ? 'text-gray-400 cursor-not-allowed' 
                                                : commentVotes[comment.id] === 'like'
                                                ? 'text-red-600'
                                                : 'text-gray-500 hover:text-red-600'
                                        }`}
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                            />
                                        </svg>
                                        <span>{comment.likes || 0}</span>
                                    </button>
                                </div>
                                <p className="text-gray-700 leading-relaxed">
                                    {comment.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 하단 버튼 */}
                <div className="flex justify-center mt-8">
                    <Link
                        href="/lol/community"
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        목록으로 돌아가기
                    </Link>
                </div>
            </div>
            
            <Snackbar
                message={snackbar.message}
                type={snackbar.type}
                isVisible={snackbar.isVisible}
                onClose={closeSnackbar}
            />
        </div>
    );
}
