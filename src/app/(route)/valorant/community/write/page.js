"use client";

import CommunityHeader from "@/app/components/CommunityHeader";
import PostForm from "@/app/components/PostForm";

export default function ValorantCommunityWritePage() {
    const handleSubmit = (formData) => {
        console.log("발로란트 게시글 작성:", formData);
        // 실제로는 API 호출
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Community Header */}
            <CommunityHeader
                gameType="valorant"
                title="발로란트 법원"
                description="전술적 FPS에서 발생한 분쟁을 공정하게 심판합니다"
            />

            <div className="mt-8">
                <PostForm
                    gameType="valorant"
                    mode="create"
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
}
