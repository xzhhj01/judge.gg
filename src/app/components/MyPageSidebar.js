"use client";

import { useState } from "react";
import Link from "next/link";

// 티어 배지 컴포넌트
const TierBadge = ({ tier, game }) => {
    if (!tier) return null;

    // 게임별 티어 색상 설정
    const getTierColor = (tier, game) => {
        const tierColors = {
            lol: {
                아이언: "text-gray-600 bg-gray-100",
                브론즈: "text-orange-800 bg-orange-100",
                실버: "text-gray-600 bg-gray-200",
                골드: "text-yellow-800 bg-yellow-100",
                플래티넘: "text-teal-800 bg-teal-100",
                다이아몬드: "text-blue-800 bg-blue-100",
                마스터: "text-purple-800 bg-purple-100",
                그랜드마스터: "text-pink-800 bg-pink-100",
                챌린저: "text-red-800 bg-red-100",
            },
            valorant: {
                아이언: "text-gray-600 bg-gray-100",
                브론즈: "text-orange-800 bg-orange-100",
                실버: "text-gray-600 bg-gray-200",
                골드: "text-yellow-800 bg-yellow-100",
                플래티넘: "text-teal-800 bg-teal-100",
                다이아몬드: "text-blue-800 bg-blue-100",
                초월자: "text-purple-800 bg-purple-100",
                불멸: "text-pink-800 bg-pink-100",
                레디언트: "text-red-800 bg-red-100",
            },
        };

        const tierName = tier.replace(/[0-9]/g, ""); // 숫자 제거
        return tierColors[game][tierName] || "text-gray-600 bg-gray-100";
    };

    return (
        <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTierColor(
                tier,
                game
            )}`}
        >
            {tier}
        </span>
    );
};

export default function MyPageSidebar({
    user,
    stats,
    selectedMenu,
    onMenuSelect,
    onRiotIdSubmit,
    selectedGame,
    onGameSelect,
    riotId,
}) {
    const [newRiotId, setNewRiotId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);

    const handleRiotIdSubmit = async (e) => {
        e.preventDefault();
        if (!newRiotId.includes("#")) {
            alert("Riot ID는 닉네임#태그 형식으로 입력해주세요.");
            return;
        }
        setIsSubmitting(true);
        try {
            await onRiotIdSubmit(newRiotId);
        } catch (error) {
            console.error("Riot ID 연동 실패:", error);
            alert("Riot ID 연동에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 계정 연동 버튼 클릭 핸들러
    const handleConnectClick = (game) => {
        onGameSelect(game); // 마이페이지 내부의 게임 선택 상태만 변경
        setShowConnectModal(true);
    };

    return (
        <div className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {/* 프로필 섹션 */}
            <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between mb-4">
                    <span className="font-medium text-lg">{user.nickname}</span>
                </div>
            </div>

            {/* Riot ID 연동 섹션 */}
            {selectedGame === "all" ? (
                <div className="py-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                        Riot ID 연동 현황
                    </h3>
                    <div className="space-y-3">
                        {/* LoL Riot ID */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                    <span className="mr-2">⚔️</span>
                                    LoL
                                </span>
                                {user.riotIds.lol ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-blue-600 font-medium">
                                            {user.riotIds.lol}
                                        </span>
                                        <TierBadge
                                            tier={user.tiers.lol}
                                            game="lol"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400">
                                        미연동
                                    </span>
                                )}
                            </div>
                            {!user.riotIds.lol && (
                                <button
                                    onClick={() => handleConnectClick("lol")}
                                    className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    LoL 계정 연동하기 →
                                </button>
                            )}
                        </div>

                        {/* VALORANT Riot ID */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                    <span className="mr-2">🎯</span>
                                    VALORANT
                                </span>
                                {user.riotIds.valorant ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-red-600 font-medium">
                                            {user.riotIds.valorant}
                                        </span>
                                        <TierBadge
                                            tier={user.tiers.valorant}
                                            game="valorant"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400">
                                        미연동
                                    </span>
                                )}
                            </div>
                            {!user.riotIds.valorant && (
                                <button
                                    onClick={() =>
                                        handleConnectClick("valorant")
                                    }
                                    className="w-full py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                                >
                                    발로란트 계정 연동하기 →
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                !riotId && (
                    <div className="py-4 border-b border-gray-200">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                            {selectedGame === "lol" ? (
                                <span>
                                    <span className="mr-2">⚔️</span>LoL Riot ID
                                    연동
                                </span>
                            ) : (
                                <span>
                                    <span className="mr-2">🎯</span>VALORANT
                                    Riot ID 연동
                                </span>
                            )}
                        </h3>
                        <form onSubmit={handleRiotIdSubmit}>
                            <input
                                type="text"
                                value={newRiotId}
                                onChange={(e) => setNewRiotId(e.target.value)}
                                placeholder="닉네임#태그"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                                    selectedGame === "lol"
                                        ? "bg-blue-500 hover:bg-blue-600"
                                        : "bg-red-500 hover:bg-red-600"
                                }`}
                            >
                                {isSubmitting
                                    ? "연동 중..."
                                    : "Riot ID 연동하기"}
                            </button>
                        </form>
                    </div>
                )
            )}

            {/* 활동 내역 섹션 */}
            <div className="py-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">
                    활동 내역
                </h3>
                <div className="space-y-1">
                    <button
                        onClick={() => onMenuSelect("posts")}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedMenu === "posts"
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span>작성한 글</span>
                            <span
                                className={`${
                                    selectedMenu === "posts"
                                        ? "text-blue-700"
                                        : "text-gray-500"
                                }`}
                            >
                                {stats.posts}개
                            </span>
                        </div>
                    </button>
                    <button
                        onClick={() => onMenuSelect("commentedPosts")}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedMenu === "commentedPosts"
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span>댓글 단 글</span>
                            <span
                                className={`${
                                    selectedMenu === "commentedPosts"
                                        ? "text-blue-700"
                                        : "text-gray-500"
                                }`}
                            >
                                {stats.commentedPosts}개
                            </span>
                        </div>
                    </button>
                    <button
                        onClick={() => onMenuSelect("votedPosts")}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedMenu === "votedPosts"
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span>투표한 글</span>
                            <span
                                className={`${
                                    selectedMenu === "votedPosts"
                                        ? "text-blue-700"
                                        : "text-gray-500"
                                }`}
                            >
                                {stats.votedPosts}개
                            </span>
                        </div>
                    </button>
                    <button
                        onClick={() => onMenuSelect("requestedFeedbacks")}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedMenu === "requestedFeedbacks"
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span>신청한 피드백</span>
                            <span
                                className={`${
                                    selectedMenu === "requestedFeedbacks"
                                        ? "text-blue-700"
                                        : "text-gray-500"
                                }`}
                            >
                                {stats.feedbacks || 0}개
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => onMenuSelect("likedMentors")}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedMenu === "likedMentors"
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span>찜한 멘토</span>
                            <span
                                className={`${
                                    selectedMenu === "likedMentors"
                                        ? "text-blue-700"
                                        : "text-gray-500"
                                }`}
                            >
                                {stats.likedMentors || 0}명
                            </span>
                        </div>
                    </button>
                </div>
            </div>

            {/* 멘토 활동 현황 섹션 */}
            {user.isMentor && (
                <div className="py-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                        멘토 활동 현황
                    </h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => onMenuSelect("receivedFeedbacks")}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                selectedMenu === "receivedFeedbacks"
                                    ? "bg-blue-50 text-blue-700 font-medium"
                                    : "text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span>받은 피드백</span>
                                <span
                                    className={`${
                                        selectedMenu === "receivedFeedbacks"
                                            ? "text-blue-700"
                                            : "text-gray-500"
                                    }`}
                                >
                                    {user.mentorStats.totalFeedbacks}개
                                </span>
                            </div>
                        </button>
                        <Link
                            href="/mentor/profile"
                            className="block w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            멘토 프로필 관리
                        </Link>
                    </div>
                </div>
            )}

            {/* 계정 설정 */}
            <div className="py-4">
                <Link
                    href="/mypage/settings"
                    className="block w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    계정 설정
                </Link>
            </div>
        </div>
    );
}
