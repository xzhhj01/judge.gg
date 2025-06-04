"use client";

import Link from "next/link";

export default function PostCard({ post, gameType }) {
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

    return (
        <Link href={`/${gameType}/community/post/${post.id}`}>
            <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer">
                {/* 상단: 제목과 투표수 */}
                <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-4 line-clamp-2">
                        {post.title}
                    </h3>
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
                            <span className="text-base font-medium text-blue-700">
                                {post.votes}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
