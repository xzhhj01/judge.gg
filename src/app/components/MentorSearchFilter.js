"use client";

export default function MentorSearchFilter({
    selectedGame,
    setSelectedGame,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    showSort = false,
}) {
    return (
        <section className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* 게임 필터 - 왼쪽 */}
                    <div className="flex bg-gray-100 rounded-lg p-1 lg:mr-6">
                        {[
                            { key: "all", label: "전체", icon: "🎮" },
                            { key: "lol", label: "LoL", icon: "⚔️" },
                            {
                                key: "valorant",
                                label: "VALORANT",
                                icon: "🎯",
                            },
                        ].map((game) => (
                            <button
                                key={game.key}
                                onClick={() => setSelectedGame(game.key)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    selectedGame === game.key
                                        ? game.key === "all"
                                            ? "bg-white !text-black shadow-sm"
                                            : "bg-white text-primary-600 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                }`}
                            >
                                <span className="mr-2">{game.icon}</span>
                                {game.label}
                            </button>
                        ))}
                    </div>

                    {/* 검색창 - 오른쪽 (확장) */}
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="태그, 멘토명, 게임으로 검색..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-6 py-2 pl-12 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
                        />
                        <svg
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>

                    {/* 정렬 (전체보기 페이지에서만 표시) */}
                    {showSort && (
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="rating">평점순</option>
                            <option value="reviews">리뷰순</option>
                            <option value="answers">답변순</option>
                        </select>
                    )}
                </div>
            </div>
        </section>
    );
}
