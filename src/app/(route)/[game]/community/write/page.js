"use client";

import { useRouter } from "next/navigation";
import PostForm from "@/app/components/PostForm";

export default function CommunityWritePage({ params }) {
    const { game } = params;
    const router = useRouter();

    const handleSubmit = async (formData) => {
        try {
            // TODO: API 호출
            console.log("Form submitted:", formData);
            router.push(`/${game}/community`);
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h1
                        className={`text-2xl font-bold mb-6 ${
                            game === "valorant"
                                ? "text-valorant-600"
                                : "text-lol-600"
                        }`}
                    >
                        {game === "valorant" ? "발로란트" : "리그 오브 레전드"}{" "}
                        게시글 작성
                    </h1>
                    <PostForm
                        gameType={game}
                        mode="create"
                        onSubmit={handleSubmit}
                    />
                </div>
            </div>
        </div>
    );
}
