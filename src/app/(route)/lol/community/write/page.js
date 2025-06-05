"use client";

import { useRouter } from 'next/navigation';
import CommunityHeader from "@/app/components/CommunityHeader";
import PostForm from "@/app/components/PostForm";
import { communityService } from '@/app/services/community/community.service';

export default function LoLCommunityWritePage() {
    const router = useRouter();
    
    const handleSubmit = async (formData) => {
        try {
            const response = await fetch('/api/community/lol/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '게시글 작성에 실패했습니다.');
            }

            router.push('/lol/community');
        } catch (error) {
            console.error('게시글 작성 실패:', error);
            alert(error.message || '게시글 작성에 실패했습니다.');
        }
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
