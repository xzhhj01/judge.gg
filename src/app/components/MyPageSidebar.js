"use client";

import { useState } from "react";
import Link from "next/link";

// 티어 배지 컴포넌트
const TierBadge = ({ tier, game }) => {
    if (!tier || tier === "Unranked") {
        return (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                Unranked
            </span>
        );
    }

    // 영어 티어명을 한국어로 변환
    const tierTranslation = {
        // LoL 티어
        'IRON': '아이언',
        'BRONZE': '브론즈', 
        'SILVER': '실버',
        'GOLD': '골드',
        'PLATINUM': '플래티넘',
        'DIAMOND': '다이아몬드',
        'MASTER': '마스터',
        'GRANDMASTER': '그랜드마스터',
        'CHALLENGER': '챌린저',
        // Valorant 티어
        'IMMORTAL': '불멸',
        'RADIANT': '레디언트',
        'ASCENDANT': '초월자'
    };

    // 게임별 티어 색상 설정
    const getTierColor = (tier, game) => {
        const tierColors = {
            lol: {
                'IRON': "text-gray-600 bg-gray-100",
                'BRONZE': "text-orange-800 bg-orange-100",
                'SILVER': "text-gray-600 bg-gray-200",
                'GOLD': "text-yellow-800 bg-yellow-100",
                'PLATINUM': "text-teal-800 bg-teal-100",
                'DIAMOND': "text-blue-800 bg-blue-100",
                'MASTER': "text-purple-800 bg-purple-100",
                'GRANDMASTER': "text-pink-800 bg-pink-100",
                'CHALLENGER': "text-red-800 bg-red-100",
            },
            valorant: {
                'IRON': "text-gray-600 bg-gray-100",
                'BRONZE': "text-orange-800 bg-orange-100",
                'SILVER': "text-gray-600 bg-gray-200",
                'GOLD': "text-yellow-800 bg-yellow-100",
                'PLATINUM': "text-teal-800 bg-teal-100",
                'DIAMOND': "text-blue-800 bg-blue-100",
                'ASCENDANT': "text-purple-800 bg-purple-100",
                'IMMORTAL': "text-pink-800 bg-pink-100",
                'RADIANT': "text-red-800 bg-red-100",
            },
        };

        // 티어 문자열에서 실제 티어명 추출 (예: "GOLD II (123LP)" -> "GOLD")
        const tierName = tier.split(' ')[0].toUpperCase();
        return tierColors[game]?.[tierName] || "text-gray-600 bg-gray-100";
    };

    // 티어 표시 텍스트 생성
    const getDisplayTier = (tier) => {
        // "GOLD II (123LP)" 형태의 문자열 파싱
        const parts = tier.split(' ');
        if (parts.length >= 2) {
            const tierName = parts[0].toUpperCase();
            const rank = parts[1];
            const lpMatch = tier.match(/\((\d+)LP\)/);
            
            const koreanTier = tierTranslation[tierName] || tierName;
            
            if (lpMatch) {
                return `${koreanTier} ${rank} (${lpMatch[1]}LP)`;
            } else {
                return `${koreanTier} ${rank}`;
            }
        } else {
            // 단일 티어명인 경우 (예: "MASTER", "CHALLENGER")
            const tierName = tier.split(' ')[0].toUpperCase();
            return tierTranslation[tierName] || tier;
        }
    };

    return (
        <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTierColor(
                tier,
                game
            )}`}
        >
            {getDisplayTier(tier)}
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
    riotId
}) {
    const [newRiotId, setNewRiotId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lolRiotId, setLolRiotId] = useState("");
    const [valorantRiotId, setValorantRiotId] = useState("");

    const handleConnectClick = async (gameType) => {
        if (gameType === "lol" && user?.riotIds?.lol) {
            // 이미 연동된 경우 Firebase에서 최신 정보 새로고침
            try {
                setIsSubmitting(true);
                // onRiotIdSubmit에 새로고침 신호를 보냄
                await onRiotIdSubmit(user.riotIds.lol, gameType, true); // 세 번째 매개변수는 새로고침 플래그
            } catch (error) {
                console.error('LoL 정보 새로고침 실패:', error);
                alert('정보 새로고침에 실패했습니다: ' + error.message);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleRiotIdSubmit = async (e, gameType) => {
        e.preventDefault();
        const riotId = gameType === "lol" ? lolRiotId : valorantRiotId;
        
        if (!riotId.includes("#")) {
            alert("Riot ID는 닉네임#태그 형식으로 입력해주세요.");
            return;
        }
        setIsSubmitting(true);
        try {
            await onRiotIdSubmit(riotId, gameType);
            // 성공 시 입력 필드 초기화
            if (gameType === "lol") {
                setLolRiotId("");
            } else {
                setValorantRiotId("");
            }
        } catch (error) {
            console.error("Riot ID 연동 실패:", error);
            alert("Riot ID 연동에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {/* 프로필 섹션 */}
            <div className="border-b border-gray-200 pb-4">
                <div className="mb-4">
                    <h3 className="font-medium text-lg mb-3">{user?.nickname || '사용자'}</h3>
                    
                    {/* 연동된 게임 정보 표시 */}
                    <div className="space-y-2">
                        {/* LoL 정보 */}
                        {user?.riotIds?.lol && (
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">⚔️ LoL</span>
                                        <span className="text-sm text-blue-700 font-medium">{user.riotIds.lol}</span>
                                    </div>
                                    <TierBadge tier={user.tiers?.lol} game="lol" />
                                </div>
                                {user.lolProfile?.summoner && (
                                    <div className="text-xs text-gray-600 mt-1">
                                        Lv.{user.lolProfile.summoner.summonerLevel}
                                        {user.lolProfile.ranks?.solo && (
                                            <span className="ml-2">
                                                {user.lolProfile.ranks.solo.wins}W {user.lolProfile.ranks.solo.losses}L
                                                ({user.lolProfile.ranks.solo.winRate}%)
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* 발로란트 정보 */}
                        {user?.riotIds?.valorant && (
                            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">🎯 VALORANT</span>
                                        <span className="text-sm text-red-700 font-medium">{user.riotIds.valorant}</span>
                                    </div>
                                    <TierBadge tier={user.tiers?.valorant} game="valorant" />
                                </div>
                                {user.valorantProfile && (
                                    <div className="text-xs text-gray-600 mt-1">
                                        최근 {user.valorantProfile.recentGames}경기
                                        {user.valorantProfile.avgKDA && user.valorantProfile.avgKDA !== 'N/A' && (
                                            <span className="ml-2">평균 KDA: {user.valorantProfile.avgKDA}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* 연동된 게임이 없는 경우 */}
                        {!user?.riotIds?.lol && !user?.riotIds?.valorant && (
                            <div className="text-sm text-gray-500 text-center py-2">
                                아직 연동된 게임이 없습니다
                            </div>
                        )}
                    </div>
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
                                {user?.riotIds?.lol ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-blue-600 font-medium">
                                            연동됨
                                        </span>
                                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400">
                                        미연동
                                    </span>
                                )}
                            </div>
                            {user?.riotIds?.lol ? (
                                <button
                                    onClick={() => handleConnectClick("lol")}
                                    className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    disabled={isSubmitting}
                                    type="button"
                                >
                                    {isSubmitting ? "처리중..." : "LoL 정보 새로고침 ↻"}
                                </button>
                            ) : (
                                <form onSubmit={(e) => handleRiotIdSubmit(e, "lol")} className="mt-2">
                                    <input
                                        type="text"
                                        value={lolRiotId}
                                        onChange={(e) => setLolRiotId(e.target.value)}
                                        placeholder="닉네임#태그"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {isSubmitting ? "연동 중..." : "LoL 계정 연동하기"}
                                    </button>
                                </form>
                            )}
                        </div>

                        {/* VALORANT Riot ID */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">
                                    <span className="mr-2">🎯</span>
                                    VALORANT
                                </span>
                                {user?.riotIds?.valorant ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-red-600 font-medium">
                                            연동됨
                                        </span>
                                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-400">
                                        미연동
                                    </span>
                                )}
                            </div>
                            {!user?.riotIds?.valorant && (
                                <form onSubmit={(e) => handleRiotIdSubmit(e, "valorant")} className="mt-2">
                                    <input
                                        type="text"
                                        value={valorantRiotId}
                                        onChange={(e) => setValorantRiotId(e.target.value)}
                                        placeholder="닉네임#태그"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-2"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {isSubmitting ? "연동 중..." : "발로란트 계정 연동하기"}
                                    </button>
                                </form>
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
                                {stats.requestedFeedbacks || 0}개
                            </span>
                        </div>
                    </button>

                    <button
                        onClick={() => onMenuSelect("receivedFeedbacks")}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedMenu === "receivedFeedbacks"
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <span>신청받은 피드백</span>
                            <span
                                className={`${
                                    selectedMenu === "receivedFeedbacks"
                                        ? "text-blue-700"
                                        : "text-gray-500"
                                }`}
                            >
                                {stats.receivedFeedbacks || 0}개
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
            {(() => {
                console.log('🔍 MyPageSidebar - 멘토 섹션 체크:', {
                    user: user,
                    isMentor: user?.isMentor,
                    mentorStats: user?.mentorStats
                });
                return user?.isMentor;
            })() && (
                <div className="py-4 border-b border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                        멘토 활동 현황
                    </h3>
                    <div className="space-y-2">
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
