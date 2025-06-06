import Link from "next/link";

export const MainPostCard = ({
    post,
    type = "default",
    gameType = "lol",
    hideVotes = false,
}) => {
    const isLol = gameType === "lol";
    const themeColor = isLol ? "lol" : "valorant";
    const accentColor = isLol ? "blue" : "red";

    return (
        <Link
            href={`/${gameType}/community/post/${post.id}`}
            className="w-full"
        >
            <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4">
                    {/* 제목과 마감일 */}
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-medium text-gray-900 line-clamp-2 mr-4 leading-normal">
                            {post.title}
                        </h3>
                        {post.voteEndTime && (
                            <span className="text-red-500 text-sm whitespace-nowrap flex-shrink-0">
                                {new Date(
                                    post.voteEndTime
                                ).toLocaleDateString()}{" "}
                                마감
                            </span>
                        )}
                    </div>

                    {/* 태그 */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.map((tag) => (
                            <span
                                key={tag}
                                className={`px-2 py-1 text-xs rounded-full ${
                                    isLol
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-red-100 text-red-700"
                                }`}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* 투표 결과 */}
                    {!hideVotes && post.voteCounts && (
                        <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1 text-gray-600">
                                <span>{post.voteCounts.option1Text}</span>
                                <span>{post.voteCounts.option2Text}</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full bg-${accentColor}-500`}
                                    style={{
                                        width: `${
                                            (post.voteCounts.option1 /
                                                (post.voteCounts.option1 +
                                                    post.voteCounts.option2)) *
                                            100
                                        }%`,
                                    }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-xs mt-1 text-gray-500">
                                <span>{post.voteCounts.option1}표</span>
                                <span>{post.voteCounts.option2}표</span>
                            </div>
                        </div>
                    )}

                    {/* 통계 정보 */}
                    <div className="flex items-center justify-end space-x-3 text-sm text-gray-500">
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
                            <span>{post.views || 0}</span>
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
                            <span>{post.comments || 0}</span>
                        </div>

                        {/* 투표수 */}
                        {!hideVotes && (
                            <div
                                className={`flex items-center space-x-1 bg-${accentColor}-50 px-2 py-1 rounded-lg`}
                            >
                                <svg
                                    className={`w-4 h-4 text-${accentColor}-500`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span
                                    className={`text-sm font-medium text-${accentColor}-700`}
                                >
                                    {post.voteOptions &&
                                    Array.isArray(post.voteOptions) &&
                                    post.voteOptions.length >= 2
                                        ? post.totalVotes || 0
                                        : post.votes || 0}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};
