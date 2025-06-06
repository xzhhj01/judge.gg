"use client";

import { useState, useEffect } from "react";
import MyPageSidebar from "@/app/components/MyPageSidebar";
import PostCard from "@/app/components/PostCard";
import Snackbar from "@/app/components/Snackbar";
import Link from "next/link";
import { userService } from '@/app/services/user/user.service';
import { communityService } from '@/app/services/community/community.service';
import { mentorService } from '@/app/services/mentor/mentor.service';
import { db } from "@/lib/firebase/firebase.config";
import { collection, query, where, getDocs } from "firebase/firestore";
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
        all: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0, requestedFeedbacks: 0, receivedFeedbacks: 0 },
        lol: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0, requestedFeedbacks: 0, receivedFeedbacks: 0 },
        valorant: { posts: 0, commentedPosts: 0, votedPosts: 0, likedMentors: 0, requestedFeedbacks: 0, receivedFeedbacks: 0 }
    });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [postToDelete, setPostToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({
        message: "",
        type: "success",
        isVisible: false
    });

    const showSnackbar = (message, type = "success") => {
        setSnackbar({
            message,
            type,
            isVisible: true
        });
    };

    const closeSnackbar = () => {
        setSnackbar(prev => ({ ...prev, isVisible: false }));
    };

    // Redirect if not authenticated (check both NextAuth and Firebase)
    useEffect(() => {
        if (status !== 'loading' && authLoading === false) {
            if (!session && !user) {
                router.push('/login');
                return;
            }
        }
    }, [user, authLoading, session, status, router]);

    // 페이지 마운트 시 캐시된 데이터 즉시 로드
    useEffect(() => {
        const currentUser = session?.user || user;
        if (currentUser) {
            const currentUserId = communityService.generateConsistentUserId(currentUser);
            const cachedData = loadCachedUserData(currentUserId);
            if (cachedData) {
                console.log('🔍 컴포넌트 마운트 시 캐시된 데이터 로드');
                setUserInfo(cachedData);
            }
        }
    }, []); // 빈 의존성 배열로 마운트 시 한 번만 실행

    // 인증 상태가 변경될 때마다 사용자 정보를 다시 로드
    useEffect(() => {
        if ((user || session) && status !== 'loading' && authLoading === false) {
            console.log('🔍 인증 상태 확정됨, 사용자 데이터 로드 시작');
            loadUserData();
        }
    }, [user, session, status, authLoading]);

    const loadUserData = async () => {
        if (!(user || session)) return;

        // Always prioritize session.user for consistency with mentor registration
        const currentUser = session?.user || user;
        const currentUserId = communityService.generateConsistentUserId(currentUser);
        console.log('🔍 마이페이지 - 사용자 데이터 로딩 시작:', { 
            currentUserId, 
            currentUser,
            sessionUserId: session?.user?.id,
            sessionUserEmail: session?.user?.email,
            firebaseUid: user?.uid,
            firebaseEmail: user?.email
        });
        
        // 먼저 캐시된 데이터 로드 (즉시 UI 업데이트)
        const cachedData = loadCachedUserData(currentUserId);
        if (cachedData) {
            console.log('🔍 캐시된 데이터로 즉시 UI 업데이트');
            setUserInfo(cachedData);
        }
        
        try {
            // Firebase에서 최신 데이터 로드
            let info = await userService.getUserInfo(currentUserId);
            console.log('🔍 마이페이지 - Firebase에서 로드된 사용자 정보:', info);
            
            // Firebase에 데이터가 없는 경우, NextAuth 세션 정보로 생성
            if (!info && session?.user) {
                console.log('🔍 마이페이지 - Firebase 데이터 없음, 세션 정보로 생성');
                const { loginService } = await import('@/app/services/user/login.service');
                await loginService.handleUserData(session.user);
                info = await userService.getUserInfo(currentUserId);
                console.log('🔍 마이페이지 - 새로 생성된 사용자 정보:', info);
            }

            await processUserData(info, currentUser, currentUserId);
        } catch (error) {
            console.error("Error loading user data:", error);
            // 캐시된 데이터가 없는 경우에만 기본값 설정
            if (!cachedData) {
                setUserInfo({
                    nickname: currentUser.displayName || currentUser.name || currentUser.email,
                    riotIds: { lol: null, valorant: null },
                    tiers: { lol: null, valorant: null },
                    lolProfile: null,
                    valorantProfile: null,
                    isMentor: false,
                    mentorStats: { totalFeedbacks: 0, totalReviews: 0, rating: 0 },
                });
            }
        }
    };

    const loadCachedUserData = (userId) => {
        try {
            const cachedData = localStorage.getItem('userInfo_cache');
            if (cachedData) {
                const cache = JSON.parse(cachedData);
                const cacheAge = Date.now() - cache.timestamp;
                // 30분 이내의 캐시 사용 (이전 5분에서 확장)
                if (cacheAge < 30 * 60 * 1000 && cache.userId === userId) {
                    return cache.data;
                }
            }
        } catch (e) {
            console.error('캐시 데이터 로드 실패:', e);
        }
        return null;
    };

    const processUserData = async (info, currentUser, currentUserId) => {
        // 현재 캐시된 데이터 가져오기 (연동 정보 보존용)
        const cachedData = loadCachedUserData(currentUserId);
        console.log('🔍 캐시된 데이터:', cachedData);
        console.log('🔍 Firebase 데이터:', info);
        console.log('🔍 현재 사용자 정보:', {
            currentUser: currentUser,
            currentUserId: currentUserId,
            userType: currentUser?.id ? 'NextAuth' : currentUser?.uid ? 'Firebase' : 'Unknown',
            email: currentUser?.email
        });
        
        // 멘토 정보 확인 (mentors 컬렉션에서 모든 멘토 프로필 조회)
        let isMentor = false;
        let mentorStats = { totalFeedbacks: 0, totalReviews: 0, rating: 0 };
        let allMentorProfiles = [];
        try {
            // 승인/미승인 관계없이 사용자의 모든 멘토 프로필 조회 (이메일 정보도 함께 전달)
            const userEmail = currentUser?.email;
            allMentorProfiles = await mentorService.getAllMentorsByUserId(currentUserId, userEmail);
            
            console.log('🔍 멘토 프로필 조회 결과:', {
                userId: currentUserId,
                userEmail: userEmail,
                profileCount: allMentorProfiles.length,
                profiles: allMentorProfiles
            });
            
            if (allMentorProfiles.length > 0) {
                isMentor = true;
                console.log('🔍 멘토로 확인됨! 사용자의 멘토 프로필들:', allMentorProfiles.map(m => ({
                    id: m.id,
                    nickname: m.nickname,
                    isApproved: m.isApproved,
                    selectedGame: m.selectedGame
                })));
                
                // 승인된 멘토 중에서 통계 계산
                const approvedMentors = allMentorProfiles.filter(m => m.isApproved);
                if (approvedMentors.length > 0) {
                    // 가장 활발한 멘토의 통계 사용 (또는 평균값 사용 가능)
                    const bestMentor = approvedMentors.reduce((best, current) => {
                        const bestScore = (best.totalFeedbacks || 0) + (best.totalReviews || 0);
                        const currentScore = (current.totalFeedbacks || 0) + (current.totalReviews || 0);
                        return currentScore > bestScore ? current : best;
                    });
                    
                    mentorStats = {
                        totalFeedbacks: bestMentor.totalFeedbacks || 0,
                        totalReviews: bestMentor.totalReviews || 0,
                        rating: bestMentor.rating || 0,
                    };
                }
            } else {
                console.log('🔍 멘토 프로필이 없음');
            }
        } catch (error) {
            console.error('멘토 정보 조회 실패:', error);
        }
        
        // 연동 정보 결정: Firebase 우선, 없으면 캐시된 정보 사용
        const lolRiotId = info?.lolRiotId || cachedData?.riotIds?.lol || null;
        const lolVerified = info?.lolVerified || (cachedData?.riotIds?.lol ? true : false);
        const valorantRiotId = info?.valorantRiotId || cachedData?.riotIds?.valorant || null;
        const valorantVerified = info?.valorantVerified || (cachedData?.riotIds?.valorant ? true : false);
        
        console.log('🔍 결정된 연동 정보:', {
            lolRiotId, lolVerified,
            valorantRiotId, valorantVerified
        });
        
        // LoL 프로필 정보 로드 (연동된 경우)
        let lolProfile = cachedData?.lolProfile || null;
        let lolTier = cachedData?.tiers?.lol || null;
        if (lolRiotId && lolVerified) {
            try {
                const lolTierData = await userService.getLolTierInfo(currentUser);
                if (lolTierData.verified) {
                    lolProfile = {
                        summoner: lolTierData.summoner,
                        ranks: lolTierData.ranks
                    };
                    
                    // 솔로랭크 티어 정보 구성
                    if (lolTierData.ranks?.solo) {
                        const soloRank = lolTierData.ranks.solo;
                        lolTier = `${soloRank.tier} ${soloRank.rank} (${soloRank.leaguePoints}LP)`;
                    } else {
                        lolTier = "Unranked";
                    }
                }
            } catch (error) {
                console.error('LoL 티어 정보 로드 실패:', error);
            }
        }

        // 발로란트 프로필 정보 로드 (연동된 경우)
        let valorantProfile = cachedData?.valorantProfile || null;
        let valorantTier = cachedData?.tiers?.valorant || null;
        if (valorantRiotId && valorantVerified) {
            try {
                const valorantProfileData = await userService.getValorantProfile(currentUser);
                if (valorantProfileData.verified) {
                    valorantProfile = valorantProfileData.profile;
                    valorantTier = `${valorantProfileData.profile.winRate}% 승률`;
                }
            } catch (error) {
                console.error('발로란트 프로필 로드 실패:', error);
            }
        }
        
        const userInfoData = {
            nickname: info?.displayName || currentUser.displayName || currentUser.name || currentUser.email,
            riotIds: {
                lol: lolRiotId,
                valorant: valorantRiotId,
            },
            tiers: {
                lol: lolTier,
                valorant: valorantTier,
            },
            lolProfile: lolProfile,
            valorantProfile: valorantProfile,
            isMentor: isMentor,
            mentorStats: mentorStats,
        };
        
        console.log('🔍 최종 업데이트된 사용자 정보:', userInfoData);
        setUserInfo(userInfoData);
        
        // 로컬 스토리지에 캐시 저장
        try {
            localStorage.setItem('userInfo_cache', JSON.stringify({
                data: userInfoData,
                timestamp: Date.now(),
                userId: currentUserId
            }));
        } catch (e) {
            console.error('로컬 스토리지 저장 실패:', e);
        }

        // 사용자 통계 로드
        try {
            const userStats = await userService.getUserStats(currentUserId, currentUser);
            setStats(userStats);
        } catch (error) {
            console.error('통계 로드 실패:', error);
        }
        
        // 천하 멘토 로드
        try {
            const mentorsData = await userService.getUserLikedMentorsData(currentUserId);
            setLikedMentors(mentorsData);
        } catch (error) {
            console.error('천하 멘토 로드 실패:', error);
            setLikedMentors([]);
        }
        
        // 피드백 데이터 로드
        try {
            const requestedData = await userService.getUserRequestedFeedbacks(currentUserId, currentUser);
            setRequestedFeedbacks(requestedData);
            
            const receivedData = await userService.getMentorReceivedFeedbacks(currentUserId, currentUser);
            setReceivedFeedbacks(receivedData);
        } catch (error) {
            console.error('피드백 데이터 로드 실패:', error);
            setRequestedFeedbacks([]);
            setReceivedFeedbacks([]);
        }
    };



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

    // 찜한 멘토 데이터
    const [likedMentors, setLikedMentors] = useState([]);
    const [requestedFeedbacks, setRequestedFeedbacks] = useState([]);
    const [receivedFeedbacks, setReceivedFeedbacks] = useState([]);

    // 게시글 로드
    useEffect(() => {
        const loadPosts = async () => {
            setLoading(true);
            try {
                if (user || session) {
                    const currentUser = session?.user || user;
                    const currentUserId = communityService.generateConsistentUserId(currentUser);
                    
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
                        
                        // 디버깅을 위해 실제 저장된 데이터 분석
                        await userService.debugUserContent(currentUserId, 'lol');
                        await userService.debugUserContent(currentUserId, 'valorant');
                        
                        userPosts = await userService.getUserPosts(currentUserId, currentUser);
                        console.log("🔍 작성한 글 로드 완료 - 결과:", userPosts);
                    } else if (selectedMenu === 'commentedPosts') {
                        console.log("🔍 댓글 단 글 로드 시작 - userId:", currentUserId);
                        
                        // 디버깅을 위해 실제 저장된 데이터 분석
                        await userService.debugUserContent(currentUserId, 'lol');
                        await userService.debugUserContent(currentUserId, 'valorant');
                        
                        // 댓글 단 게시글 가져오기
                        const [lolCommentedPosts, valorantCommentedPosts] = await Promise.all([
                            userService.getUserCommentedPostsData(currentUserId, 'lol', currentUser),
                            userService.getUserCommentedPostsData(currentUserId, 'valorant', currentUser)
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
                            userService.getUserVotedPostsData(currentUserId, 'lol', currentUser),
                            userService.getUserVotedPostsData(currentUserId, 'valorant', currentUser)
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
                        likes: post.likes || 0,
                        totalVotes: post.totalVotes || 0,
                        voteOptions: post.voteOptions,
                        voteResults: post.voteResults,
                        allowNeutral: post.allowNeutral,
                        voteDeadline: post.voteDeadline,
                        views: post.views || 0,
                        tags: post.tags || [],
                        author: {
                            nickname: post.authorName || 'Unknown',
                            tier: post.authorTier || (userInfo?.tiers?.lol && post.gameType === 'lol' ? userInfo.tiers.lol : userInfo?.tiers?.valorant && post.gameType === 'valorant' ? userInfo.tiers.valorant : 'Unranked')
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
    const handleRiotIdSubmit = async (riotId, game, isRefresh = false) => {
        try {
            if (game === 'lol') {
                if (isRefresh) {
                    console.log("LoL 정보 새로고침 시작:", riotId);
                    // 새로고침의 경우 기존 PUUID로 최신 티어 정보 조회
                    const currentUser = session?.user || user;
                    const result = await userService.getLolTierInfo(currentUser);
                    console.log("LoL 티어 정보 새로고침 성공:", result);
                } else {
                    // 새로운 연동의 경우 Riot API 검증을 통한 연동
                    const currentUser = session?.user || user;
                    const result = await userService.verifyAndConnectLolAccount(riotId, currentUser);
                    console.log("LoL 계정 검증 및 연동 성공:", result);
                }
                
                // 성공 후 사용자 데이터 다시 로드 (processUserData를 통해 일관된 로직 사용)
                console.log('🔍 LoL 연동 성공, 사용자 데이터 다시 로드');
                await loadUserData();
                
                const message = isRefresh ? "LoL 정보가 성공적으로 새로고침되었습니다!" : "LoL 계정이 성공적으로 연동되었습니다!";
                showSnackbar(message, "success");
            } else if (game === 'valorant') {
                // 발로란트의 경우 Riot API 검증을 통한 연동
                const currentUser = session?.user || user;
                const result = await userService.verifyAndConnectValorantAccount(riotId, currentUser);
                console.log("발로란트 계정 검증 및 연동 성공:", result);
                
                // 성공 후 사용자 데이터 다시 로드 (processUserData를 통해 일관된 로직 사용)
                console.log('🔍 발로란트 연동 성공, 사용자 데이터 다시 로드');
                await loadUserData();
                
                showSnackbar("발로란트 계정이 성공적으로 연동되었습니다!", "success");
            } else {
                // 기타 게임의 경우 기존 방식 사용
                await userService.connectRiotId(riotId, game);
                console.log("Riot ID 연동 성공:", riotId, game);
                
                // 성공 후 사용자 정보 다시 로드
                if (user || session) {
                    const currentUser = session?.user || user;
                    const currentUserId = communityService.generateConsistentUserId(currentUser);
                    const info = await userService.getUserInfo(currentUserId);
                    setUserInfo({
                        nickname: info?.displayName || currentUser.displayName || currentUser.name || currentUser.email,
                        riotIds: {
                            lol: info?.lolRiotId || null,
                            valorant: info?.valorantRiotId || null,
                        },
                        tiers: {
                            lol: userInfo?.tiers?.lol || null,
                            valorant: userInfo?.tiers?.valorant || null,
                        },
                        lolProfile: userInfo?.lolProfile || null,
                        valorantProfile: userInfo?.valorantProfile || null,
                        isMentor: info?.isMentor || false,
                        mentorStats: info?.mentorInfo || {
                            totalFeedbacks: 0,
                            totalReviews: 0,
                            rating: 0,
                        },
                    });
                }
                
                showSnackbar("Riot ID가 성공적으로 연동되었습니다!", "success");
            }
            
            return true;
        } catch (error) {
            console.error("Error connecting Riot ID:", error);
            showSnackbar("Riot ID 연동에 실패했습니다: " + error.message, "error");
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

    const handleFeedbackAction = async (feedback, action) => {
        try {
            const response = await fetch(`/api/mentor/feedback/${feedback.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    action,
                    response: action === 'reject' ? '멘토가 요청을 거절했습니다.' : ''
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '요청 처리에 실패했습니다.');
            }

            const result = await response.json();
            showSnackbar(result.message, 'success');
            
            // 피드백 목록 새로고침
            await loadUserData();
        } catch (error) {
            console.error('피드백 처리 실패:', error);
            showSnackbar('요청 처리에 실패했습니다: ' + error.message, 'error');
        }
    };

    const handleFeedbackSubmit = async (feedbackText) => {
        if (!selectedFeedback) return;

        try {
            const response = await fetch(`/api/mentor/feedback/${selectedFeedback.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    action: 'submit',
                    feedbackText
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '피드백 제출에 실패했습니다.');
            }

            const result = await response.json();
            showSnackbar(result.message, 'success');
            
            // 피드백 목록 새로고침
            await loadUserData();
            
            setShowFeedbackModal(false);
            setSelectedFeedback(null);
        } catch (error) {
            console.error('피드백 제출 실패:', error);
            showSnackbar('피드백 제출에 실패했습니다: ' + error.message, 'error');
        }
    };

    // Handle post edit
    const handlePostEdit = (post) => {
        router.push(`/${post.gameType}/community/post/${post.id}/edit`);
    };

    // Handle post delete
    const handlePostDelete = (post) => {
        setPostToDelete(post);
        setShowDeleteModal(true);
    };

    // Confirm post deletion
    const confirmDelete = async () => {
        if (!postToDelete) return;
        
        try {
            const response = await fetch(`/api/community/${postToDelete.gameType}/posts/${postToDelete.id}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                // Reload posts after deletion
                const currentUser = session?.user || user;
                const currentUserId = communityService.generateConsistentUserId(currentUser);
                
                if (selectedMenu === 'posts') {
                    const userPosts = await userService.getUserPosts(currentUserId, currentUser);
                    let filteredPosts = userPosts;
                    if (selectedGame !== 'all') {
                        filteredPosts = userPosts.filter(post => post.gameType === selectedGame);
                    }
                    setPosts(filteredPosts.map(post => ({
                        id: post.id,
                        title: post.title,
                        content: post.content,
                        votes: post.likes || 0,
                        likes: post.likes || 0,
                        totalVotes: post.totalVotes || 0,
                        voteOptions: post.voteOptions,
                        voteResults: post.voteResults,
                        allowNeutral: post.allowNeutral,
                        voteDeadline: post.voteDeadline,
                        views: post.views || 0,
                        tags: post.tags || [],
                        author: {
                            nickname: post.authorName || 'Unknown',
                            tier: post.authorTier || (userInfo?.tiers?.lol && post.gameType === 'lol' ? userInfo.tiers.lol : userInfo?.tiers?.valorant && post.gameType === 'valorant' ? userInfo.tiers.valorant : 'Unranked')
                        },
                        commentCount: post.commentCount || 0,
                        createdAt: post.createdAt?.toDate() || new Date(),
                        gameType: post.gameType
                    })));
                }
                
                // 통계 다시 로드
                try {
                    const currentUser = session?.user || user;
                    const currentUserId = communityService.generateConsistentUserId(currentUser);
                    const userStats = await userService.getUserStats(currentUserId, currentUser);
                    setStats(userStats);
                    console.log('🔍 게시글 삭제 후 통계 업데이트 완료');
                } catch (error) {
                    console.error('통계 업데이트 실패:', error);
                }
                
                alert('게시글이 삭제되었습니다.');
            } else {
                alert('게시글 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('게시글 삭제 중 오류가 발생했습니다.');
        }
        
        setShowDeleteModal(false);
        setPostToDelete(null);
    };

    // Handle post share
    const handlePostShare = (post) => {
        const url = `${window.location.origin}/${post.gameType}/community/post/${post.id}`;
        
        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: `${post.title} - Judge.gg`,
                url: url
            }).catch(err => {
                console.log('Error sharing:', err);
                copyToClipboard(url);
            });
        } else {
            copyToClipboard(url);
        }
    };

    // Copy URL to clipboard
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            showSnackbar('링크가 클립보드에 복사되었습니다!', 'success');
        }).catch(err => {
            console.error('Could not copy text: ', err);
            showSnackbar('링크 복사에 실패했습니다.', 'error');
        });
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
        // 로딩 중에도 캐시된 데이터가 있으면 표시
        const currentUser = session?.user || user;
        if (currentUser) {
            const currentUserId = communityService.generateConsistentUserId(currentUser);
            const cachedData = loadCachedUserData(currentUserId);
            if (cachedData && !userInfo) {
                setUserInfo(cachedData);
            }
        }
        
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
                            user={{
                                ...userInfo,
                                // 디버깅을 위해 멘토 상태 명시적으로 로그
                                isMentor: (() => {
                                    console.log('🔍 사이드바에 전달되는 멘토 상태:', {
                                        userInfo: userInfo,
                                        isMentor: userInfo.isMentor,
                                        mentorStats: userInfo.mentorStats
                                    });
                                    return userInfo.isMentor;
                                })()
                            }}
                            stats={stats[selectedGame]}
                            selectedMenu={selectedMenu}
                            onMenuSelect={setSelectedMenu}
                            onRiotIdSubmit={(riotId, gameType, isRefresh = false) =>
                                handleRiotIdSubmit(riotId, gameType || selectedGame, isRefresh)
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
                                                    currentUser={session?.user || user}
                                                    onEdit={handlePostEdit}
                                                    onDelete={handlePostDelete}
                                                    onShare={handlePostShare}
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

                            {(selectedMenu === "requestedFeedbacks" || selectedMenu === "receivedFeedbacks") && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                        {selectedMenu === "receivedFeedbacks"
                                            ? "신청받은 피드백"
                                            : "신청한 피드백"}
                                    </h2>
                                    {selectedMenu === "receivedFeedbacks" && !userInfo?.isMentor ? (
                                        <div className="text-center py-12">
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                                <div className="text-blue-600 mb-2">
                                                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-medium text-blue-900 mb-2">
                                                    멘토 프로필이 없습니다
                                                </h3>
                                                <p className="text-blue-700 mb-4">
                                                    피드백 요청을 받으려면 먼저 멘토로 등록해주세요.
                                                </p>
                                                <Link 
                                                    href="/mentor/register"
                                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                >
                                                    멘토 등록하기
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (selectedMenu === "receivedFeedbacks"
                                        ? receivedFeedbacks
                                        : requestedFeedbacks
                                    ).length > 0 ? (selectedMenu === "receivedFeedbacks"
                                        ? receivedFeedbacks
                                        : requestedFeedbacks
                                    ).map((feedback) => (
                                        <div
                                            key={feedback.id}
                                            className="border border-gray-200 rounded-lg p-4"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-medium text-gray-900">
                                                            {selectedMenu === "receivedFeedbacks"
                                                                ? `신청자: ${feedback.userName || '익명'}`
                                                                : `멘토 ID: ${feedback.mentorId}`}
                                                        </h3>
                                                        {/* 멘토 프로필 정보 표시 (받은 피드백에서만) */}
                                                        {selectedMenu === "receivedFeedbacks" && feedback.mentorInfo && (
                                                            <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                                                {feedback.mentorInfo.nickname} ({feedback.mentorInfo.selectedGame === 'lol' ? 'LoL' : '발로란트'})
                                                                {!feedback.mentorInfo.isApproved && (
                                                                    <span className="ml-1 text-orange-600">미승인</span>
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        {feedback.serviceTitle || feedback.service}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {feedback.message}
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
                                                        {(feedback.price || 0).toLocaleString()}
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
                                                    {feedback.createdAt?.toDate ? 
                                                        feedback.createdAt.toDate().toLocaleDateString() : 
                                                        new Date(feedback.createdAt || Date.now()).toLocaleDateString()
                                                    }
                                                    {feedback.completedAt && (
                                                        <span className="ml-4">
                                                            완료일:{" "}
                                                            {feedback.completedAt?.toDate ? 
                                                                feedback.completedAt.toDate().toLocaleDateString() : 
                                                                new Date(feedback.completedAt).toLocaleDateString()
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                                {selectedMenu === "receivedFeedbacks" && (
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
                                    )) : selectedMenu === "receivedFeedbacks" && userInfo?.isMentor ? (
                                        <div className="text-center py-12">
                                            <p className="text-gray-500">
                                                아직 받은 피드백 요청이 없습니다.
                                            </p>
                                        </div>
                                    ) : selectedMenu === "requestedFeedbacks" ? (
                                        <div className="text-center py-12">
                                            <p className="text-gray-500">
                                                아직 신청한 피드백이 없습니다.
                                            </p>
                                        </div>
                                    ) : null}
                                </div>
                            )}

                            {selectedMenu === "likedMentors" && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                        찜한 멘토
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {likedMentors
                                            .filter(
                                                (mentor) =>
                                                    selectedGame === "all" ||
                                                    mentor.selectedGame === selectedGame
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
                                                                    {(mentor.nickname || mentor.userName || mentor.name || mentor.displayName || '익명').charAt(
                                                                        0
                                                                    )}
                                                                </div>
                                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                                                    <span className="text-xs font-medium text-gray-600">
                                                                        {mentor.selectedGame ===
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
                                                                            mentor.nickname || mentor.userName || mentor.name || mentor.displayName || '익명'
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
                                                                            mentor.rating || 0
                                                                        }
                                                                    </div>
                                                                    <div>
                                                                        리뷰{" "}
                                                                        {
                                                                            mentor.totalReviews || 0
                                                                        }
                                                                        개
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {[
                                                                        ...(mentor.characterTags || []),
                                                                        ...(mentor.lineTags || []),
                                                                        ...(mentor.championTags || []),
                                                                        ...(mentor.experienceType || [])
                                                                    ].slice(0, 3).map(
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
                                    {likedMentors.filter(mentor => selectedGame === "all" || mentor.selectedGame === selectedGame).length === 0 && (
                                        <div className="text-center py-12">
                                            <p className="text-gray-500">
                                                아직 찜한 멘토가 없습니다.
                                            </p>
                                        </div>
                                    )}
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

                {/* 게시글 삭제 확인 모달 */}
                {showDeleteModal && postToDelete && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    게시글 삭제
                                </h3>
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setPostToDelete(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            
                            <div className="mb-6">
                                <p className="text-gray-700 mb-2">
                                    정말로 이 게시글을 삭제하시겠습니까?
                                </p>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="font-medium text-gray-900 text-sm">
                                        {postToDelete.title}
                                    </p>
                                </div>
                                <p className="text-red-600 text-sm mt-2">
                                    이 작업은 되돌릴 수 없습니다.
                                </p>
                            </div>
                            
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setPostToDelete(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                                >
                                    취소
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                                >
                                    삭제하기
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                <Snackbar
                    message={snackbar.message}
                    type={snackbar.type}
                    isVisible={snackbar.isVisible}
                    onClose={closeSnackbar}
                />
            </div>
        </div>
    );
}
