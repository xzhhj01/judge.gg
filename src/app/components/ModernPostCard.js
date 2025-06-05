"use client";

import { timeAgo } from '@/app/utils/timeAgo';
import Link from 'next/link';

export default function ModernPostCard({ post, gameType = 'lol' }) {
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

                    {/* 비디오 아이콘 */}
                    {post.videoUrl && (
                        <div className="ml-4 flex-shrink-0">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-dark-700 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M15 14h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                        </div>
                    )}
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
                            <span className={colors.primary}>{post.votes || 0}</span>
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
}