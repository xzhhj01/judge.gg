"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MentorCard from "../../../components/MentorCard";
import MentorSearchFilter from "../../../components/MentorSearchFilter";
import { mentorService } from "@/app/services/mentor/mentor.service";

export default function AllMentorsPage() {
    const [selectedGame, setSelectedGame] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("rating"); // rating, price, reviews
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);

    // Firebase에서 멘토 데이터 로드
    useEffect(() => {
        const loadMentors = async () => {
            try {
                setLoading(true);
                const mentorList = await mentorService.getMentors(selectedGame);
                setMentors(mentorList);
            } catch (error) {
                console.error('멘토 목록 로드 실패:', error);
                // 에러 발생 시 빈 배열로 설정
                setMentors([]);
            } finally {
                setLoading(false);
            }
        };

        loadMentors();
    }, [selectedGame]);


    // 필터링된 멘토 목록
    const filteredMentors = mentors.filter((mentor) => {
        const matchesGame =
            selectedGame === "all" || mentor.game === selectedGame || mentor.selectedGame === selectedGame;
        const matchesSearch =
            (mentor.nickname || mentor.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (mentor.tags && mentor.tags.some((tag) =>
                tag.toLowerCase().includes(searchQuery.toLowerCase())
            ));

        return matchesGame && matchesSearch;
    });

    // 정렬된 멘토 목록
    const sortedMentors = [...filteredMentors].sort((a, b) => {
        switch (sortBy) {
            case "rating":
                return (b.rating || 0) - (a.rating || 0);
            case "reviews":
                return (b.totalReviews || 0) - (a.totalReviews || 0);
            case "answers":
                return (b.totalFeedbacks || 0) - (a.totalFeedbacks || 0);
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

                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">멘토 목록을 불러오는 중...</p>
                    </div>
                ) : sortedMentors.length > 0 ? (
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
