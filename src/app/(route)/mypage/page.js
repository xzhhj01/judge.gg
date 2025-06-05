"use client";

import { useState, useEffect } from "react";
import MyPageSidebar from "@/app/components/MyPageSidebar";
import PostCard from "@/app/components/PostCard";
import Link from "next/link";
import { userService } from '@/app/services/user/user.service';
import { useAuth } from '@/app/utils/providers';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function MyPage() {
    const { user, loading: authLoading } = useAuth();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [selectedMenu, setSelectedMenu] = useState("posts");
    const [selectedGame, setSelectedGame] = useState("all");
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("profile");
    const [userType, setUserType] = useState("user");
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [stats, setStats] = useState({
        all: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0 },
        lol: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0 },
        valorant: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0 }
    });

    // Redirect if not authenticated (check both NextAuth and Firebase)
    useEffect(() => {
        if (status !== 'loading' && authLoading === false) {
            if (!session && !user) {
                router.push('/login');
                return;
            }
        }
    }, [user, authLoading, session, status, router]);

    // Load user info and stats
    useEffect(() => {
        const loadUserData = async () => {
            if (user || session) {
                const currentUser = user || session?.user;
                const currentUserId = currentUser?.uid || currentUser?.id || currentUser?.email;
                try {
                    // 사용자 정보 로드
                    const info = await userService.getUserInfo(currentUserId);
                    setUserInfo({
                        nickname: info?.displayName || currentUser.displayName || currentUser.name || currentUser.email,
                        riotIds: {
                            lol: info?.lolRiotId || null,
                            valorant: info?.valorantRiotId || null,
                        },
                        tiers: {
                            lol: null,
                            valorant: null,
                        },
                        isMentor: info?.isMentor || false,
                        mentorStats: info?.mentorInfo || {
                            totalFeedbacks: 0,
                            totalReviews: 0,
                            rating: 0,
                        },
                    });

                    // 사용자 통계 로드
                    const userStats = await userService.getUserStats(currentUserId);
                    setStats(userStats);
                } catch (error) {
                    console.error("Error loading user data:", error);
                    setUserInfo({
                        nickname: currentUser.displayName || currentUser.name || currentUser.email,
                        riotIds: { lol: null, valorant: null },
                        tiers: { lol: null, valorant: null },
                        isMentor: false,
                        mentorStats: { totalFeedbacks: 0, totalReviews: 0, rating: 0 },
                    });
                }
            }
        };

        loadUserData();
    }, [user, session]);

    // 임시 게시글 데이터
    const mockPosts = {
        posts: [
            {
                id: 1,
                title: "야스오 vs 제드 라인전 상황 판단 부탁드립니다",
                votes: 45,
                views: 156,
                tags: ["미드", "라인전", "야스오", "제드"],
                author: { nickname: "사용자123", tier: "Gold" },
                commentCount: 12,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
                gameType: "lol",
            },
            {
                id: 2,
                title: "제트 vs 레이즈 듀얼 상황 판단 부탁드립니다",
                votes: 38,
                views: 203,
                tags: ["듀얼", "제트", "레이즈"],
                author: { nickname: "사용자123", tier: "Diamond" },
                commentCount: 15,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
                gameType: "valorant",
            },
        ],
        commentedPosts: [
            {
                id: 3,
                title: "정글 갱킹 타이밍 질문드립니다",
                votes: 32,
                views: 128,
                tags: ["정글", "갱킹", "타이밍"],
                author: { nickname: "정글러123", tier: "Platinum" },
                commentCount: 8,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
                gameType: "lol",
            },
        ],
        votedPosts: [
            {
                id: 4,
                title: "스파이크 설치 후 포지셔닝 문의",
                votes: 56,
                views: 245,
                tags: ["포지셔닝", "스파이크", "수비"],
                author: { nickname: "발로장인", tier: "Immortal" },
                commentCount: 18,
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
                gameType: "valorant",
            },
        ],
    };

    // 임시 피드백 데이터
    const mockFeedbacks = {
        requested: [
            {
                id: 1,
                mentorName: "프로게이머김철수",
                service: "영상 피드백",
                status: "pending",
                requestedAt: "2024-03-21",
                price: 30000,
                game: "lol",
                userMessage:
                    "정글링 루트가 고민이에요. 영상 보고 피드백 부탁드립니다!",
                videoUrl: "https://youtu.be/example1",
                feedback: null,
            },
            {
                id: 2,
                mentorName: "발로마스터",
                service: "실시간 원포인트 피드백",
                status: "completed",
                requestedAt: "2024-03-19",
                completedAt: "2024-03-20",
                price: 20000,
                game: "valorant",
                userMessage: "에임 트레이닝 방법이 궁금합니다.",
                feedback:
                    "1. 에임랩에서 Gridshot 먼저 5분 연습\n2. DM 모드에서 가디언으로 10분 연습\n3. 레인지에서 봇 제거 미디엄 모드 30발 맞추기",
            },
        ],
        received: [
            {
                id: 1,
                userName: "실버탈출가능?",
                service: "영상 피드백",
                status: "pending",
                requestedAt: "2024-03-21",
                price: 30000,
                game: "lol",
                userMessage:
                    "정글링 루트가 고민이에요. 영상 보고 피드백 부탁드립니다!",
                videoUrl: "https://youtu.be/example1",
                feedback: null,
            },
            {
                id: 2,
                userName: "에임못하는사람",
                service: "실시간 원포인트 피드백",
                status: "accepted",
                requestedAt: "2024-03-19",
                acceptedAt: "2024-03-20",
                price: 20000,
                game: "valorant",
                userMessage: "에임 트레이닝 방법이 궁금합니다.",
                feedback: null,
            },
        ],
    };

    // 임시 찜한 멘토 데이터
    const mockLikedMentors = [
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
    ];

    // 게시글 로드
    useEffect(() => {
        const loadPosts = async () => {
            setLoading(true);
            try {
                if (user || session) {
                    const currentUser = user || session?.user;
                    const currentUserId = currentUser?.uid || currentUser?.id || currentUser?.email;
                    
                    console.log("🔍 마이페이지 - 현재 사용자 정보:", {
                        user: user ? 'Firebase user 존재' : 'Firebase user 없음',
                        session: session ? 'NextAuth session 존재' : 'NextAuth session 없음',
                        currentUser,
                        currentUserId,
                        selectedMenu,
                        userUid: user?.uid,
                        sessionUserId: session?.user?.id,
                        sessionUserEmail: session?.user?.email
                    });
                    let userPosts = [];
                    
                    if (selectedMenu === 'posts') {
                        console.log("🔍 작성한 글 로드 시작 - userId:", currentUserId);
                        userPosts = await userService.getUserPosts(currentUserId);
                        console.log("🔍 작성한 글 로드 완료 - 결과:", userPosts);
                    } else if (selectedMenu === 'commentedPosts') {
                        // 댓글 단 게시글 가져오기
                        const [lolCommentedPosts, valorantCommentedPosts] = await Promise.all([
                            userService.getUserCommentedPostsData(currentUserId, 'lol'),
                            userService.getUserCommentedPostsData(currentUserId, 'valorant')
                        ]);
                        userPosts = [...lolCommentedPosts, ...valorantCommentedPosts];
                        
                        // 최신순으로 재정렬
                        userPosts.sort((a, b) => {
                            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                            return dateB - dateA;
                        });
                    } else if (selectedMenu === 'votedPosts') {
                        // 좋아요/투표한 게시글 가져오기
                        const [lolVotedPosts, valorantVotedPosts] = await Promise.all([
                            userService.getUserVotedPostsData(currentUserId, 'lol'),
                            userService.getUserVotedPostsData(currentUserId, 'valorant')
                        ]);
                        userPosts = [...lolVotedPosts, ...valorantVotedPosts];
                        
                        // 최신순으로 재정렬
                        userPosts.sort((a, b) => {
                            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
                            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
                            return dateB - dateA;
                        });
                    } else {
                        // 다른 메뉴에 대해서는 목업 데이터 사용 (추후 구현)
                        setPosts(mockPosts[selectedMenu] || []);
                        setLoading(false);
                        return;
                    }
                    
                    // 게임 필터 적용
                    if (selectedGame !== 'all') {
                        userPosts = userPosts.filter(post => post.gameType === selectedGame);
                    }
                    
                    // PostCard 형식으로 변환
                    setPosts(userPosts.map(post => ({
                        id: post.id,
                        title: post.title,
                        content: post.content,
                        votes: post.likes || 0,
                        views: post.views || 0,
                        tags: post.tags || [],
                        author: {
                            nickname: post.authorName || 'Unknown',
                            tier: 'Unranked'
                        },
                        commentCount: post.commentCount || 0,
                        createdAt: post.createdAt?.toDate() || new Date(),
                        gameType: post.gameType
                    })));
                } else {
                    setPosts([]);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error loading posts:", error);
                setPosts([]);
                setLoading(false);
            }
        };

        if (user || session) {
            loadPosts();
        }
    }, [selectedMenu, selectedGame, user, session]);

    // Riot ID 연동 처리
    const handleRiotIdSubmit = async (riotId, game) => {
        try {
            await userService.connectRiotId(riotId, game);
            console.log("Riot ID 연동 성공:", riotId, game);
            
            // 성공 후 사용자 정보 다시 로드
            if (user || session) {
                const currentUser = user || session.user;
                const currentUserId = currentUser.uid || currentUser.id;
                const info = await userService.getUserInfo(currentUserId);
                setUserInfo({
                    nickname: info?.displayName || currentUser.displayName || currentUser.name || currentUser.email,
                    riotIds: {
                        lol: info?.lolRiotId || null,
                        valorant: info?.valorantRiotId || null,
                    },
                    tiers: {
                        lol: null,
                        valorant: null,
                    },
                    isMentor: info?.isMentor || false,
                    mentorStats: info?.mentorInfo || {
                        totalFeedbacks: 0,
                        totalReviews: 0,
                        rating: 0,
                    },
                });
            }
            
            alert("Riot ID가 성공적으로 연동되었습니다!");
            return true;
        } catch (error) {
            console.error("Error connecting Riot ID:", error);
            alert("Riot ID 연동에 실패했습니다: " + error.message);
            return false;
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: "bg-yellow-100 text-yellow-800",
            accepted: "bg-blue-100 text-blue-800",
            completed: "bg-green-100 text-green-800",
            rejected: "bg-red-100 text-red-800",
        };

        const statusText = {
            pending: "대기중",
            accepted: "수락됨",
            completed: "완료",
            rejected: "거절됨",
        };

        return (
            <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}
            >
                {statusText[status]}
            </span>
        );
    };

    const handleFeedbackAction = (feedback, action) => {
        if (action === "accept") {
            // TODO: API 호출
            console.log("피드백 수락:", feedback.id);
        } else if (action === "reject") {
            // TODO: API 호출
            console.log("피드백 거절:", feedback.id);
        }
    };

    const handleFeedbackSubmit = (feedbackText) => {
        if (!selectedFeedback) return;

        // TODO: API 호출
        console.log("피드백 제출:", selectedFeedback.id, feedbackText);
        setShowFeedbackModal(false);
        setSelectedFeedback(null);
    };

    // 선택된 메뉴에 따른 제목 반환
    const getMenuTitle = () => {
        switch (selectedMenu) {
            case "posts":
                return "작성한 글";
            case "commentedPosts":
                return "댓글 단 글";
            case "votedPosts":
                return "투표한 글";
            case "requestedFeedbacks":
                return "신청한 피드백";
            case "receivedFeedbacks":
                return "받은 피드백";
            case "likedMentors":
                return "찜한 멘토";
            default:
                return "활동 내역";
        }
    };

    if (authLoading || status === 'loading') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">로딩 중...</p>
                </div>
            </div>
        );
    }

    if (!user && !session) {
        return null; // Will redirect to login
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    {/* 사이드바 */}
                    {userInfo && (
                        <MyPageSidebar
                            user={userInfo}
                            stats={stats[selectedGame]}
                            selectedMenu={selectedMenu}
                            onMenuSelect={setSelectedMenu}
                            onRiotIdSubmit={(riotId) =>
                                handleRiotIdSubmit(riotId, selectedGame)
                            }
                            selectedGame={selectedGame}
                            onGameSelect={setSelectedGame}
                            riotId={userInfo?.riotIds[selectedGame]}
                        />
                    )}

                    {/* 메인 컨텐츠 */}
                    <div className="flex-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            {/* 게임 필터 */}
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold">
                                    {getMenuTitle()}
                                </h2>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setSelectedGame("all")}
                                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                            selectedGame === "all"
                                                ? "bg-gray-900 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                    >
                                        🎮 전체
                                    </button>
                                    <button
                                        onClick={() => setSelectedGame("lol")}
                                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                            selectedGame === "lol"
                                                ? "bg-blue-600 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                    >
                                        ⚔️ LoL
                                    </button>
                                    <button
                                        onClick={() =>
                                            setSelectedGame("valorant")
                                        }
                                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                            selectedGame === "valorant"
                                                ? "bg-red-600 text-white"
                                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                    >
                                        🎯 VALORANT
                                    </button>
                                </div>
                            </div>

                            {/* 컨텐츠 영역 */}
                            {(selectedMenu === "posts" || selectedMenu === "commentedPosts" || selectedMenu === "votedPosts") && (
                                <>
                                    {loading ? (
                                        <div className="flex justify-center items-center h-64">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                        </div>
                                    ) : posts.length > 0 ? (
                                        <div className="space-y-4">
                                            {posts.map((post) => (
                                                <PostCard
                                                    key={post.id}
                                                    post={post}
                                                    gameType={post.gameType}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <p className="text-gray-500">
                                                {selectedMenu === "posts" && "아직 작성한 글이 없습니다."}
                                                {selectedMenu === "commentedPosts" && "아직 댓글을 단 글이 없습니다."}
                                                {selectedMenu === "votedPosts" && "아직 투표한 글이 없습니다."}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {selectedMenu === "feedbacks" && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                        {userType === "mentor"
                                            ? "받은 피드백"
                                            : "피드백 내역"}
                                    </h2>
                                    {(userType === "mentor"
                                        ? mockFeedbacks.received
                                        : mockFeedbacks.requested
                                    ).map((feedback) => (
                                        <div
                                            key={feedback.id}
                                            className="border border-gray-200 rounded-lg p-4"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-medium text-gray-900">
                                                        {userType === "mentor"
                                                            ? feedback.userName
                                                            : feedback.mentorName}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {feedback.service}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {feedback.userMessage}
                                                    </p>
                                                    {!userType === "mentor" &&
                                                        feedback.feedback && (
                                                            <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                                                                <p className="text-sm text-gray-900 whitespace-pre-line">
                                                                    {
                                                                        feedback.feedback
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {feedback.price.toLocaleString()}
                                                        원
                                                    </div>
                                                    <div className="mt-1">
                                                        {getStatusBadge(
                                                            feedback.status
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="text-gray-500">
                                                    신청일:{" "}
                                                    {feedback.requestedAt}
                                                    {feedback.completedAt && (
                                                        <span className="ml-4">
                                                            완료일:{" "}
                                                            {
                                                                feedback.completedAt
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                                {userType === "mentor" && (
                                                    <div className="flex space-x-2">
                                                        {feedback.status ===
                                                        "pending" ? (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        handleFeedbackAction(
                                                                            feedback,
                                                                            "accept"
                                                                        )
                                                                    }
                                                                    className="text-blue-600 hover:text-blue-700 font-medium"
                                                                >
                                                                    수락
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleFeedbackAction(
                                                                            feedback,
                                                                            "reject"
                                                                        )
                                                                    }
                                                                    className="text-red-600 hover:text-red-700 font-medium"
                                                                >
                                                                    거절
                                                                </button>
                                                            </>
                                                        ) : (
                                                            feedback.status ===
                                                                "accepted" && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedFeedback(
                                                                            feedback
                                                                        );
                                                                        setShowFeedbackModal(
                                                                            true
                                                                        );
                                                                    }}
                                                                    className="text-primary-600 hover:text-primary-700 font-medium"
                                                                >
                                                                    답변하기
                                                                </button>
                                                            )
                                                        )}
                                                        {feedback.feedback && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedFeedback(
                                                                        feedback
                                                                    );
                                                                    setShowFeedbackModal(
                                                                        true
                                                                    );
                                                                }}
                                                                className="text-gray-600 hover:text-gray-700 font-medium"
                                                            >
                                                                답변 수정
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedMenu === "likedMentors" && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                        찜한 멘토
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {mockLikedMentors
                                            .filter(
                                                (mentor) =>
                                                    selectedGame === "all" ||
                                                    mentor.game === selectedGame
                                            )
                                            .map((mentor) => (
                                                <div
                                                    key={mentor.id}
                                                    className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-500 transition-colors"
                                                >
                                                    <Link
                                                        href={`/mentor/${mentor.id}`}
                                                        className="block"
                                                    >
                                                        <div className="flex items-start space-x-4">
                                                            {/* 프로필 이미지 */}
                                                            <div className="relative">
                                                                <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                                                    {mentor.nickname.charAt(
                                                                        0
                                                                    )}
                                                                </div>
                                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                                                    <span className="text-xs font-medium text-gray-600">
                                                                        {mentor.game ===
                                                                        "lol"
                                                                            ? "LoL"
                                                                            : "발로란트"}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* 멘토 정보 */}
                                                            <div className="flex-1">
                                                                <div className="flex items-center mb-1">
                                                                    <h3 className="font-medium text-gray-900 mr-2">
                                                                        {
                                                                            mentor.nickname
                                                                        }
                                                                    </h3>
                                                                    {mentor.isVerified && (
                                                                        <svg
                                                                            className="w-4 h-4 text-blue-500"
                                                                            fill="currentColor"
                                                                            viewBox="0 0 20 20"
                                                                        >
                                                                            <path
                                                                                fillRule="evenodd"
                                                                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                                                clipRule="evenodd"
                                                                            />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center text-sm text-gray-600 mb-2">
                                                                    <div className="flex items-center mr-3">
                                                                        <svg
                                                                            className="w-4 h-4 text-yellow-400 mr-1"
                                                                            fill="currentColor"
                                                                            viewBox="0 0 20 20"
                                                                        >
                                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                        </svg>
                                                                        {
                                                                            mentor.rating
                                                                        }
                                                                    </div>
                                                                    <div>
                                                                        리뷰{" "}
                                                                        {
                                                                            mentor.reviewCount
                                                                        }
                                                                        개
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {mentor.tags.map(
                                                                        (
                                                                            tag,
                                                                            index
                                                                        ) => (
                                                                            <span
                                                                                key={
                                                                                    index
                                                                                }
                                                                                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                                                                            >
                                                                                {
                                                                                    tag
                                                                                }
                                                                            </span>
                                                                        )
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 피드백 답변 모달 */}
                {showFeedbackModal && selectedFeedback && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    피드백 답변하기
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowFeedbackModal(false);
                                        setSelectedFeedback(null);
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
                                {/* 유저 정보 및 요청 내용 */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-medium text-gray-900">
                                                {selectedFeedback.userName}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {selectedFeedback.service}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-gray-900">
                                                {selectedFeedback.price.toLocaleString()}
                                                원
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                신청일:{" "}
                                                {selectedFeedback.requestedAt}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-700">
                                        <p className="font-medium mb-1">
                                            유저 메시지:
                                        </p>
                                        <p>{selectedFeedback.userMessage}</p>
                                    </div>
                                    {selectedFeedback.videoUrl && (
                                        <div className="mt-2">
                                            <a
                                                href={selectedFeedback.videoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-700 text-sm flex items-center"
                                            >
                                                <svg
                                                    className="w-4 h-4 mr-1"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                영상 보기
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* 피드백 입력 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        피드백 작성
                                    </label>
                                    <textarea
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[200px]"
                                        placeholder="상세한 피드백을 작성해주세요."
                                        defaultValue={
                                            selectedFeedback.feedback || ""
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => {
                                        setShowFeedbackModal(false);
                                        setSelectedFeedback(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={() =>
                                        handleFeedbackSubmit(
                                            document.querySelector("textarea")
                                                .value
                                        )
                                    }
                                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
                                >
                                    답변 완료
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
