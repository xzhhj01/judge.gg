"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { mentorService } from "@/app/services/mentor/mentor.service";
import { userService } from "@/app/services/user/user.service";
import { useAuth } from '@/app/utils/providers';
import { useSession } from 'next-auth/react';
import { communityService } from '@/app/services/community/community.service';

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
    const { data: session } = useSession();
    const [mentor, setMentor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
    const [selectedService, setSelectedService] = useState("");
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [recentActivities, setRecentActivities] = useState([]);

    // 멘토 데이터 로드 및 찜하기 상태 확인
    useEffect(() => {
        const loadMentor = async () => {
            try {
                setLoading(true);
                const mentorData = await mentorService.getMentorById(mentorId);
                setMentor(mentorData);
                setError(null);
                
                // 로그인한 사용자의 찜하기 상태 확인
                if (user || session) {
                    const currentUser = session?.user || user;
                    const currentUserId = communityService.generateConsistentUserId(currentUser);
                    console.log('🔍 찜하기 상태 확인:', { currentUser, currentUserId });
                    const liked = await userService.isLikedMentor(currentUserId, mentorId);
                    setIsLiked(liked);
                }
            } catch (err) {
                console.error('멘토 정보 로드 실패:', err);
                setError('멘토 정보를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        if (mentorId) {
            loadMentor();
        }
    }, [mentorId, user, session]);

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
                const reviewData = await mentorService.getMentorReviews(mentorId);
                setReviews(reviewData);
            } catch (error) {
                console.error('리뷰 로드 실패:', error);
                setReviews([]);
            }
        };

        if (mentorId) {
            loadReviews();
        }
    }, [mentorId]);

    // 멘토의 최근 활동 로드
    useEffect(() => {
        const loadRecentActivities = async () => {
            if (mentor?.userId) {
                try {
                    const activities = await userService.getMentorRecentActivity(mentor.userId, 10);
                    setRecentActivities(activities);
                } catch (error) {
                    console.error('최근 활동 로드 실패:', error);
                    setRecentActivities([]);
                }
            }
        };

        if (mentor) {
            loadRecentActivities();
        }
    }, [mentor]);

    const showSnackbar = (message) => {
        setSnackbar({ show: true, message });
    };

    // 피드백 신청 함수
    const handleFeedbackRequest = async () => {
        if (!user && !session) {
            showSnackbar("로그인이 필요합니다.");
            return;
        }

        if (!selectedService) {
            showSnackbar("서비스를 선택해주세요.");
            return;
        }

        if (!feedbackMessage.trim()) {
            showSnackbar("메시지를 입력해주세요.");
            return;
        }

        try {
            setSubmittingFeedback(true);
            
            const currentUser = session?.user || user;
            const serviceInfo = mentor.curriculum?.mentoring_types?.[selectedService];
            
            const requestData = {
                service: selectedService,
                serviceTitle: {
                    video_feedback: "영상 피드백",
                    realtime_onepoint: "실시간 원포인트 피드백",
                    realtime_private: "실시간 1:1 피드백",
                }[selectedService] || selectedService,
                message: feedbackMessage,
                price: serviceInfo?.price || 0,
                game: mentor.selectedGame
            };

            console.log('🔍 피드백 신청:', { mentorId, requestData, currentUser });
            
            await mentorService.requestFeedback(mentorId, requestData, currentUser);
            
            setShowApplyModal(false);
            setSelectedService("");
            setFeedbackMessage("");
            showSnackbar("피드백 신청이 완료되었습니다!");
        } catch (error) {
            console.error('피드백 신청 실패:', error);
            showSnackbar("피드백 신청에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const handleLike = async () => {
        if (!user && !session) {
            showSnackbar("로그인이 필요합니다.");
            return;
        }
        
        try {
            const currentUser = session?.user || user;
            const currentUserId = communityService.generateConsistentUserId(currentUser);
            console.log('🔍 찜하기 요청:', { currentUser, currentUserId, isLiked });
            
            if (isLiked) {
                await userService.removeLikedMentor(currentUserId, mentorId);
                setIsLiked(false);
                showSnackbar("찜 목록에서 제거되었어요.");
            } else {
                await userService.addLikedMentor(currentUserId, mentorId);
                setIsLiked(true);
                showSnackbar("찜 목록에 추가되었어요.");
            }
        } catch (error) {
            console.error('찜하기 요청 실패:', error);
            showSnackbar("오류가 발생했습니다. 다시 시도해주세요.");
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        showSnackbar("링크가 복사되었어요.");
    };

    // 리뷰 제출 함수
    const handleSubmitReview = async () => {
        if (!user && !session) {
            showSnackbar("로그인이 필요합니다.");
            return;
        }

        if (!rating || !reviewText.trim()) {
            showSnackbar("별점과 리뷰 내용을 모두 입력해주세요.");
            return;
        }

        setSubmittingReview(true);
        try {
            const currentUser = session?.user || user;
            const reviewData = {
                mentorId: mentorId,
                rating: rating,
                comment: reviewText.trim(),
                reviewerId: currentUser.uid || currentUser.id || currentUser.sub,
                reviewerName: currentUser.displayName || currentUser.name || currentUser.email || "익명",
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

    // 로딩 상태 처리
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">멘토 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    // 에러 상태 처리
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">
                        오류가 발생했습니다
                    </h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Link
                        href="/mentor"
                        className="text-blue-600 hover:text-blue-700"
                    >
                        멘토 목록으로 돌아가기
                    </Link>
                </div>
            </div>
        );
    }


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
                                            {(mentor.nickname || mentor.userName || mentor.name || '멘토').charAt(0)}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                                            {mentor.selectedGame === "lol" ? (
                                                <img
                                                    src="/logo-lol.svg"
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
                                                    src="/logo-valorant.svg"
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
                                                {mentor.selectedGame || 'GAME'}
                                            </span>
                                        </div>
                                    </div>
                                    <h1 className="text-xl font-bold text-gray-900 mt-4">
                                        {mentor.nickname || mentor.userName || mentor.name || '멘토'}
                                    </h1>
                                </div>

                                {/* 멘토 소개 */}
                                <div className="md:col-span-2 flex flex-col">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 mb-2">
                                            한줄 소개
                                        </h3>
                                        <p className="text-gray-700 mb-4">
                                            {mentor.oneLineIntro || '멘토 소개를 준비 중입니다.'}
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
                                                {(mentor.characterTags || []).map(
                                                    (tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                                                        >
                                                            {tag}
                                                        </span>
                                                    )
                                                )}
                                                {(!mentor.characterTags || mentor.characterTags.length === 0) && (
                                                    <span className="text-xs text-gray-500">
                                                        등록된 특징이 없습니다
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* 라인 태그 */}
                                        <div>
                                            <span className="text-sm font-medium text-gray-700 mr-3">
                                                라인
                                            </span>
                                            <div className="inline-flex flex-wrap gap-1">
                                                {(mentor.lineTags || []).map(
                                                    (tag, index) => (
                                                        <span
                                                            key={index}
                                                            className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                                                        >
                                                            {tag}
                                                        </span>
                                                    )
                                                )}
                                                {(!mentor.lineTags || mentor.lineTags.length === 0) && (
                                                    <span className="text-xs text-gray-500">
                                                        등록된 라인이 없습니다
                                                    </span>
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
                                        {renderStars(mentor.rating || 0)}
                                        <span className="ml-1 font-semibold text-gray-900">
                                            {(mentor.rating || 0).toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        평점 ({mentor.totalReviews || 0})
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold text-gray-900">
                                        {mentor.responseRate || 100}%
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        응답률
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="font-semibold text-gray-900">
                                        {mentor.totalFeedbacks || 0}
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
                                    {(mentor.experienceType || []).map(
                                        (type, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-medium"
                                            >
                                                {type}
                                            </span>
                                        )
                                    )}
                                    {(!mentor.experienceType || mentor.experienceType.length === 0) && (
                                        <span className="text-sm text-gray-500">
                                            등록된 경력 정보가 없습니다
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* 상세 경력 */}
                            <div>
                                <ul className="space-y-2">
                                    {(mentor.experienceDetails || []).map(
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
                                    {(!mentor.experienceDetails || mentor.experienceDetails.length === 0) && (
                                        <p className="text-sm text-gray-500">
                                            상세 경력 정보가 등록되지 않았습니다
                                        </p>
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
                                        mentor.curriculum?.mentoring_types?.[
                                            service.type
                                        ];
                                    if (!serviceData?.isSelected) return null;

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
                                                        {(serviceData.price || 0).toLocaleString()}
                                                        원
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        회당
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }).filter(Boolean)}
                                {(!mentor.curriculum?.mentoring_types || 
                                  Object.values(mentor.curriculum.mentoring_types).every(service => !service.isSelected)) && (
                                    <p className="text-sm text-gray-500 text-center py-4">
                                        등록된 커리큘럼이 없습니다
                                    </p>
                                )}
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
                                        {/* 리뷰 작성 버튼 */}
                                        {(user || session) && (
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => setShowReviewModal(true)}
                                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
                                                >
                                                    리뷰 작성하기
                                                </button>
                                            </div>
                                        )}

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
                                    <div className="space-y-4">
                                        {recentActivities.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                최근 활동이 없습니다
                                            </div>
                                        ) : (
                                            recentActivities.map((activity) => (
                                                <div
                                                    key={`${activity.type}_${activity.id}`}
                                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        {/* 활동 타입 아이콘 */}
                                                        <div className="flex-shrink-0 mt-1">
                                                            {activity.type === 'post' ? (
                                                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </div>
                                                            ) : (
                                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* 활동 내용 */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center space-x-2 mb-1">
                                                                <span className="text-sm font-medium text-gray-900">
                                                                    {activity.type === 'post' ? '게시글 작성' : '댓글 작성'}
                                                                </span>
                                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                                    activity.gameType === 'lol' 
                                                                        ? 'bg-blue-100 text-blue-700' 
                                                                        : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                    {activity.gameType === 'lol' ? 'LoL' : 'VALORANT'}
                                                                </span>
                                                                <span className="text-sm text-gray-500">
                                                                    {activity.createdAt.toLocaleDateString('ko-KR')}
                                                                </span>
                                                            </div>
                                                            
                                                            {activity.type === 'post' ? (
                                                                <div>
                                                                    <Link 
                                                                        href={`/${activity.gameType}/community/post/${activity.id}`}
                                                                        className="font-medium text-gray-900 hover:text-blue-600 transition-colors block mb-1"
                                                                    >
                                                                        {activity.title}
                                                                    </Link>
                                                                    <p className="text-sm text-gray-600 mb-2">
                                                                        {activity.content}
                                                                    </p>
                                                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                                        <span className="flex items-center">
                                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                                            </svg>
                                                                            {activity.likes}
                                                                        </span>
                                                                        <span className="flex items-center">
                                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                                            </svg>
                                                                            {activity.commentCount}
                                                                        </span>
                                                                        <span className="flex items-center">
                                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                            </svg>
                                                                            {activity.views}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <Link 
                                                                        href={`/${activity.gameType}/community/post/${activity.postId}`}
                                                                        className="text-sm text-gray-600 hover:text-blue-600 transition-colors block mb-1"
                                                                    >
                                                                        {activity.postTitle}에 댓글 작성
                                                                    </Link>
                                                                    <p className="text-sm text-gray-700 mb-2">
                                                                        {activity.content}
                                                                    </p>
                                                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                                        <span className="flex items-center">
                                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                                            </svg>
                                                                            {activity.likes}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
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
                                            mentor.selectedGame === "lol"
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
                                    {mentor.nickname || mentor.userName || mentor.name || '멘토'}
                                </span>
                                님의 연락처
                            </p>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-gray-900 font-mono">
                                    {mentor.contact || '연락처가 등록되지 않았습니다'}
                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                onClick={() =>
                                    navigator.clipboard.writeText(
                                        mentor.contact || ''
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
                                <select 
                                    value={selectedService}
                                    onChange={(e) => setSelectedService(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">
                                        서비스를 선택해주세요
                                    </option>
                                    {Object.entries(
                                        mentor.curriculum?.mentoring_types || {}
                                    ).map(([type, data]) => {
                                        if (!data?.isSelected) return null;
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
                                                {(data.price || 0).toLocaleString()}원)
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
                                    value={feedbackMessage}
                                    onChange={(e) => setFeedbackMessage(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
                                    placeholder="멘토에게 전달할 메시지를 입력해주세요"
                                />
                            </div>
                        </div>
                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={handleFeedbackRequest}
                                disabled={submittingFeedback}
                                className={`flex-1 ${
                                    mentor.selectedGame === "lol"
                                        ? "bg-blue-500 hover:bg-blue-600"
                                        : "bg-red-500 hover:bg-red-600"
                                } text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {submittingFeedback ? "신청 중..." : "신청하기"}
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
