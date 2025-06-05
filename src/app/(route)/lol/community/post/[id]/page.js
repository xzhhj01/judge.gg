"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CommunityHeader from "@/app/components/CommunityHeader";
import { communityService } from '@/app/services/community/community.service';
import { useAuth } from '@/app/utils/providers';
import {
    getCharacterCountDisplay,
    VALIDATION_LIMITS,
} from "@/app/utils/validation";

export default function LoLCommunityPostPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const postId = params.id;

    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [comments, setComments] = useState([]);

    const [newComment, setNewComment] = useState("");
    const [selectedVote, setSelectedVote] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);

    // 게시글 데이터 로드
    useEffect(() => {
        const loadPost = async () => {
            try {
                setLoading(true);
                const postData = await communityService.getPostById('lol', postId);
                setPost(postData);
                
                // 댓글도 함께 로드
                const commentsData = await communityService.getComments('lol', postId);
                setComments(commentsData);
                
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
    }, [postId]);

    // 투표 처리
    const handleVote = (option) => {
        if (hasVoted) return;
        setSelectedVote(option);
        setHasVoted(true);
        // 실제로는 API 호출
        console.log("투표:", option);
    };

    // 댓글 입력 처리
    const handleCommentChange = (e) => {
        const value = e.target.value;
        setNewComment(value);
    };

    // 댓글 추가
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        try {
            const comment = await communityService.addComment('lol', postId, newComment.trim());
            setComments([...comments, comment]);
            setNewComment("");
            
            // 게시글의 댓글 수 업데이트
            if (post) {
                setPost({
                    ...post,
                    commentCount: (post.commentCount || 0) + 1
                });
            }
        } catch (error) {
            console.error('댓글 추가 실패:', error);
            alert('댓글 추가에 실패했습니다.');
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
                            <Link
                                href={`/lol/community/post/${postId}/edit`}
                                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                            >
                                수정하기
                            </Link>
                            <button className="px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                삭제하기
                            </button>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        window.location.href
                                    );
                                    // TODO: 스낵바나 토스트로 복사 완료 알림 추가
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
                                <span className="text-gray-500 font-medium">
                                    Unranked
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

                            {/* 추천수 */}
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
                                    {post.likes || 0}
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
                {post.voteOptions && post.voteOptions.length > 0 && (
                    <section className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            투표
                        </h2>
                        <div className="text-center text-gray-500 py-8">
                            <p>투표 기능은 추후 구현 예정입니다.</p>
                        </div>
                    </section>
                )}

                {/* 댓글 */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                        댓글 ({comments.length})
                    </h2>

                    {/* 댓글 작성 */}
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
                                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors h-full"
                                >
                                    댓글 작성
                                </button>
                            </div>
                        </div>
                    </form>

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
                                        <span className="text-sm text-gray-500">
                                            {formatDate(comment.createdAt?.toDate ? comment.createdAt.toDate() : comment.createdAt)}
                                        </span>
                                    </div>
                                    <button className="text-sm text-gray-500 hover:text-red-600 flex items-center space-x-1">
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
                                        <span>0</span>
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
        </div>
    );
}
