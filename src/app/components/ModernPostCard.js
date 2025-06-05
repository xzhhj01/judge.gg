"use client";

import { timeAgo } from '@/app/utils/timeAgo';
import Link from 'next/link';
import { useState } from 'react';
import Snackbar from './Snackbar';

export default function ModernPostCard({ post, gameType = 'lol', currentUser, onEdit, onDelete, onShare }) {
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
    const formatDate = (date) => {
        if (!date) return '날짜 정보 없음';
        return timeAgo(date);
    };

    const gameColors = {
        lol: {
            primary: 'text-lol-600 dark:text-lol-400',
            bg: 'bg-lol-50 dark:bg-lol-900/20',
            border: 'border-lol-200 dark:border-lol-800',
            hover: 'hover:bg-lol-50 dark:hover:bg-lol-900/10'
        },
        valorant: {
            primary: 'text-valorant-600 dark:text-valorant-400', 
            bg: 'bg-valorant-50 dark:bg-valorant-900/20',
            border: 'border-valorant-200 dark:border-valorant-800',
            hover: 'hover:bg-valorant-50 dark:hover:bg-valorant-900/10'
        }
    };

    const colors = gameColors[gameType] || gameColors.lol;

    // Check if current user is the post author (same logic as PostCard)
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
            <article className="bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 p-6 hover:shadow-lg dark:hover:shadow-dark-900/20 transition-all duration-200 cursor-pointer group">
                {/* 헤더 */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors line-clamp-2">
                            {post.title}
                        </h3>
                        
                        {/* 태그 */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {post.tags.slice(0, 3).map((tag, index) => (
                                    <span
                                        key={index}
                                        className={`px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.primary}`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                                {post.tags.length > 3 && (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400">
                                        +{post.tags.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="ml-4 flex items-center space-x-2">
                        {/* 액션 버튼들 */}
                        <div className="flex items-center space-x-1">
                            {/* 공유 버튼 - 항상 표시 */}
                            <button
                                onClick={handleShare}
                                className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
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
                                        className="p-1.5 text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                        title="수정하기"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="p-1.5 text-red-400 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                        title="삭제하기"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* 비디오 아이콘 */}
                        {post.videoUrl && (
                            <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>

                {/* 내용 미리보기 */}
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                    {post.content}
                </p>

                {/* 하단 정보 */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                        {/* 작성자 */}
                        <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-gray-200 dark:bg-dark-600 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {post.author?.nickname?.[0] || 'U'}
                                </span>
                            </div>
                            <span className="font-medium">{post.author?.nickname || '알 수 없음'}</span>
                        </div>

                        {/* 작성 시간 */}
                        <span>{formatDate(post.createdAt)}</span>
                    </div>

                    {/* 통계 */}
                    <div className="flex items-center space-x-4">
                        {/* 조회수 */}
                        <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{post.views || 0}</span>
                        </div>

                        {/* 댓글 수 */}
                        <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span>{post.commentCount || 0}</span>
                        </div>

                        {/* 추천수 */}
                        <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className={colors.primary}>
                                {post.voteOptions && Array.isArray(post.voteOptions) && post.voteOptions.length >= 2 
                                    ? (post.totalVotes || 0)
                                    : (post.votes || post.likes || 0)
                                }
                            </span>
                        </div>
                    </div>
                </div>
            </article>
            <Snackbar
                message={snackbar.message}
                type={snackbar.type}
                isVisible={snackbar.isVisible}
                onClose={closeSnackbar}
            />
        </Link>
    );
}