"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuth } from "@/app/utils/providers";
import CommunityHeader from "@/app/components/CommunityHeader";
import PostForm from "@/app/components/PostForm";
import communityTags from "@/data/communityTags.json";

export default function ValorantCommunityEditPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const { user: firebaseUser } = useAuth();
    const postId = params.id;

    const [initialData, setInitialData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    // 기존 게시글 데이터 로드
    useEffect(() => {
        const loadPostData = async () => {
            try {
                const response = await fetch(`/api/community/valorant/posts/${postId}`);
                
                if (!response.ok) {
                    throw new Error('게시글을 찾을 수 없습니다.');
                }
                
                const data = await response.json();
                
                if (data.success && data.post) {
                    // 로그인한 사용자인지 확인
                    const currentUser = session?.user || firebaseUser;
                    if (!currentUser) {
                        setAuthError('로그인이 필요합니다.');
                        setLoading(false);
                        return;
                    }

                    // 작성자인지 확인 (authorUid 기준)
                    const currentUserId = currentUser.uid || currentUser.id;
                    const postAuthorUid = data.post.authorUid;
                    
                    const isAuthor = postAuthorUid === currentUserId;
                    
                    if (!isAuthor) {
                        setAuthError('수정 권한이 없습니다. 본인이 작성한 글만 수정할 수 있습니다.');
                        setLoading(false);
                        return;
                    }
                    // 태그 데이터 변환 (더미 데이터와 Firebase 데이터 호환)
                    let tagsData = {
                        champions: [],
                        lanes: [],
                        situations: [],
                        maps: [],
                        agents: [],
                        roles: []
                    };

                    // 더미 데이터의 경우 tags가 배열로 되어 있음
                    if (Array.isArray(data.post.tags)) {
                        // communityTags.json 데이터를 활용한 동적 태그 분류
                        const valorantTags = communityTags.valorant;
                        
                        data.post.tags.forEach(tag => {
                            // Valorant 에이전트 태그 (이름으로 매칭)
                            const agentFound = valorantTags.agents.find(agent => agent.name === tag);
                            if (agentFound) {
                                tagsData.agents.push(tag);
                                // 에이전트와 함께 역할군도 자동 추가
                                if (!tagsData.roles.includes(agentFound.role)) {
                                    tagsData.roles.push(agentFound.role);
                                }
                            }
                            // 맵 태그
                            else if (valorantTags.maps.includes(tag)) {
                                tagsData.maps.push(tag);
                            }
                            // 상황 태그
                            else if (valorantTags.situations.includes(tag)) {
                                tagsData.situations.push(tag);
                            }
                            // 역할군 태그 (직접 역할군이 태그로 사용된 경우)
                            else if (['타격대', '감시자', '척후대', '전략가'].includes(tag)) {
                                if (!tagsData.roles.includes(tag)) {
                                    tagsData.roles.push(tag);
                                }
                            }
                            // 기타는 상황에 추가
                            else {
                                tagsData.situations.push(tag);
                            }
                        });
                    } else if (data.post.tags && typeof data.post.tags === 'object') {
                        // Firebase 데이터의 경우 객체 형태
                        tagsData = data.post.tags;
                    }

                    // API 응답 데이터를 PostForm에 맞는 형태로 변환
                    const formattedData = {
                        title: data.post.title || "",
                        content: data.post.content || "",
                        tags: tagsData,
                        videoUrl: data.post.videoUrl || "",
                        voteOptions: data.post.voteOptions || ["", ""],
                        allowNeutral: data.post.allowNeutral || false,
                        voteDeadline: data.post.voteDeadline || "",
                    };
                    
                    setInitialData(formattedData);
                } else {
                    throw new Error('게시글 데이터를 불러올 수 없습니다.');
                }
            } catch (error) {
                console.error("게시글 로드 실패:", error);
                alert(error.message || '게시글을 불러오는데 실패했습니다.');
                // 에러 처리 (예: 404 페이지로 리다이렉트)
                router.push("/valorant/community");
            } finally {
                setLoading(false);
            }
        };

        if (postId) {
            loadPostData();
        }
    }, [postId, router, session, firebaseUser]);

    // 권한 오류 처리
    if (authError) {
        return (
            <div className="min-h-screen bg-gray-50">
                <CommunityHeader
                    gameType="valorant"
                    title="발로란트 법원"
                    description="전술적 FPS에서 발생한 분쟁을 공정하게 심판합니다"
                />
                <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{authError}</p>
                        <button
                            onClick={() => router.push("/valorant/community")}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            목록으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (formData) => {
        try {
            console.log("발로란트 게시글 수정:", { postId, ...formData });

            const response = await fetch(`/api/community/valorant/posts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '게시글 수정에 실패했습니다.');
            }

            // 성공 시 상세 페이지로 리다이렉트
            router.push(`/valorant/community/post/${postId}`);
        } catch (error) {
            console.error("게시글 수정 실패:", error);
            alert(error.message || '게시글 수정에 실패했습니다.');
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
