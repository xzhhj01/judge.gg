import Link from "next/link";

export default function PopularPostCard({ post, gameType }) {
    const colorClass = gameType === "lol" ? "lol" : "valorant";

    return (
        <Link href={`/${gameType}/community/post/${post.id}`}>
            <div className="w-[360px] flex-shrink-0 p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900 line-clamp-2 mr-4 leading-normal">
                        {post.title}
                    </h3>
                </div>
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {post.tags.map((tag) => (
                            <span
                                key={tag}
                                className={`px-2 py-1 text-xs bg-${colorClass}-100 text-${colorClass}-700 rounded-full`}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                <div className="flex items-center justify-end space-x-3 text-sm text-gray-500">
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
                                strokeWidth="2"
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            ></path>
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            ></path>
                        </svg>
                        <span>{post.views || 0}</span>
                    </div>
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
                                strokeWidth="2"
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            ></path>
                        </svg>
                        <span>{post.commentCount || post.comments || 0}</span>
                    </div>
                    <div
                        className={`flex items-center space-x-1 bg-${colorClass}-50 px-2 py-1 rounded-lg`}
                    >
                        <svg
                            className={`w-4 h-4 text-${colorClass}-500`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                            ></path>
                        </svg>
                        <span
                            className={`text-sm font-medium text-${colorClass}-700`}
                        >
                            {post.likes || post.votes || 0}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
