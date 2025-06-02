"use client";

import { useState } from "react";
import Link from "next/link";
import MentorCard from "../../../components/MentorCard";
import MentorSearchFilter from "../../../components/MentorSearchFilter";

export default function AllMentorsPage() {
    const [selectedGame, setSelectedGame] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("rating"); // rating, price, reviews

    // 확장된 더미 멘토 데이터 (실제로는 API에서 가져올 데이터)
    const mockMentors = [
        {
            id: 1,
            nickname: "프로게이머김철수",
            game: "lol",
            profileImage: null,
            rating: 4.8,
            reviewCount: 127,
            tags: ["정글", "갱킹", "캐리"],
            responseRate: 95,
            totalAnswers: 234,
            isOnline: true,
            isVerified: true,
        },
        {
            id: 2,
            nickname: "발로마스터",
            game: "valorant",
            profileImage: null,
            rating: 4.6,
            reviewCount: 89,
            tags: ["에임", "포지셔닝", "전략"],
            responseRate: 88,
            totalAnswers: 156,
            isOnline: false,
            isVerified: true,
        },
        {
            id: 3,
            nickname: "서포터장인",
            game: "lol",
            profileImage: null,
            rating: 4.9,
            reviewCount: 203,
            tags: ["서포터", "와드", "로밍"],
            responseRate: 97,
            totalAnswers: 445,
            isOnline: true,
            isVerified: false,
        },
        {
            id: 4,
            nickname: "듀얼리스트킹",
            game: "valorant",
            profileImage: null,
            rating: 4.4,
            reviewCount: 67,
            tags: ["듀얼리스트", "엔트리", "클러치"],
            responseRate: 82,
            totalAnswers: 98,
            isOnline: true,
            isVerified: true,
        },
        {
            id: 5,
            nickname: "탑라이너프로",
            game: "lol",
            profileImage: null,
            rating: 4.7,
            reviewCount: 156,
            tags: ["탑라인", "스플릿", "탱커"],
            responseRate: 91,
            totalAnswers: 289,
            isOnline: false,
            isVerified: true,
        },
        {
            id: 6,
            nickname: "컨트롤러마스터",
            game: "valorant",
            profileImage: null,
            rating: 4.5,
            reviewCount: 134,
            tags: ["컨트롤러", "스모크", "맵컨트롤"],
            responseRate: 89,
            totalAnswers: 201,
            isOnline: true,
            isVerified: false,
        },
        {
            id: 7,
            nickname: "미드라이너킹",
            game: "lol",
            profileImage: null,
            rating: 4.6,
            reviewCount: 98,
            tags: ["미드라인", "로밍", "어쌔신"],
            responseRate: 93,
            totalAnswers: 167,
            isOnline: true,
            isVerified: true,
        },
        {
            id: 8,
            nickname: "센티넬장인",
            game: "valorant",
            profileImage: null,
            rating: 4.8,
            reviewCount: 112,
            tags: ["센티넬", "수비", "사이트홀딩"],
            responseRate: 96,
            totalAnswers: 178,
            isOnline: false,
            isVerified: true,
        },
    ];

    // 필터링된 멘토 목록
    const filteredMentors = mockMentors.filter((mentor) => {
        const matchesGame =
            selectedGame === "all" || mentor.game === selectedGame;
        const matchesSearch =
            mentor.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            mentor.tags.some((tag) =>
                tag.toLowerCase().includes(searchQuery.toLowerCase())
            );

        return matchesGame && matchesSearch;
    });

    // 정렬된 멘토 목록
    const sortedMentors = [...filteredMentors].sort((a, b) => {
        switch (sortBy) {
            case "rating":
                return b.rating - a.rating;
            case "reviews":
                return b.reviewCount - a.reviewCount;
            case "answers":
                return b.totalAnswers - a.totalAnswers;
            default:
                return 0;
        }
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <MentorSearchFilter
                selectedGame={selectedGame}
                setSelectedGame={setSelectedGame}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                sortBy={sortBy}
                setSortBy={setSortBy}
                showSort={true}
            />

            {/* 멘토 목록 */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 페이지 제목 */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        전체 멘토
                    </h1>
                </div>

                {sortedMentors.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {sortedMentors.map((mentor) => (
                            <MentorCard key={mentor.id} mentor={mentor} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-400 text-6xl mb-4">🔍</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            검색 결과가 없습니다
                        </h3>
                        <p className="text-gray-600">
                            다른 검색어나 필터를 시도해보세요
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
