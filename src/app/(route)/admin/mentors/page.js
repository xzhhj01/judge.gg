"use client";

import { useState, useEffect } from "react";
import { mentorService } from "@/app/services/mentor/mentor.service";

export default function AdminMentorsPage() {
    const [pendingMentors, setPendingMentors] = useState([]);
    const [approvedMentors, setApprovedMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        loadMentors();
    }, []);

    const loadMentors = async () => {
        try {
            setLoading(true);
            const [pending, approved] = await Promise.all([
                mentorService.getMentorsByStatus('pending'),
                mentorService.getMentorsByStatus('approved')
            ]);
            
            setPendingMentors(pending);
            setApprovedMentors(approved);
        } catch (error) {
            console.error('멘토 목록 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (mentorId, action, reason = '') => {
        try {
            await mentorService.updateMentorStatus(mentorId, action, reason);
            await loadMentors(); // 목록 새로고침
            alert(`멘토가 ${action === 'approved' ? '승인' : '거절'}되었습니다.`);
        } catch (error) {
            console.error('멘토 상태 업데이트 실패:', error);
            alert('상태 업데이트에 실패했습니다.');
        }
    };

    const MentorCard = ({ mentor, showActions = true }) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-4">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {mentor.nickname}
                        </h3>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                            mentor.selectedGame === 'lol' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                            {mentor.selectedGame === 'lol' ? 'LoL' : 'Valorant'}
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
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">사용자 정보</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                이메일: {mentor.userEmail}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                이름: {mentor.userName || '미제공'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                신청일: {mentor.appliedAt?.toDate?.()?.toLocaleDateString() || '날짜 정보 없음'}
                            </p>
                        </div>

                        {/* 프로필 이미지 */}
                        <div>
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">프로필 이미지</h4>
                            {mentor.profileImageUrl ? (
                                <img 
                                    src={mentor.profileImageUrl} 
                                    alt="프로필 이미지"
                                    className="w-20 h-20 object-cover rounded-lg"
                                />
                            ) : (
                                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">이미지 없음</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 계정 정보 */}
                    {mentor.accounts && mentor.accounts.length > 0 && (
                        <div className="mb-4">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">게임 계정</h4>
                            <div className="space-y-2">
                                {mentor.accounts.map((account, index) => (
                                    <div key={index} className="flex items-center space-x-2">
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
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">제공 서비스</h4>
                            <div className="space-y-1">
                                {mentor.services.map((service, index) => (
                                    <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
                                        {service.type}: {service.price?.toLocaleString()}원
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 거절 사유 (거절된 경우) */}
                    {mentor.rejectionReason && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">거절 사유</h4>
                            <p className="text-sm text-red-600 dark:text-red-300">{mentor.rejectionReason}</p>
                        </div>
                    )}
                </div>

                {/* 액션 버튼 */}
                {showActions && mentor.approvalStatus === 'pending' && (
                    <div className="ml-4 flex flex-col space-y-2">
                        <button
                            onClick={() => handleApproval(mentor.id, 'approved')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            승인
                        </button>
                        <button
                            onClick={() => {
                                const reason = prompt('거절 사유를 입력해주세요:');
                                if (reason) {
                                    handleApproval(mentor.id, 'rejected', reason);
                                }
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            거절
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">멘토 목록을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        멘토 관리
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        멘토 신청을 검토하고 승인/거절할 수 있습니다.
                    </p>
                </div>

                {/* 탭 네비게이션 */}
                <div className="mb-6">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`pb-2 border-b-2 font-medium text-sm ${
                                activeTab === 'pending'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            대기 중 ({pendingMentors.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('approved')}
                            className={`pb-2 border-b-2 font-medium text-sm ${
                                activeTab === 'approved'
                                    ? 'border-green-500 text-green-600 dark:text-green-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        >
                            승인됨 ({approvedMentors.length})
                        </button>
                    </nav>
                </div>

                {/* 멘토 목록 */}
                <div>
                    {activeTab === 'pending' && (
                        <div>
                            {pendingMentors.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 dark:text-gray-400">대기 중인 멘토 신청이 없습니다.</p>
                                </div>
                            ) : (
                                pendingMentors.map(mentor => (
                                    <MentorCard key={mentor.id} mentor={mentor} showActions={true} />
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'approved' && (
                        <div>
                            {approvedMentors.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 dark:text-gray-400">승인된 멘토가 없습니다.</p>
                                </div>
                            ) : (
                                approvedMentors.map(mentor => (
                                    <MentorCard key={mentor.id} mentor={mentor} showActions={false} />
                                ))
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}