"use client";

import Link from "next/link";

export default function MentorCard({ mentor }) {
    const getGameBadgeColor = (game) => {
        switch (game) {
            case "lol":
                return "bg-blue-100 text-blue-700";
            case "valorant":
                return "bg-red-100 text-red-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getGameName = (game) => {
        switch (game) {
            case "lol":
                return "LoL";
            case "valorant":
                return "VALORANT";
            default:
                return "기타";
        }
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <svg
                    key={i}
                    className="w-4 h-4 text-yellow-400 fill-current"
                    viewBox="0 0 20 20"
                >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
            );
        }

        if (hasHalfStar) {
            stars.push(
                <svg
                    key="half"
                    className="w-4 h-4 text-yellow-400 fill-current"
                    viewBox="0 0 20 20"
                >
                    <defs>
                        <linearGradient id="half">
                            <stop offset="50%" stopColor="currentColor" />
                            <stop offset="50%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                    <path
                        fill="url(#half)"
                        d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
                    />
                </svg>
            );
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <svg
                    key={`empty-${i}`}
                    className="w-4 h-4 text-gray-300 fill-current"
                    viewBox="0 0 20 20"
                >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
            );
        }

        return stars;
    };

    return (
        <Link href={`/mentor/${mentor.id}`}>
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-primary-200">
                {/* 게임 배지 */}
                <div className="flex justify-between items-start mb-4">
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getGameBadgeColor(
                            mentor.selectedGame || mentor.game
                        )}`}
                    >
                        {getGameName(mentor.selectedGame || mentor.game)}
                    </span>
                </div>

                {/* 프로필 사진 */}
                <div className="text-center mb-4">
                    <div className="relative inline-block">
                        {mentor.profileImageUrl ? (
                            <img
                                src={mentor.profileImageUrl}
                                alt={`${mentor.nickname || mentor.userName} 프로필`}
                                className="w-16 h-16 rounded-full mx-auto object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto flex items-center justify-center text-white font-bold text-xl">
                                {(mentor.nickname || mentor.userName || 'U').charAt(0)}
                            </div>
                        )}
                    </div>
                </div>

                {/* 닉네임 */}
                <h3 className="font-semibold text-gray-900 text-center mb-2 truncate">
                    {mentor.nickname || mentor.userName || '알 수 없음'}
                </h3>

                {/* 평점 */}
                <div className="flex items-center justify-center mb-3">
                    <div className="flex items-center mr-2">
                        {renderStars(mentor.rating || 0)}
                    </div>
                    <span className="text-sm text-gray-600">
                        {(mentor.rating || 0).toFixed(1)} ({mentor.totalReviews || mentor.reviewCount || 0})
                    </span>
                </div>

                {/* 태그 */}
                {mentor.tags && mentor.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3 justify-center">
                        {mentor.tags.slice(0, 2).map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                        {mentor.tags.length > 2 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{mentor.tags.length - 2}
                            </span>
                        )}
                    </div>
                )}

                {/* 응답률 & 총 답변 */}
                <div className="flex justify-between text-sm text-gray-600 border-t border-gray-100 pt-3">
                    <div className="text-center">
                        <div className="font-medium text-gray-900">
                            {mentor.responseRate || 95}%
                        </div>
                        <div className="text-xs">응답률</div>
                    </div>
                    <div className="text-center">
                        <div className="font-medium text-gray-900">
                            {mentor.totalFeedbacks || mentor.totalAnswers || 0}
                        </div>
                        <div className="text-xs">총 답변</div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
