import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                    {/* 1열: 게임 (2칸 차지) */}
                    <div className="md:col-span-2">
                        <div className="grid grid-cols-2 gap-4">
                            {/* LoL */}
                            <div className="pr-4">
                                <h4 className="text-white text-sm font-medium mb-2 whitespace-nowrap">
                                    League of Legends
                                </h4>
                                <ul className="space-y-1.5">
                                    <li>
                                        <Link
                                            href="/lol"
                                            className="text-sm hover:text-white transition-colors"
                                        >
                                            메인
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/lol/community"
                                            className="text-sm hover:text-white transition-colors"
                                        >
                                            법원
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            {/* VALORANT */}
                            <div>
                                <h4 className="text-white text-sm font-medium mb-2">
                                    VALORANT
                                </h4>
                                <ul className="space-y-1.5">
                                    <li>
                                        <Link
                                            href="/valorant"
                                            className="text-sm hover:text-white transition-colors"
                                        >
                                            메인
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href="/valorant/community"
                                            className="text-sm hover:text-white transition-colors"
                                        >
                                            법원
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* 2열: 비워둠 (1칸) */}
                    <div className="md:col-span-1"></div>

                    {/* 3열: 수직 메뉴 (2칸) */}
                    <div className="md:col-span-2 space-y-4">
                        <Link href="/mentor" className="block">
                            <h3 className="text-white text-base font-semibold hover:text-gray-400 transition-colors">
                                멘토
                            </h3>
                        </Link>
                        <Link href="/mypage" className="block">
                            <h3 className="text-white text-base font-semibold hover:text-gray-400 transition-colors">
                                마이페이지
                            </h3>
                        </Link>
                        <Link href="/help" className="block">
                            <h3 className="text-white text-base font-semibold hover:text-gray-400 transition-colors">
                                도움말
                            </h3>
                        </Link>
                    </div>

                    {/* 4열: SNS (1칸) */}
                    <div className="md:col-span-1">
                        <h3 className="text-white text-base font-semibold mb-3">
                            SNS
                        </h3>
                        <ul className="space-y-1.5">
                            <li>
                                <a
                                    href="https://discord.gg/judge-gg"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm hover:text-white transition-colors flex items-center"
                                >
                                    <svg
                                        className="w-4 h-4 mr-2"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                                    </svg>
                                    Discord
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-800 text-center">
                    <p className="text-xs">
                        © {new Date().getFullYear()} Judge.GG. All rights
                        reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
