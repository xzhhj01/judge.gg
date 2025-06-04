"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PostForm from "@/app/components/PostForm";

export default function CommunityEditPage({ params }) {
    const { game, id } = params;
    const router = useRouter();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                // TODO: API 호출
                // 임시 데이터
                const mockPost = {
                    title: "수정할 게시글 제목",
                    content: "수정할 게시글 내용",
                    videoUrl: "https://www.youtube.com/watch?v=example",
                    tags: {
                        champions: ["야스오"],
                        lanes: ["미드"],
                        situations: ["라인전"],
                        agents: ["제트"],
                        maps: ["바인드"],
                    },
                };
                setPost(mockPost);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching post:", error);
                router.push(`/${game}/community`);
            }
        };

        fetchPost();
    }, [game, id, router]);

    const handleSubmit = async (formData) => {
        try {
            // TODO: API 호출
            console.log("Form submitted:", formData);
            router.push(`/${game}/community/post/${id}`);
        } catch (error) {
            console.error("Error submitting form:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">로딩 중...</div>
            </div>
        );
    }

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
                        게시글 수정
                    </h1>
                    <PostForm
                        gameType={game}
                        mode="edit"
                        initialData={post}
                        onSubmit={handleSubmit}
                    />
                </div>
            </div>
        </div>
    );
}
