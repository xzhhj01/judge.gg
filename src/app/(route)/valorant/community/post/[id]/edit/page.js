"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CommunityHeader from "@/app/components/CommunityHeader";
import PostForm from "@/app/components/PostForm";

export default function ValorantCommunityEditPage() {
    const params = useParams();
    const router = useRouter();
    const postId = params.id;

    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);

    // 기존 게시글 데이터 로드
    useEffect(() => {
        const loadPostData = async () => {
            try {
                // 실제로는 API에서 데이터를 가져옴
                // const response = await fetch(`/api/posts/${postId}`);
                // const data = await response.json();

                // 더미 데이터 (실제 구현 시 API 호출로 교체)
                const dummyData = {
                    title: "제트 vs 레이즈 듀얼 상황 판단 부탁드립니다",
                    content:
                        "바인드 A사이트에서 제트로 레이즈와 듀얼을 하던 중 애매한 상황이 발생했습니다. 레이즈가 그레네이드를 던지고 피크를 했는데, 제가 대시를 사용한 타이밍이 맞았는지 궁금합니다. 그리고 이후 업드래프트로 각도를 바꾼 것이 올바른 판단이었는지도 의견 부탁드립니다.",
                    tags: {
                        champions: [],
                        lanes: [],
                        situations: ["듀얼"],
                        maps: ["바인드"],
                        agents: ["제트", "레이즈"],
                    },
                    voteOptions: ["제트가 잘했다", "레이즈가 잘했다"],
                    allowNeutral: true,
                    voteDeadline: "2024-01-22T10:30:00",
                };

                setInitialData(dummyData);
            } catch (error) {
                console.error("게시글 로드 실패:", error);
                // 에러 처리 (예: 404 페이지로 리다이렉트)
                router.push("/valorant/community");
            } finally {
                setLoading(false);
            }
        };

        if (postId) {
            loadPostData();
        }
    }, [postId, router]);

    const handleSubmit = async (formData) => {
        try {
            console.log("발로란트 게시글 수정:", { postId, ...formData });

            // 실제로는 API 호출
            // const response = await fetch(`/api/posts/${postId}`, {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // });

            // 성공 시 상세 페이지로 리다이렉트
            router.push(`/valorant/community/post/${postId}`);
        } catch (error) {
            console.error("게시글 수정 실패:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <CommunityHeader
                    gameType="valorant"
                    title="발로란트 법원"
                    description="전술적 FPS에서 발생한 분쟁을 공정하게 심판합니다"
                />
                <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">
                            게시글을 불러오는 중...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!initialData) {
        return (
            <div className="min-h-screen bg-gray-50">
                <CommunityHeader
                    gameType="valorant"
                    title="발로란트 법원"
                    description="전술적 FPS에서 발생한 분쟁을 공정하게 심판합니다"
                />
                <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-gray-600">
                            게시글을 찾을 수 없습니다.
                        </p>
                        <button
                            onClick={() => router.push("/valorant/community")}
                            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            목록으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <CommunityHeader
                gameType="valorant"
                title="발로란트 법원"
                description="전술적 FPS에서 발생한 분쟁을 공정하게 심판합니다"
            />

            <div className="mt-8">
                <PostForm
                    gameType="valorant"
                    mode="edit"
                    initialData={initialData}
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
}
