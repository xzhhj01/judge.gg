"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MentorCard from "../../components/MentorCard";
import MentorSearchFilter from "../../components/MentorSearchFilter";
import { mentorService } from "../../services/mentor/mentor.service";

export default function MentorPage() {
    const [selectedGame, setSelectedGame] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [mentors, setMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 멘토 데이터 로드
    useEffect(() => {
        const loadMentors = async () => {
            try {
                setLoading(true);
                const mentorData = await mentorService.getMentorsDirect(selectedGame);
                setMentors(mentorData);
                setError(null);
            } catch (err) {
                console.error('멘토 목록 로드 실패:', err);
                setError('멘토 목록을 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        loadMentors();
    }, [selectedGame]);

    // 필터링된 멘토 목록
    const filteredMentors = mentors.filter((mentor) => {
        const matchesSearch = 
            (mentor.nickname || mentor.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (mentor.characterTags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (mentor.lineTags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
        return matchesSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 1. Search Bar + Game Filter */}
            <MentorSearchFilter
                selectedGame={selectedGame}
                setSelectedGame={setSelectedGame}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 2. Banner Section */}
                <section className="mb-8">
                    <div className="relative bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl overflow-hidden h-48">
                        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                        <div className="relative h-full flex items-center justify-center text-center text-white">
                            <div>
                                <h2 className="text-3xl font-bold mb-3">
                                    전문 게임 멘토와 함께하세요
                                </h2>
                                <p className="text-lg text-primary-100">
                                    영상 피드백부터 1:1 심층 강의까지
                                </p>
                            </div>
                        </div>
                        {/* TODO: 슬라이드 기능 추가 예정 */}
                    </div>
                </section>

                {/* 3. 멘토 등록 배너 */}
                <section className="mb-8">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div className="mb-3 sm:mb-0">
                                <h3 className="text-lg font-bold mb-1">
                                    게임 멘토로 활동하고 싶으신가요?
                                </h3>
                                <p className="text-green-100 text-sm">
                                    전문 지식을 공유하고 수익도 창출해보세요
                                </p>
                            </div>
                            <Link
                                href="/mentor/register"
                                className="bg-white text-green-600 hover:bg-green-50 px-6 py-2 rounded-lg font-medium transition-all hover:shadow-lg inline-flex items-center text-sm"
                            >
                                멘토 등록하기
                                <svg
                                    className="w-4 h-4 ml-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                                    />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* 4. Hot Mentors Section */}
                <section>
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            🔥 인기 멘토
                        </h2>
                        <Link
                            href="/mentor/all"
                            className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                            전체보기 →
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loading ? (
                            <div className="col-span-full text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                                <p className="text-gray-600">멘토 목록을 불러오는 중...</p>
                            </div>
                        ) : error ? (
                            <div className="col-span-full text-center py-12">
                                <div className="text-red-400 text-6xl mb-4">⚠️</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    오류가 발생했습니다
                                </h3>
                                <p className="text-gray-600">{error}</p>
                            </div>
                        ) : filteredMentors.length > 0 ? (
                            filteredMentors.map((mentor) => (
                                <MentorCard key={mentor.id} mentor={mentor} />
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {mentors.length === 0 ? '등록된 멘토가 없습니다' : '검색 결과가 없습니다'}
                                </h3>
                                <p className="text-gray-600">
                                    {mentors.length === 0 ? '첫 번째 멘토가 되어보세요!' : '다른 검색어나 필터를 시도해보세요'}
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
