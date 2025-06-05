"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    MainPostCard,
    MainPopularPostCard,
} from "@/app/components/MainPostCard";
import FixedWidthPostCard from "@/app/components/FixedWidthPostCard";
import PopularPostCard from "@/app/components/PopularPostCard";
import dummyPosts from "@/data/dummyPosts.json";

// 인기 게시물 카드 컴포넌트
const PostCard = ({ post }) => {
    return (
        <Link href={`/valorant/community/post/${post.id}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            {post.title}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {post.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-full"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col items-end text-sm text-gray-500">
                        <span className="flex items-center">
                            <span className="mr-1">⬆️</span>
                            {post.votes}
                        </span>
                        {post.voteEndTime && (
                            <span className="text-red-500 mt-1">
                                {new Date(
                                    post.voteEndTime
                                ).toLocaleDateString()}{" "}
                                마감
                            </span>
                        )}
                    </div>
                </div>
                {post.voteCounts && (
                    <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1 text-gray-600">
                            <span>{post.voteCounts.option1Text}</span>
                            <span>{post.voteCounts.option2Text}</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-red-500"
                                style={{
                                    width: `${
                                        (post.voteCounts.option1 /
                                            (post.voteCounts.option1 +
                                                post.voteCounts.option2)) *
                                        100
                                    }%`,
                                }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-sm mt-1 text-gray-500">
                            <span>{post.voteCounts.option1}표</span>
                            <span>{post.voteCounts.option2}표</span>
                        </div>
                    </div>
                )}
            </div>
        </Link>
    );
};

// 배너 데이터
const bannerData = [
    {
        id: 1,
        title: "VALORANT 법정",
        description: "여러분의 게임 판단을 공유하고 토론하세요",
        imageUrl:
            "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt81e8a3c8e7bbb140/65be265adc7e3c6a11eea3b5/VAL_Ep8_Homepage-CG-Still_4K_3440x1308.jpg",
    },
    {
        id: 2,
        title: "새로운 에피소드가 시작됐습니다",
        description: "에피소드 8의 새로운 변화에 대해 토론해보세요",
        imageUrl:
            "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt516d37c47b7caf01/65bf97cd6d23b74d63c93dd7/Patch_Notes_8_01_Header.jpg",
    },
    {
        id: 3,
        title: "새로운 요원 ISO",
        description: "ISO의 플레이 스타일에 대해 의견을 나눠보세요",
        imageUrl:
            "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt0bb2db683f703d4c/659ef80d8a4a4c6a31e5c713/ISO_KeyArt_10x10_3440x1308.jpg",
    },
];

export default function ValorantMainPage() {
    const [currentBanner, setCurrentBanner] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [slideDirection, setSlideDirection] = useState("right");
    const [popularPosts, setPopularPosts] = useState([]);
    const [controversialPosts, setControversialPosts] = useState([]);
    const [deadlinePosts, setDeadlinePosts] = useState([]);
    const [recentPosts, setRecentPosts] = useState([]);

    useEffect(() => {
        // 더미 데이터에서 Valorant 게시물만 필터링
        const valorantPosts = dummyPosts.posts.filter(
            (post) => post.gameType === "valorant"
        );
        console.log("Valorant 게시물:", valorantPosts); // 데이터 확인용 로그

        // 인기 게시물 (votes 기준 내림차순)
        const popular = [...valorantPosts]
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 3);
        setPopularPosts(popular);
        console.log("인기 게시물:", popular); // 데이터 확인용 로그

        // 분쟁 활발 게시물 (투표 비율이 비슷한 순)
        const controversial = [...valorantPosts]
            .filter((post) => post.voteCounts)
            .sort((a, b) => {
                const ratioA = Math.abs(
                    a.voteCounts.option1 /
                        (a.voteCounts.option1 + a.voteCounts.option2) -
                        0.5
                );
                const ratioB = Math.abs(
                    b.voteCounts.option1 /
                        (b.voteCounts.option1 + b.voteCounts.option2) -
                        0.5
                );
                return ratioA - ratioB;
            })
            .slice(0, 1);
        setControversialPosts(controversial);
        console.log("분쟁 활발:", controversial); // 데이터 확인용 로그

        // 마감 임박 게시물
        const deadline = [...valorantPosts]
            .filter((post) => post.voteEndTime)
            .sort((a, b) => new Date(a.voteEndTime) - new Date(b.voteEndTime))
            .slice(0, 1);
        setDeadlinePosts(deadline);
        console.log("마감 임박:", deadline); // 데이터 확인용 로그

        // 최신 게시물
        const recent = [...valorantPosts]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
        setRecentPosts(recent);
        console.log("최신 게시물:", recent); // 데이터 확인용 로그
    }, []);

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
                                    gameType="valorant"
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
                                    gameType="valorant"
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
                            href="/valorant/community?sort=popular"
                            className="text-red-600 hover:text-red-700"
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
                                    gameType="valorant"
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
                            href="/valorant/community?sort=recent"
                            className="text-red-600 hover:text-red-700"
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
                                    gameType="valorant"
                                />
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
