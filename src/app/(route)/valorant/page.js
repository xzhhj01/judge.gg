export default function ValorantPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-valorant-50 to-valorant-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <div className="flex justify-center mb-8">
                        <img
                            src="/logo-valorant.svg"
                            alt="Valorant"
                            className="h-20 w-20"
                        />
                    </div>

                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        발로란트
                    </h1>

                    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                        전술적 FPS 게임에서 발생하는 모든 분쟁을 공정하게
                        해결합니다. Judge.gg와 함께 더 깨끗한 게임 환경을
                        만들어보세요.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                        {/* 법원 카드 */}
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-valorant-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg
                                        className="w-6 h-6 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16l3-1m-3 1l-3-1"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    법원
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    게임 내 분쟁을 신고하고 해결받으세요
                                </p>
                                <a
                                    href="/valorant/community"
                                    className="inline-block bg-valorant-500 text-white px-4 py-2 rounded-lg hover:bg-valorant-600 transition-colors"
                                >
                                    바로가기
                                </a>
                            </div>
                        </div>

                        {/* 에이전트 가이드 카드 */}
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-valorant-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg
                                        className="w-6 h-6 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    에이전트 가이드
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    각 에이전트별 전략과 팁을 확인하세요
                                </p>
                                <button className="inline-block bg-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed">
                                    준비중
                                </button>
                            </div>
                        </div>

                        {/* 맵 분석 카드 */}
                        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-valorant-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                                    <svg
                                        className="w-6 h-6 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    맵 분석
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    각 맵별 전략과 포지션을 분석하세요
                                </p>
                                <button className="inline-block bg-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed">
                                    준비중
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
