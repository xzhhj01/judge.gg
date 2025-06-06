"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/utils/providers";
import CommunityHeader from "@/app/components/CommunityHeader";
import PostForm from "@/app/components/PostForm";
import { communityService } from "@/app/services/community/community.service";

export default function ValorantCommunityWritePage() {
    const router = useRouter();
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-500"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const handleSubmit = async (formData) => {
        try {
            const response = await fetch("/api/community/valorant/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || "게시글 작성에 실패했습니다."
                );
            }

            router.push("/valorant/community");
        } catch (error) {
            console.error("게시글 작성 실패:", error);
            alert(error.message || "게시글 작성에 실패했습니다.");
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#0c0032] to-[#190061] py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-white mb-8">
                    새 재판 작성
                </h1>
                <PostForm
                    gameType="valorant"
                    mode="create"
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
}
