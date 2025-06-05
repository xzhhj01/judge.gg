"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    MainPostCard,
    MainPopularPostCard,
} from "@/app/components/MainPostCard";
import FixedWidthPostCard from "@/app/components/FixedWidthPostCard";
import PopularPostCard from "@/app/components/PopularPostCard";
import { useAuth } from "@/app/utils/providers";
import { useSession } from "next-auth/react";
import { communityService } from "@/app/services/community/community.service";

// 배너 데이터
const bannerData = [
    {
        id: 1,
        title: "League of Legends 법정",
        description: "여러분의 게임 판단을 공유하고 토론하세요",
        imageUrl:
            "https://images.contentstack.io/v3/assets/blt731acb42bb3d1659/blt8979808c7798ecf8/65c54b97bd5a9714f3bc7928/2024_Season_Start_Article_Banner.jpg",
    },
    {
        id: 2,
        title: "새로운 시즌이 시작됐습니다",
        description: "시즌 14의 새로운 변화에 대해 토론해보세요",
        imageUrl:
            "https://images.contentstack.io/v3/assets/blt731acb42bb3d1659/blt40e25de64f6f5a83/65b2f4581efb944d51d6e682/01162024_Patch_14_2_Notes_Banner.jpg",
    },
    {
        id: 3,
        title: "새로운 챔피언 스마이트",
        description: "스마이트의 플레이 스타일에 대해 의견을 나눠보세요",
        imageUrl:
            "https://images.contentstack.io/v3/assets/blt731acb42bb3d1659/blt262ed0d511afcd11/65aa5d4f431fa67880b2891b/011024_Smolder_Abilities_Preview_Banner.jpg",
    },
];

export default function LoLMainPage() {
    const [currentBanner, setCurrentBanner] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [slideDirection, setSlideDirection] = useState("right");
    const [popularPosts, setPopularPosts] = useState([]);
    const [controversialPosts, setControversialPosts] = useState([]);
    const [deadlinePosts, setDeadlinePosts] = useState([]);
    const [recentPosts, setRecentPosts] = useState([]);
    const [userPosts, setUserPosts] = useState([]);
    const [allUserPosts, setAllUserPosts] = useState([]);
    const { user } = useAuth();
    const { data: session } = useSession();

    useEffect(() => {
        const loadPosts = async () => {
            try {
                // Firebase에서 실제 게시물 조회
                const popularResult = await communityService.getPosts('lol', [], '', 1, 10, 'popular');
                const recentResult = await communityService.getPosts('lol', [], '', 1, 10, 'recent');
                
                // 인기 게시물 (가중치 기반 정렬)
                const popular = communityService.sortPosts(popularResult.posts, 'popular').slice(0, 3);
                setPopularPosts(popular);

                // 최신 게시물 (최신순 정렬)
                const recent = communityService.sortPosts(recentResult.posts, 'recent').slice(0, 3);
                setRecentPosts(recent);

                // 분쟁 활발 게시물 조회
                const controversial = await communityService.getControversialPosts('lol', 1);
                setControversialPosts(controversial);

                // 마감 임박 게시물은 빈 상태로 설정 (투표 기능 구현 후 추가 예정)
                setDeadlinePosts([]);

                console.log("인기 게시물:", popular);
                console.log("최신 게시물:", recent);
            } catch (error) {
                console.error('게시물 로드 실패:', error);
                // 에러 발생 시 빈 배열로 설정
                setPopularPosts([]);
                setRecentPosts([]);
                setControversialPosts([]);
                setDeadlinePosts([]);
            }
        };

        loadPosts();
    }, []);

    // 사용자 게시물 로드
    useEffect(() => {
        const loadUserPosts = async () => {
            if ((user && user.uid) || (session && session.user)) {
                const currentUserId = user?.uid || session?.user?.id;
                try {
                    const result = await communityService.getUserPosts('lol', currentUserId, 3);
                    setUserPosts(result.posts);
                    
                    // 모든 게임의 사용자 게시물도 로드
                    const allResult = await communityService.getAllUserPosts(currentUserId, 5);
                    setAllUserPosts(allResult.posts);
                    
                    console.log("사용자 게시물:", result.posts);
                    console.log("전체 사용자 게시물:", allResult.posts);
                } catch (error) {
                    console.error("사용자 게시물 로드 실패:", error);
                    // 에러 발생 시 빈 배열로 설정하여 UI 오류 방지
                    setUserPosts([]);
                    setAllUserPosts([]);
                }
            } else {
                // 사용자가 로그인하지 않은 경우 빈 배열로 설정
                setUserPosts([]);
                setAllUserPosts([]);
            }
        };

        loadUserPosts();
    }, [user, session]);

    const handleBannerChange = (index) => {
        if (index > currentBanner) {
            setSlideDirection("right");
        } else {
            setSlideDirection("left");
        }
        setCurrentBanner(index);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 히어로 섹션 */}
            <div className="relative h-[280px] overflow-hidden">
                {/* 현재 배너 */}
                <div
                    className="absolute inset-0 w-full h-full transition-transform duration-500 ease-in-out"
                    style={{
                        transform: `translateX(0%)`,
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${bannerData[currentBanner].imageUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                    }}
                >
                    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
                        <div className="text-white max-w-2xl">
                            <h1 className="text-3xl font-bold mb-2">
                                {bannerData[currentBanner].title}
                            </h1>
                            <p className="text-lg">
                                {bannerData[currentBanner].description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 다음/이전 배너 (transition 중에만 보임) */}
                <div
                    className="absolute inset-0 w-full h-full transition-transform duration-500 ease-in-out"
                    style={{
                        transform: `translateX(${
                            slideDirection === "right" ? "100%" : "-100%"
                        })`,
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${
                            bannerData[
                                (currentBanner +
                                    (slideDirection === "right" ? 1 : -1) +
                                    bannerData.length) %
                                    bannerData.length
                            ].imageUrl
                        })`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                    }}
                />

                {/* 배너 인디케이터 */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
                    {bannerData.map((_, index) => (
                        <button
                            key={index}
                            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                currentBanner === index
                                    ? "bg-white w-4"
                                    : "bg-white/50"
                            }`}
                            onClick={() => handleBannerChange(index)}
                        />
                    ))}
                </div>

                {/* 이전/다음 버튼 */}
                <button
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-10"
                    onClick={() => {
                        setSlideDirection("left");
                        setCurrentBanner(
                            (prev) =>
                                (prev - 1 + bannerData.length) %
                                bannerData.length
                        );
                    }}
                >
                    ←
                </button>
                <button
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full z-10"
                    onClick={() => {
                        setSlideDirection("right");
                        setCurrentBanner(
                            (prev) => (prev + 1) % bannerData.length
                        );
                    }}
                >
                    →
                </button>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 분쟁 활발 & 마감 임박 row */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {/* 분쟁 활발 섹션 */}
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                🔥 분쟁 활발
                            </h2>
                        </div>
                        <div>
                            {controversialPosts.map((post) => (
                                <MainPostCard
                                    key={post.id}
                                    post={post}
                                    gameType="lol"
                                />
                            ))}
                        </div>
                    </section>

                    {/* 마감 임박 섹션 */}
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                ⏰ 마감 임박
                            </h2>
                        </div>
                        <div>
                            {deadlinePosts.map((post) => (
                                <MainPostCard
                                    key={post.id}
                                    post={post}
                                    gameType="lol"
                                />
                            ))}
                        </div>
                    </section>
                </div>

                {/* 인기 재판 섹션 */}
                <section className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            ⚖️ 인기 재판
                        </h2>
                        <Link
                            href="/lol/community?sort=popular"
                            className="text-blue-600 hover:text-blue-700"
                        >
                            더 보기 →
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="flex gap-4 pb-4">
                            {popularPosts.map((post) => (
                                <PopularPostCard
                                    key={post.id}
                                    post={post}
                                    gameType="lol"
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* 최신 재판 섹션 */}
                <section className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            📝 최신 재판
                        </h2>
                        <Link
                            href="/lol/community?sort=recent"
                            className="text-blue-600 hover:text-blue-700"
                        >
                            더 보기 →
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <div className="flex gap-4 pb-4">
                            {recentPosts.map((post) => (
                                <PopularPostCard
                                    key={post.id}
                                    post={post}
                                    gameType="lol"
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* 내가 작성한 모든 게시글 섹션 */}
                {(user || session) && allUserPosts.length > 0 && (
                    <section className="mb-12">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                ✍️ 내가 작성한 모든 게시글
                            </h2>
                            <Link
                                href="/mypage"
                                className="text-blue-600 hover:text-blue-700"
                            >
                                더 보기 →
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <div className="flex gap-4 pb-4">
                                {allUserPosts.map((post) => (
                                    <PopularPostCard
                                        key={`${post.gameType}-${post.id}`}
                                        post={post}
                                        gameType={post.gameType}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 내가 작성한 LoL 글 섹션 */}
                {(user || session) && userPosts.length > 0 && (
                    <section className="mb-12">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                ⚔️ 내가 작성한 LoL 게시글
                            </h2>
                            <Link
                                href="/lol/community?filter=my"
                                className="text-blue-600 hover:text-blue-700"
                            >
                                더 보기 →
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <div className="flex gap-4 pb-4">
                                {userPosts.map((post) => (
                                    <PopularPostCard
                                        key={post.id}
                                        post={post}
                                        gameType="lol"
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 로그인하지 않은 사용자를 위한 안내 */}
                {!user && !session && (
                    <section className="mb-12">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-8 text-center">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                나만의 재판 기록을 남겨보세요!
                            </h2>
                            <p className="text-gray-600 mb-4">
                                로그인하시면 작성한 글들을 여기서 확인할 수 있습니다.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                로그인하기
                            </Link>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
