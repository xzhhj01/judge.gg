"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CommunityHeader from "@/app/components/CommunityHeader";
import PostForm from "@/app/components/PostForm";

export default function LoLCommunityEditPage() {
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
                    title: "야스오 vs 제드 라인전 상황 판단 부탁드립니다",
                    content:
                        "미드 라인에서 야스오로 제드와 라인전을 하던 중 애매한 상황이 발생했습니다. 제드가 그림자를 사용해서 딜교환을 시도했는데, 제가 바람 장막을 사용한 타이밍이 맞았는지 궁금합니다. 그리고 이후 추가 딜교환을 시도한 것이 올바른 판단이었는지도 의견 부탁드립니다.",
                    tags: {
                        champions: ["야스오", "제드"],
                        lanes: ["미드"],
                        situations: ["라인전"],
                        maps: [],
                        agents: [],
                    },
                    voteOptions: ["야스오가 잘했다", "제드가 잘했다"],
                    allowNeutral: true,
                    voteDeadline: "2024-01-22T10:30:00",
                };

                setInitialData(dummyData);
            } catch (error) {
                console.error("게시글 로드 실패:", error);
                // 에러 처리 (예: 404 페이지로 리다이렉트)
                router.push("/lol/community");
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
            console.log("LoL 게시글 수정:", { postId, ...formData });

            // 실제로는 API 호출
            // const response = await fetch(`/api/posts/${postId}`, {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // });

            // 성공 시 상세 페이지로 리다이렉트
            router.push(`/lol/community/post/${postId}`);
        } catch (error) {
            console.error("게시글 수정 실패:", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <CommunityHeader
                    gameType="lol"
                    title="리그 오브 레전드 법원"
                    description="소환사의 협곡에서 발생한 분쟁을 공정하게 심판합니다"
                />
                <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
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
                    gameType="lol"
                    title="리그 오브 레전드 법원"
                    description="소환사의 협곡에서 발생한 분쟁을 공정하게 심판합니다"
                />
                <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-gray-600">
                            게시글을 찾을 수 없습니다.
                        </p>
                        <button
                            onClick={() => router.push("/lol/community")}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
                gameType="lol"
                title="리그 오브 레전드 법원"
                description="소환사의 협곡에서 발생한 분쟁을 공정하게 심판합니다"
            />

            <div className="mt-8">
                <PostForm
                    gameType="lol"
                    mode="edit"
                    initialData={initialData}
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
}
