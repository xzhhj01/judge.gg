"use client";

import Link from "next/link";
import { useState } from "react";
import Snackbar from "./Snackbar";

export default function PostCard({ post, gameType, currentUser, onEdit, onDelete, onShare }) {
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

    const getGameThemeColor = (gameType) => {
        return gameType === "lol" ? "lol" : "valorant";
    };

    const themeColor = getGameThemeColor(gameType);

    // Check if current user is the post author
    const isPostOwner = currentUser && (() => {
        // All possible user identifiers from currentUser
        const userIdentifiers = new Set();
        
        if (currentUser.id) userIdentifiers.add(currentUser.id);
        if (currentUser.uid) userIdentifiers.add(currentUser.uid);
        if (currentUser.email) {
            userIdentifiers.add(currentUser.email);
            userIdentifiers.add(currentUser.email.replace(/[^a-zA-Z0-9]/g, '_'));
            userIdentifiers.add(currentUser.email.split('@')[0]);
        }
        if (currentUser.sub) userIdentifiers.add(currentUser.sub); // OAuth sub field
        
        // All possible author identifiers from post
        const authorIdentifiers = new Set();
        if (post.authorId) authorIdentifiers.add(post.authorId);
        if (post.authorUid) authorIdentifiers.add(post.authorUid);
        if (post.authorEmail) authorIdentifiers.add(post.authorEmail);
        
        // Check for any match between user and author identifiers
        const hasMatch = Array.from(userIdentifiers).some(userId => 
            authorIdentifiers.has(userId)
        );
        return hasMatch;
    })();

    const handleEdit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onEdit) {
            onEdit(post);
        } else {
            // 기본 수정 기능
            window.open(`/${gameType}/community/post/${post.id}/edit`, '_blank');
        }
    };

    const handleDelete = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDelete) {
            onDelete(post);
        } else {
            // 기본 삭제 기능
            if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
                alert('삭제 기능은 해당 페이지에서 사용해주세요.');
            }
        }
    };

    const handleShare = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (onShare) {
            onShare(post);
        } else {
            // 기본 공유 기능 - 게시글 상세 페이지 URL
            const url = `${window.location.origin}/${gameType}/community/post/${post.id}`;
            
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
        <Link href={`/${gameType}/community/post/${post.id}`}>
            <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
                {/* 상단: 제목과 액션 버튼들 */}
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-4 line-clamp-2">
                        {post.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                        {/* 공유 버튼 - 항상 표시 */}
                        <button
                            onClick={handleShare}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="공유하기"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                            </svg>
                        </button>
                        
                        {/* 수정/삭제 버튼 (작성자만 표시) */}
                        {isPostOwner && (
                            <>
                                <button
                                    onClick={handleEdit}
                                    className="p-1 text-blue-400 hover:text-blue-600 transition-colors"
                                    title="수정하기"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                    title="삭제하기"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* 중간: 태그들 */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag, index) => (
                        <span
                            key={index}
                            className={`px-2 py-1 bg-${themeColor}-100 text-${themeColor}-700 text-xs rounded-full`}
                        >
                            {tag}
                        </span>
                    ))}
                </div>

                {/* 하단: 유저 정보, 댓글 수, 조회수, 시간 */}
                <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex items-center space-x-3">
                        {/* 유저 정보 */}
                        <div className="flex items-center space-x-1">
                            <span className="font-medium text-gray-700">
                                {post.author.nickname}
                            </span>
                            <span
                                className={`${getTierColor(
                                    post.author.tier
                                )} font-medium`}
                            >
                                {post.author.tier}
                            </span>
                        </div>

                        {/* 작성시간 */}
                        <span>{formatTimeAgo(post.createdAt)}</span>
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
                            <span>{post.commentCount}</span>
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
                            <span className="text-base font-medium text-blue-700">
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
            <Snackbar
                message={snackbar.message}
                type={snackbar.type}
                isVisible={snackbar.isVisible}
                onClose={closeSnackbar}
            />
        </Link>
    );
}
