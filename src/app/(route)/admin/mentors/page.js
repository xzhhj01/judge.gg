"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuth } from "@/app/utils/providers";
import { mentorService } from "@/app/services/mentor/mentor.service";

export default function AdminMentorsPage() {
    const { data: session } = useSession();
    const { user: firebaseUser } = useAuth();
    const [pendingMentors, setPendingMentors] = useState([]);
    const [approvedMentors, setApprovedMentors] = useState([]);
    const [rejectedMentors, setRejectedMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("pending");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authError, setAuthError] = useState("");
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState("");
    const [actionLoading, setActionLoading] = useState({});
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [rejectReason, setRejectReason] = useState("");

    useEffect(() => {
        // 로그인 상태 확인
        const currentUser = session?.user || firebaseUser;

        if (currentUser) {
            // 로그인한 사용자라면 비밀번호 입력 모달 표시
            setShowPasswordModal(true);
            setLoading(false);
        } else {
            setAuthError("로그인이 필요합니다.");
            setLoading(false);
        }
    }, [session, firebaseUser]);

    const handlePasswordSubmit = () => {
        const adminPassword = "judge2024!"; // 관리자 비밀번호

        if (password === adminPassword) {
            setIsAuthenticated(true);
            setShowPasswordModal(false);
            setPassword("");
            loadMentors();
        } else {
            setAuthError("비밀번호가 올바르지 않습니다.");
            setPassword("");
        }
    };

    const handlePasswordCancel = () => {
        setShowPasswordModal(false);
        setAuthError("관리자 인증이 필요합니다.");
        setPassword("");
    };

    const loadMentors = async () => {
        try {
            setLoading(true);
            const [pending, approved, rejected] = await Promise.all([
                mentorService.getMentorsByStatus("pending"),
                mentorService.getMentorsByStatus("approved"),
                mentorService.getMentorsByStatus("rejected"),
            ]);

            setPendingMentors(pending);
            setApprovedMentors(approved);
            setRejectedMentors(rejected);
        } catch (error) {
            console.error("멘토 목록 로드 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (mentorId, action, reason = "") => {
        try {
            setActionLoading((prev) => ({ ...prev, [mentorId]: true }));

            await mentorService.updateMentorStatus(mentorId, action, reason);
            await loadMentors(); // 목록 새로고침

            // 성공 메시지
            const actionText = action === "approved" ? "승인" : "거절";
            alert(`멘토가 성공적으로 ${actionText}되었습니다.`);

            // 거절 모달 닫기
            if (showRejectModal) {
                setShowRejectModal(false);
                setSelectedMentor(null);
                setRejectReason("");
            }
        } catch (error) {
            console.error("멘토 상태 업데이트 실패:", error);
            alert(`상태 업데이트에 실패했습니다: ${error.message}`);
        } finally {
            setActionLoading((prev) => ({ ...prev, [mentorId]: false }));
        }
    };

    const handleRejectClick = (mentor) => {
        setSelectedMentor(mentor);
        setShowRejectModal(true);
    };

    const handleRejectSubmit = () => {
        if (!rejectReason.trim()) {
            alert("거절 사유를 입력해주세요.");
            return;
        }

        if (selectedMentor) {
            handleApproval(selectedMentor.id, "rejected", rejectReason);
        }
    };

    const handleRejectCancel = () => {
        setShowRejectModal(false);
        setSelectedMentor(null);
        setRejectReason("");
    };

    const MentorCard = ({ mentor, showActions = true }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {mentor.nickname}
                        </h3>
                        <span
                            className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                mentor.selectedGame === "lol"
                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                        >
                            {mentor.selectedGame === "lol" ? "LoL" : "Valorant"}
                        </span>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {mentor.oneLineIntro}
                    </p>

                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {mentor.detailedIntro}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* 사용자 정보 */}
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                사용자 정보
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                이메일: {mentor.userEmail}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                이름: {mentor.userName || "미제공"}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                신청일:{" "}
                                {mentor.appliedAt
                                    ?.toDate?.()
                                    ?.toLocaleDateString() || "날짜 정보 없음"}
                            </p>
                        </div>

                        {/* 프로필 이미지 */}
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                프로필 이미지
                            </h4>
                            {mentor.profileImageUrl ? (
                                <img
                                    src={mentor.profileImageUrl}
                                    alt="프로필 이미지"
                                    className="w-20 h-20 object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        이미지 없음
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 계정 정보 */}
                    {mentor.accounts && mentor.accounts.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                게임 계정
                            </h4>
                            <div className="space-y-2">
                                {mentor.accounts.map((account, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center space-x-2"
                                    >
                                        <span className="text-sm text-gray-600 dark:text-gray-300">
                                            {account.name}
                                        </span>
                                        {account.screenshotUrl && (
                                            <a
                                                href={account.screenshotUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                            >
                                                스크린샷 보기
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 서비스 정보 */}
                    {mentor.services && mentor.services.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                                제공 서비스
                            </h4>
                            <div className="space-y-1">
                                {mentor.services.map((service, index) => (
                                    <div
                                        key={index}
                                        className="text-sm text-gray-600 dark:text-gray-300"
                                    >
                                        {service.type}:{" "}
                                        {service.price?.toLocaleString()}원
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 거절 사유 (거절된 경우) */}
                    {mentor.rejectionReason && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
                                거절 사유
                            </h4>
                            <p className="text-sm text-red-600 dark:text-red-300">
                                {mentor.rejectionReason}
                            </p>
                        </div>
                    )}
                </div>

                {/* 액션 버튼 */}
                {showActions &&
                    !mentor.isApproved &&
                    !mentor.rejectionReason && (
                        <div className="ml-4 flex flex-col space-y-2">
                            <button
                                onClick={() => {
                                    if (
                                        window.confirm(
                                            "이 멘토를 승인하시겠습니까?"
                                        )
                                    ) {
                                        handleApproval(mentor.id, "approved");
                                    }
                                }}
                                disabled={actionLoading[mentor.id]}
                                className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${
                                    actionLoading[mentor.id]
                                        ? "cursor-wait"
                                        : ""
                                }`}
                            >
                                {actionLoading[mentor.id] ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        처리중...
                                    </>
                                ) : (
                                    "승인"
                                )}
                            </button>
                            <button
                                onClick={() => handleRejectClick(mentor)}
                                disabled={actionLoading[mentor.id]}
                                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                    actionLoading[mentor.id]
                                        ? "cursor-wait"
                                        : ""
                                }`}
                            >
                                거절
                            </button>
                        </div>
                    )}
            </div>
        </div>
    );

    // 인증되지 않은 경우 오류 화면
    if (!isAuthenticated && !showPasswordModal) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            접근 권한 없음
                        </h1>
                        <p className="text-red-600 dark:text-red-400 mb-6">
                            {authError}
                        </p>
                        <button
                            onClick={() => window.history.back()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            돌아가기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">
                        멘토 목록을 불러오는 중...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            멘토 관리
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            멘토 신청을 검토하고 승인/거절할 수 있습니다.
                        </p>
                    </div>
                    <button
                        onClick={() => window.history.back()}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        돌아가기
                    </button>
                </div>

                {/* 탭 네비게이션 */}
                <div className="mb-6">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab("pending")}
                            className={`pb-2 border-b-2 font-medium text-sm ${
                                activeTab === "pending"
                                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                        >
                            대기 중 ({pendingMentors.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("approved")}
                            className={`pb-2 border-b-2 font-medium text-sm ${
                                activeTab === "approved"
                                    ? "border-green-500 text-green-600 dark:text-green-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                        >
                            승인됨 ({approvedMentors.length})
                        </button>
                        <button
                            onClick={() => setActiveTab("rejected")}
                            className={`pb-2 border-b-2 font-medium text-sm ${
                                activeTab === "rejected"
                                    ? "border-red-500 text-red-600 dark:text-red-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                        >
                            거절됨 ({rejectedMentors.length})
                        </button>
                    </nav>
                </div>

                {/* 멘토 목록 */}
                <div>
                    {activeTab === "pending" && (
                        <div>
                            {pendingMentors.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        대기 중인 멘토 신청이 없습니다.
                                    </p>
                                </div>
                            ) : (
                                pendingMentors.map((mentor) => (
                                    <MentorCard
                                        key={mentor.id}
                                        mentor={mentor}
                                        showActions={true}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === "approved" && (
                        <div>
                            {approvedMentors.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        승인된 멘토가 없습니다.
                                    </p>
                                </div>
                            ) : (
                                approvedMentors.map((mentor) => (
                                    <MentorCard
                                        key={mentor.id}
                                        mentor={mentor}
                                        showActions={false}
                                    />
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === "rejected" && (
                        <div>
                            {rejectedMentors.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 dark:text-gray-400">
                                        거절된 멘토가 없습니다.
                                    </p>
                                </div>
                            ) : (
                                rejectedMentors.map((mentor) => (
                                    <MentorCard
                                        key={mentor.id}
                                        mentor={mentor}
                                        showActions={false}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 거절 사유 입력 모달 */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            멘토 신청 거절
                        </h3>

                        {selectedMentor && (
                            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    <span className="font-medium">
                                        {selectedMentor.nickname}
                                    </span>
                                    님의 멘토 신청을 거절하시겠습니까?
                                </p>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                거절 사유{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) =>
                                    setRejectReason(e.target.value)
                                }
                                placeholder="거절 사유를 상세히 입력해주세요. 이 내용은 신청자에게 전달됩니다."
                                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                                maxLength={500}
                            />
                            <div className="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {rejectReason.length}/500
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleRejectCancel}
                                disabled={actionLoading[selectedMentor?.id]}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                disabled={
                                    !rejectReason.trim() ||
                                    actionLoading[selectedMentor?.id]
                                }
                                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                                    actionLoading[selectedMentor?.id]
                                        ? "cursor-wait"
                                        : ""
                                }`}
                            >
                                {actionLoading[selectedMentor?.id] ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        처리중...
                                    </>
                                ) : (
                                    "거절하기"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 관리자 비밀번호 입력 모달 */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            관리자 인증
                        </h3>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                관리자 페이지에 접근하려면 비밀번호를
                                입력해주세요.
                            </p>

                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                관리자 비밀번호
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={(e) =>
                                    e.key === "Enter" && handlePasswordSubmit()
                                }
                                placeholder="비밀번호를 입력하세요"
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                autoFocus
                            />
                            {authError && (
                                <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                                    {authError}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handlePasswordCancel}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handlePasswordSubmit}
                                disabled={!password.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
