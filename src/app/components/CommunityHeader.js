import Link from "next/link";

export default function CommunityHeader({ gameType, title, description }) {
    const getGameColors = () => {
        if (gameType === "lol") {
            return {
                gradient: "from-lol-400 to-lol-600",
                textColor: "text-lol-100",
                logo: "/logo-lol.svg",
                alt: "LoL",
            };
        } else if (gameType === "valorant") {
            return {
                gradient: "from-valorant-400 to-valorant-600",
                textColor: "text-valorant-100",
                logo: "/logo-valorant.svg",
                alt: "Valorant",
            };
        }
        return {
            gradient: "from-gray-400 to-gray-600",
            textColor: "text-gray-100",
            logo: "/logo-default.svg",
            alt: "Game",
        };
    };

    const colors = getGameColors();

    return (
        <Link href={`/${gameType}/community`}>
            <div
                className={`relative h-32 bg-gradient-to-r ${colors.gradient} overflow-hidden cursor-pointer hover:opacity-100`}
            >
                {/* 배경 이미지 영역 */}
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-4">
                    {/* 게임 로고 아이콘 영역 */}
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg">
                            <img
                                src={colors.logo}
                                alt={colors.alt}
                                className="w-8 h-8"
                            />
                        </div>

                        {/* 설명 */}
                        <div className="text-white">
                            <h1 className="text-2xl font-bold mb-1">{title}</h1>
                            <p className={`${colors.textColor} text-sm`}>
                                {description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
