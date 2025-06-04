"use client";

import CommunityHeader from "@/app/components/CommunityHeader";
import PostForm from "@/app/components/PostForm";

export default function LoLCommunityWritePage() {
    const handleSubmit = (formData) => {
        console.log("LoL 게시글 작성:", formData);
        // 실제로는 API 호출
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Community Header */}
            <CommunityHeader
                gameType="lol"
                title="리그 오브 레전드 법원"
                description="소환사의 협곡에서 발생한 분쟁을 공정하게 심판합니다"
            />

            <div className="mt-8">
                <PostForm
                    gameType="lol"
                    mode="create"
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
}
