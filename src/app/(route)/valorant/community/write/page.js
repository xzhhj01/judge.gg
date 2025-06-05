"use client";

import { useRouter } from 'next/navigation';
import CommunityHeader from "@/app/components/CommunityHeader";
import PostForm from "@/app/components/PostForm";
import { communityService } from '@/app/services/community/community.service';

export default function ValorantCommunityWritePage() {
    const router = useRouter();
    
    const handleSubmit = async (formData) => {
        try {
            const response = await fetch('/api/community/valorant/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '게시글 작성에 실패했습니다.');
            }

            router.push('/valorant/community');
        } catch (error) {
            console.error('게시글 작성 실패:', error);
            alert(error.message || '게시글 작성에 실패했습니다.');
        }
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
