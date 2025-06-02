"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function MentorDetailPage() {
    const params = useParams();
    const mentorId = params.id;
    const [activeTab, setActiveTab] = useState("feedback"); // feedback, reviews, activity
    const [showContactModal, setShowContactModal] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [snackbar, setSnackbar] = useState({ show: false, message: "" });

    // 스낵바 자동 숨김
    useEffect(() => {
        if (snackbar.show) {
            const timer = setTimeout(() => {
                setSnackbar({ show: false, message: "" });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [snackbar.show]);

    const showSnackbar = (message) => {
        setSnackbar({ show: true, message });
    };

    const handleLike = () => {
        setIsLiked(!isLiked);
        showSnackbar(
            isLiked ? "찜 목록에서 제거되었어요." : "찜 목록에 추가되었어요."
        );
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        showSnackbar("링크가 복사되었어요.");
    };

    // 더미 멘토 데이터 (실제로는 API에서 ID로 조회)
    const mockMentors = {
        1: {
            id: 1,
            nickname: "프로게이머김철수",
            game: "lol",
            profileImage: null,
            rating: 4.8,
            reviewCount: 127,
            responseRate: 95,
            totalAnswers: 234,
            isVerified: true,
            // Profile 영역
            oneLineIntro: "7년 프로게이머 경력의 정글 전문 코치입니다",
            contact: "discord: kimcs#1234",
            // Tag 영역
            gameTag: "LoL",
            characterTags: ["친절한", "체계적인", "실력향상보장"],
            championTags: [], // JSON으로 추후 추가
            lineTags: ["정글"],
            // Experience 영역
            experienceType: ["프로게이머", "코치"],
            experienceDetails: [
                "LCK 출전 경험 (2017-2022)",
                "챌린저 달성 5회",
                "정글 전문 코치 (2022-현재)",
                "개인 멘토링 200명+ 지도",
            ],
            // Curriculum 영역
            curriculum: {
                title: "정글 마스터 과정",
                description: "기초부터 고급까지 체계적인 정글 교육",
                sessions: [
                    {
                        title: "1회차: 정글 기초 이론",
                        duration: "60분",
                        content: [
                            "정글 루트 이해",
                            "갱킹 기본 원리",
                            "와드 배치",
                        ],
                    },
                    {
                        title: "2회차: 실전 갱킹",
                        duration: "60분",
                        content: [
                            "갱킹 타이밍",
                            "라인 상황 판단",
                            "카운터 갱킹",
                        ],
                    },
                    {
                        title: "3회차: 오브젝트 컨트롤",
                        duration: "60분",
                        content: [
                            "드래곤/바론 컨트롤",
                            "팀파이트 포지셔닝",
                            "후반 운영",
                        ],
                    },
                ],
            },
        },
        2: {
            id: 2,
            nickname: "발로마스터",
            game: "valorant",
            profileImage: null,
            rating: 4.6,
            reviewCount: 89,
            responseRate: 88,
            totalAnswers: 156,
            isVerified: true,
            oneLineIntro: "레디언트 달성 경험의 에임 전문 코치",
            contact: "discord: valomaster#5678",
            gameTag: "VALORANT",
            characterTags: ["꼼꼼한", "에임향상전문"],
            championTags: [],
            lineTags: ["듀얼리스트", "컨트롤러"],
            experienceType: ["고티어", "스트리머"],
            experienceDetails: [
                "레디언트 3회 달성",
                "발로란트 챔피언스 투어 참가",
                "트위치 스트리머 (팔로워 5만+)",
                "에임 트레이닝 전문",
            ],
            curriculum: {
                title: "에임 마스터 과정",
                description: "체계적인 에임 향상과 게임 센스 개발",
                sessions: [
                    {
                        title: "1회차: 에임 기초",
                        duration: "60분",
                        content: [
                            "마우스 설정",
                            "크로스헤어 조정",
                            "기본 에임 연습",
                        ],
                    },
                    {
                        title: "2회차: 실전 에임",
                        duration: "60분",
                        content: [
                            "피킹 연습",
                            "리코일 컨트롤",
                            "움직이며 쏘기",
                        ],
                    },
                ],
            },
        },
    };

    const mentor = mockMentors[mentorId];

    if (!mentor) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        멘토를 찾을 수 없습니다
                    </h1>
                    <Link
                        href="/mentor"
                        className="text-primary-600 hover:text-primary-700"
                    >
                        멘토 목록으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);

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

        const emptyStars = 5 - fullStars;
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
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 뒤로가기 */}
                <div className="mb-6">
                    <Link
                        href="/mentor"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        멘토 목록으로
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* 왼쪽: 멘토 정보 (3/4) */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* 1. Profile 영역 */}
                        <section className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                                {/* 프로필 사진 */}
                                <div className="flex flex-col items-center">
                                    <div className="relative">
                                        <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-4xl">
                                            {mentor.nickname.charAt(0)}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                                            {mentor.game === "lol" ? (
                                                <img
                                                    src="/images/lol-logo.png"
                                                    alt="League of Legends"
                                                    className="w-7 h-7"
                                                    onError={(e) => {
                                                        e.target.style.display =
                                                            "none";
                                                        e.target.nextSibling.style.display =
                                                            "block";
                                                    }}
                                                />
                                            ) : (
                                                <img
                                                    src="/images/valorant-logo.png"
                                                    alt="VALORANT"
                                                    className="w-7 h-7"
                                                    onError={(e) => {
                                                        e.target.style.display =
                                                            "none";
                                                        e.target.nextSibling.style.display =
                                                            "block";
                                                    }}
                                                />
                                            )}
                                            <span
                                                className="text-xs font-medium text-gray-600"
                                                style={{ display: "none" }}
                                            >
                                                {mentor.gameTag}
                                            </span>
                                        </div>
                                    </div>
                                    <h1 className="text-xl font-bold text-gray-900 mt-4">
                                        {mentor.nickname}
                                    </h1>
                                </div>

                                {/* 멘토 소개 */}
                                <div className="md:col-span-2 flex flex-col">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-2">
                                            한줄소개
                                        </h3>
                                        <p className="text-gray-700 mb-4">
                                            {mentor.oneLineIntro}
                                        </p>
                                    </div>

                                    {/* 태그들 - 하단에 배치 */}
                                    <div className="space-y-2">
                                        {/* 특징 태그 */}
                                        <div>
                                            <span className="text-sm font-medium text-gray-700 mr-3">
                                                특징
                                            </span>
                                            <div className="inline-flex flex-wrap gap-1">
                                                {mentor.characterTags.map(
                                                    (tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                                                        >
                                                            {tag}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* 라인 태그 */}
                                        <div>
                                            <span className="text-sm font-medium text-gray-700 mr-3">
                                                라인
                                            </span>
                                            <div className="inline-flex flex-wrap gap-1">
                                                {mentor.lineTags.map(
                                                    (tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                                                        >
                                                            {tag}
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* 챔피언 태그 */}
                                        <div>
                                            <span className="text-sm font-medium text-gray-700 mr-3">
                                                챔피언
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                추후 업데이트 예정
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. 통계 영역 */}
                        <section className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="grid grid-cols-3 gap-4 divide-x divide-gray-200">
                                <div className="text-center">
                                    <div className="flex items-center justify-center mb-1">
                                        {renderStars(mentor.rating)}
                                        <span className="ml-1 font-semibold text-gray-900">
                                            {mentor.rating.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        평점 ({mentor.reviewCount})
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold text-gray-900">
                                        {mentor.responseRate}%
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        응답률
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold text-gray-900">
                                        {mentor.totalAnswers}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        피드백 답변
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. Experience 영역 */}
                        <section className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                경력
                            </h2>

                            {/* 경력 타입 */}
                            <div className="mb-4">
                                <div className="flex flex-wrap gap-2">
                                    {mentor.experienceType.map(
                                        (type, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-medium"
                                            >
                                                {type}
                                            </span>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* 상세 경력 */}
                            <div>
                                <ul className="space-y-2">
                                    {mentor.experienceDetails.map(
                                        (detail, index) => (
                                            <li
                                                key={index}
                                                className="flex items-start"
                                            >
                                                <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                                <span className="text-gray-700">
                                                    {detail}
                                                </span>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                        </section>

                        {/* 4. Curriculum 영역 */}
                        <section className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                커리큘럼
                            </h2>

                            <div className="mb-4">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {mentor.curriculum.title}
                                </h3>
                                <p className="text-gray-600">
                                    {mentor.curriculum.description}
                                </p>
                            </div>

                            <div className="space-y-4">
                                {mentor.curriculum.sessions.map(
                                    (session, index) => (
                                        <div
                                            key={index}
                                            className="border border-gray-200 rounded-lg p-4"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-gray-900">
                                                    {session.title}
                                                </h4>
                                                <span className="text-sm text-gray-500">
                                                    {session.duration}
                                                </span>
                                            </div>
                                            <ul className="space-y-1">
                                                {session.content.map(
                                                    (item, itemIndex) => (
                                                        <li
                                                            key={itemIndex}
                                                            className="text-sm text-gray-600 flex items-center"
                                                        >
                                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                                                            {item}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    )
                                )}
                            </div>
                        </section>

                        {/* 5. 탭 영역 */}
                        <section className="bg-white rounded-xl border border-gray-200">
                            {/* 탭 헤더 */}
                            <div className="border-b border-gray-200">
                                <nav className="grid grid-cols-3">
                                    {[
                                        {
                                            key: "feedback",
                                            label: "피드백 답변",
                                        },
                                        { key: "reviews", label: "리뷰" },
                                        { key: "activity", label: "최근 활동" },
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() =>
                                                setActiveTab(tab.key)
                                            }
                                            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors text-center ${
                                                activeTab === tab.key
                                                    ? "border-primary-500 text-primary-600"
                                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* 탭 콘텐츠 */}
                            <div className="p-6">
                                {activeTab === "feedback" && (
                                    <div className="text-center py-8 text-gray-500">
                                        피드백 답변 내용이 여기에 표시됩니다
                                    </div>
                                )}
                                {activeTab === "reviews" && (
                                    <div className="text-center py-8 text-gray-500">
                                        리뷰 내용이 여기에 표시됩니다
                                    </div>
                                )}
                                {activeTab === "activity" && (
                                    <div className="text-center py-8 text-gray-500">
                                        최근 활동 내용이 여기에 표시됩니다
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* 오른쪽: 액션 버튼 사이드바 (1/4) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
                            <div className="space-y-3">
                                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors">
                                    피드백 문의
                                </button>
                                <button
                                    onClick={() => setShowContactModal(true)}
                                    className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-lg font-medium transition-colors"
                                >
                                    연락처 보기
                                </button>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={handleLike}
                                        className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                                    >
                                        <svg
                                            className={`w-4 h-4 mr-1 ${
                                                isLiked
                                                    ? "text-red-500 fill-current"
                                                    : "text-gray-400"
                                            }`}
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        찜
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                                    >
                                        <svg
                                            className="w-4 h-4 mr-1"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                                            />
                                        </svg>
                                        공유
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 연락처 모달 */}
            {showContactModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                연락처 정보
                            </h3>
                            <button
                                onClick={() => setShowContactModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="mb-6">
                            <p className="text-gray-700 mb-2">
                                <span className="font-medium">
                                    {mentor.nickname}
                                </span>
                                님의 연락처
                            </p>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-gray-900 font-mono">
                                    {mentor.contact}
                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() =>
                                    navigator.clipboard.writeText(
                                        mentor.contact
                                    )
                                }
                                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-lg font-medium transition-colors"
                            >
                                복사하기
                            </button>
                            <button
                                onClick={() => setShowContactModal(false)}
                                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-lg font-medium transition-colors"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 스낵바 */}
            {snackbar.show && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                    <div className="bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
                        <svg
                            className="w-5 h-5 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        <span className="text-sm font-medium">
                            {snackbar.message}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
