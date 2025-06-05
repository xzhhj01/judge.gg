"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { mentorService } from "@/app/services/mentor/mentor.service";
import { useAuth } from '@/app/utils/providers';

const ServiceCard = ({ service, game }) => {
    const gameColor = game === "lol" ? "blue" : "red";

    return (
        <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
                <span>{service.icon}</span>
                <h3 className="font-medium">{service.name}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">{service.description}</p>
            <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">
                    {service.price.toLocaleString()}원
                </span>
                <button
                    onClick={() => {
                        /* 신청 모달 열기 */
                    }}
                    className={`px-4 py-2 rounded-lg text-white bg-${gameColor}-500 hover:bg-${gameColor}-600`}
                >
                    신청하기
                </button>
            </div>
        </div>
    );
};

export default function MentorDetailPage() {
    const params = useParams();
    const mentorId = params.id;
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState("reviews");
    const [showContactModal, setShowContactModal] = useState(false);
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [snackbar, setSnackbar] = useState({ show: false, message: "" });
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [reviews, setReviews] = useState([]);
    const [submittingReview, setSubmittingReview] = useState(false);

    // 스낵바 자동 숨김
    useEffect(() => {
        if (snackbar.show) {
            const timer = setTimeout(() => {
                setSnackbar({ show: false, message: "" });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [snackbar.show]);

    // 멘토 리뷰 데이터 로드
    useEffect(() => {
        const loadReviews = async () => {
            try {
                // 실제로는 mentorService.getMentorReviews(mentorId) 호출
                // 현재는 임시 데이터로 초기화
                const mockReviews = [
                    {
                        id: 1,
                        userName: "실버탈출가능?",
                        rating: 5,
                        comment: "정글링 루트부터 갱킹 타이밍까지 자세히 설명해주셔서 많이 배웠습니다. 특히 오브젝트 우선순위 설정하는 법을 알려주셔서 좋았어요!",
                        createdAt: "2024-03-15",
                    },
                    {
                        id: 2,
                        userName: "브론즈마스터",
                        rating: 4,
                        comment: "친절하게 알려주시고 실력도 많이 늘었어요. 다만 조금 더 구체적인 예시가 있었으면 좋겠어요.",
                        createdAt: "2024-03-10",
                    },
                ];
                setReviews(mockReviews);
            } catch (error) {
                console.error('리뷰 로드 실패:', error);
            }
        };

        if (mentorId) {
            loadReviews();
        }
    }, [mentorId]);

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

    // 리뷰 제출 함수
    const handleSubmitReview = async () => {
        if (!user) {
            showSnackbar("로그인이 필요합니다.");
            return;
        }

        if (!rating || !reviewText.trim()) {
            showSnackbar("별점과 리뷰 내용을 모두 입력해주세요.");
            return;
        }

        setSubmittingReview(true);
        try {
            const reviewData = {
                mentorId: mentorId,
                rating: rating,
                comment: reviewText.trim(),
                reviewerId: user.uid,
                reviewerName: user.displayName || user.email || "익명",
            };

            await mentorService.addMentorReview(reviewData);
            
            // 새로운 리뷰를 로컬 상태에 추가
            const newReview = {
                ...reviewData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
            };
            setReviews(prev => [newReview, ...prev]);

            // 모달 닫기 및 상태 초기화
            setShowReviewModal(false);
            setRating(0);
            setHoveredRating(0);
            setReviewText("");
            
            showSnackbar("리뷰가 성공적으로 등록되었습니다!");
        } catch (error) {
            console.error('리뷰 제출 실패:', error);
            showSnackbar("리뷰 등록에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setSubmittingReview(false);
        }
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
                mentoring_types: {
                    video_feedback: {
                        isSelected: true,
                        price: 10000,
                    },
                    realtime_onepoint: {
                        isSelected: true,
                        price: 15000,
                    },
                    realtime_private: {
                        isSelected: true,
                        price: 20000,
                    },
                },
            },
            // 상세 소개
            detailedIntroduction:
                "저는 7년간의 프로게이머 경력을 바탕으로 정글 포지션에서의 전문적인 코칭을 제공합니다.",
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
                mentoring_types: {
                    video_feedback: {
                        isSelected: true,
                        price: 10000,
                    },
                    realtime_onepoint: {
                        isSelected: true,
                        price: 15000,
                    },
                    realtime_private: {
                        isSelected: true,
                        price: 20000,
                    },
                },
            },
        },
    };

    const mentor = mockMentors[mentorId];

    // 임시 리뷰 데이터
    const mockReviews = [
        {
            id: 1,
            userName: "실버탈출가능?",
            rating: 5,
            content:
                "정글링 루트부터 갱킹 타이밍까지 자세히 설명해주셔서 많이 배웠습니다. 특히 오브젝트 우선순위 설정하는 법을 알려주셔서 좋았어요!",
            createdAt: "2024-03-15",
            serviceType: "영상 피드백",
        },
        {
            id: 2,
            userName: "미드장인될래요",
            rating: 4,
            content:
                "친절하게 설명해주시고 실전에서 바로 써먹을 수 있는 팁들을 많이 알려주셨습니다.",
            createdAt: "2024-03-10",
            serviceType: "실시간 1:1",
        },
    ];

    // 임시 받은 피드백 데이터 (리뷰 작성 가능 여부 확인용)
    const mockReceivedFeedbacks = [
        {
            id: 1,
            status: "completed",
            hasReview: false,
            completedAt: "2024-03-20",
            serviceType: "영상 피드백",
        },
    ];

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
                                            한줄 소개
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
                        <section id="experience" className="bg-white rounded-xl border border-gray-200 p-6">
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
                        <section
                            id="curriculum"
                            className="bg-white rounded-xl border border-gray-200 p-6"
                        >
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                커리큘럼
                            </h2>
                            <div className="space-y-4">
                                {[
                                    {
                                        type: "video_feedback",
                                        title: "영상 피드백",
                                        description:
                                            "녹화된 게임 영상을 보고 상세한 피드백을 제공합니다",
                                    },
                                    {
                                        type: "realtime_onepoint",
                                        title: "실시간 원포인트 피드백",
                                        description:
                                            "특정 스킬이나 전략에 대해 실시간으로 피드백합니다",
                                    },
                                    {
                                        type: "realtime_private",
                                        title: "실시간 1:1 피드백",
                                        description:
                                            "1:1 맞춤형 실시간 코칭을 제공합니다",
                                    },
                                ].map((service) => {
                                    const serviceData =
                                        mentor.curriculum.mentoring_types[
                                            service.type
                                        ];
                                    if (!serviceData.isSelected) return null;

                                    return (
                                        <div
                                            key={service.type}
                                            className="border border-gray-200 rounded-lg hover:border-primary-500 transition-colors p-4"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                                                        {service.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        {service.description}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-primary-600">
                                                        {serviceData.price.toLocaleString()}
                                                        원
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        회당
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* 6. 상세 소개 영역 */}
                        <section id="introduction" className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                상세 소개
                            </h2>
                            <p className="text-gray-700">
                                {mentor.detailedIntroduction ||
                                    "상세 소개가 등록되지 않았습니다."}
                            </p>
                        </section>

                        {/* 5. 탭 영역 */}
                        <section id="reviews" className="bg-white rounded-xl border border-gray-200">
                            {/* 탭 헤더 */}
                            <div className="border-b border-gray-200">
                                <nav className="grid grid-cols-2">
                                    {[
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
                                {activeTab === "reviews" && (
                                    <div className="space-y-6">
                                        {/* 리뷰 작성 가능한 경우 표시 */}
                                        {mockReceivedFeedbacks
                                            .filter(
                                                (feedback) =>
                                                    feedback.status ===
                                                        "completed" &&
                                                    !feedback.hasReview
                                            )
                                            .map((feedback) => (
                                                <div
                                                    key={feedback.id}
                                                    className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <h3 className="text-sm font-medium text-blue-900">
                                                                피드백을
                                                                받으셨네요!
                                                                멘토님의
                                                                피드백은
                                                                어떠셨나요?
                                                            </h3>
                                                            <p className="text-sm text-blue-700 mt-1">
                                                                {
                                                                    feedback.serviceType
                                                                }{" "}
                                                                ·{" "}
                                                                {
                                                                    feedback.completedAt
                                                                }{" "}
                                                                완료
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                setShowReviewModal(
                                                                    true
                                                                )
                                                            }
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                                        >
                                                            리뷰 작성하기
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                        {/* 리뷰 목록 */}
                                        <div className="space-y-4">
                                            {reviews.map((review) => (
                                                <div
                                                    key={review.id}
                                                    className="border border-gray-200 rounded-lg p-4"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-gray-900">
                                                                    {
                                                                        review.reviewerName || review.userName
                                                                    }
                                                                </span>
                                                                <span className="text-sm text-gray-500">
                                                                    {
                                                                        review.serviceType
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center mt-1">
                                                                {[
                                                                    1, 2, 3, 4,
                                                                    5,
                                                                ].map(
                                                                    (star) => (
                                                                        <svg
                                                                            key={
                                                                                star
                                                                            }
                                                                            className={`w-4 h-4 ${
                                                                                star <=
                                                                                review.rating
                                                                                    ? "text-yellow-400"
                                                                                    : "text-gray-300"
                                                                            }`}
                                                                            fill="currentColor"
                                                                            viewBox="0 0 20 20"
                                                                        >
                                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                        </svg>
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="text-sm text-gray-500">
                                                            {review.createdAt}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-700">
                                                        {review.comment || review.content}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
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

                    {/* 오른쪽: 사이드바 */}
                    <div className="lg:col-span-1">
                        <div className="space-y-6 sticky top-24">
                            {/* 액션 버튼 */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setShowApplyModal(true)}
                                        className={`w-full ${
                                            mentor.game === "lol"
                                                ? "bg-blue-500 hover:bg-blue-600"
                                                : "bg-red-500 hover:bg-red-600"
                                        } text-white py-3 rounded-lg font-medium transition-colors`}
                                    >
                                        피드백 신청하기
                                    </button>
                                    <button
                                        onClick={() =>
                                            setShowContactModal(true)
                                        }
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

                            {/* 목차 네비게이션 */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <nav className="space-y-3">
                                    <a
                                        href="#experience"
                                        className="block text-gray-600 hover:text-primary-600 transition-colors"
                                    >
                                        경력
                                    </a>
                                    <a
                                        href="#curriculum"
                                        className="block text-gray-600 hover:text-primary-600 transition-colors"
                                    >
                                        커리큘럼
                                    </a>
                                    <a
                                        href="#introduction"
                                        className="block text-gray-600 hover:text-primary-600 transition-colors"
                                    >
                                        상세 소개
                                    </a>
                                    <a
                                        href="#reviews"
                                        className="block text-gray-600 hover:text-primary-600 transition-colors"
                                    >
                                        리뷰
                                    </a>
                                </nav>
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

            {/* 신청 모달 */}
            {showApplyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                피드백 신청하기
                            </h3>
                            <button
                                onClick={() => setShowApplyModal(false)}
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
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    신청할 서비스
                                </label>
                                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="">
                                        서비스를 선택해주세요
                                    </option>
                                    {Object.entries(
                                        mentor.curriculum.mentoring_types
                                    ).map(([type, data]) => {
                                        if (!data.isSelected) return null;
                                        const serviceTitle = {
                                            video_feedback: "영상 피드백",
                                            realtime_onepoint:
                                                "실시간 원포인트 피드백",
                                            realtime_private:
                                                "실시간 1:1 피드백",
                                        }[type];
                                        return (
                                            <option key={type} value={type}>
                                                {serviceTitle} (
                                                {data.price.toLocaleString()}원)
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    메시지
                                </label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                                    placeholder="멘토에게 전달할 메시지를 입력해주세요"
                                />
                            </div>
                        </div>
                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    /* TODO: 신청 로직 구현 */
                                    setShowApplyModal(false);
                                    showSnackbar("신청이 완료되었습니다");
                                }}
                                className={`flex-1 ${
                                    mentor.game === "lol"
                                        ? "bg-blue-500 hover:bg-blue-600"
                                        : "bg-red-500 hover:bg-red-600"
                                } text-white py-2 rounded-lg font-medium transition-colors`}
                            >
                                신청하기
                            </button>
                            <button
                                onClick={() => setShowApplyModal(false)}
                                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 py-2 rounded-lg font-medium transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 리뷰 작성 모달 */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                리뷰 작성하기
                            </h3>
                            <button
                                onClick={() => {
                                    setShowReviewModal(false);
                                    setRating(0);
                                    setHoveredRating(0);
                                }}
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

                        <div className="space-y-4">
                            {/* 별점 선택 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    멘토님의 피드백은 어떠셨나요?
                                </label>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onMouseEnter={() =>
                                                setHoveredRating(star)
                                            }
                                            onMouseLeave={() =>
                                                setHoveredRating(0)
                                            }
                                            onClick={() => setRating(star)}
                                            className="p-1"
                                        >
                                            <svg
                                                className={`w-8 h-8 ${
                                                    star <=
                                                    (hoveredRating || rating)
                                                        ? "text-yellow-400"
                                                        : "text-gray-300"
                                                }`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 리뷰 내용 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    상세한 리뷰를 작성해주세요
                                </label>
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[120px]"
                                    placeholder="멘토님의 피드백이 어떤 점에서 도움이 되었나요?"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowReviewModal(false);
                                    setRating(0);
                                    setHoveredRating(0);
                                    setReviewText("");
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                disabled={submittingReview}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSubmitReview}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!rating || !reviewText.trim() || submittingReview}
                            >
                                {submittingReview ? "등록 중..." : "리뷰 등록"}
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
