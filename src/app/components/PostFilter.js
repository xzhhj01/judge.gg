"use client";

import { useState } from "react";

export default function PostFilter({ gameType, onSortChange, onSearchChange }) {
    const [sortBy, setSortBy] = useState("latest");
    const [searchQuery, setSearchQuery] = useState("");

    const handleSortChange = (sortType) => {
        setSortBy(sortType);
        onSortChange(sortType);
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
        onSearchChange(query);
    };

    const getThemeColor = () => {
        return gameType === "lol" ? "#0ea5e9" : "#ef4444";
    };

    const getFocusRingClass = () => {
        return gameType === "lol"
            ? "focus:ring-lol-500"
            : "focus:ring-valorant-500";
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                {/* 정렬 버튼들 */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: "latest", label: "최신순" },
                        { key: "popular", label: "인기순" },
                        { key: "votes", label: "투표 많은 순" },
                    ].map((sort) => (
                        <button
                            key={sort.key}
                            onClick={() => handleSortChange(sort.key)}
                            style={{
                                backgroundColor:
                                    sortBy === sort.key
                                        ? getThemeColor()
                                        : "#ffffff",
                                color:
                                    sortBy === sort.key ? "#ffffff" : "#374151",
                                borderColor:
                                    sortBy === sort.key
                                        ? getThemeColor()
                                        : "#d1d5db",
                            }}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 hover:bg-gray-50"
                        >
                            {sort.label}
                        </button>
                    ))}
                </div>

                {/* 검색창 */}
                <div className="relative w-full lg:w-64">
                    <input
                        type="text"
                        placeholder="게시글 검색..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className={`w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 ${getFocusRingClass()} focus:border-transparent`}
                    />
                    <svg
                        className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
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
            </div>
        </div>
    );
}
