"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuth } from "@/app/utils/providers";
import CommunityHeader from "@/app/components/CommunityHeader";
import PostForm from "@/app/components/PostForm";
import communityTags from "@/data/communityTags.json";

export default function LoLCommunityEditPage() {
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
                const response = await fetch(`/api/community/lol/posts/${postId}`);
                
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

                    // 작성자인지 확인 (포괄적인 ID 매칭)
                    // All possible user identifiers from currentUser
                    const userIdentifiers = new Set();
                    if (currentUser.id) userIdentifiers.add(currentUser.id);
                    if (currentUser.uid) userIdentifiers.add(currentUser.uid);
                    if (currentUser.email) {
                        userIdentifiers.add(currentUser.email);
                        userIdentifiers.add(currentUser.email.replace(/[^a-zA-Z0-9]/g, '_'));
                        userIdentifiers.add(currentUser.email.split('@')[0]);
                    }
                    if (currentUser.sub) userIdentifiers.add(currentUser.sub);
                    
                    // All possible author identifiers from post
                    const authorIdentifiers = new Set();
                    if (data.post.authorId) authorIdentifiers.add(data.post.authorId);
                    if (data.post.authorUid) authorIdentifiers.add(data.post.authorUid);
                    if (data.post.authorEmail) authorIdentifiers.add(data.post.authorEmail);
                    
                    console.log('🔍 수정 권한 확인:', {
                        currentUser: currentUser,
                        userIdentifiers: Array.from(userIdentifiers),
                        authorIdentifiers: Array.from(authorIdentifiers),
                        post: data.post
                    });
                    
                    // Check for any match
                    const isAuthor = Array.from(userIdentifiers).some(userId => 
                        authorIdentifiers.has(userId)
                    );
                    
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
                        const lolTags = communityTags.lol;
                        
                        data.post.tags.forEach(tag => {
                            // LoL 챔피언 태그
                            if (lolTags.champions.includes(tag)) {
                                tagsData.champions.push(tag);
                            }
                            // 라인 태그
                            else if (lolTags.lanes.includes(tag)) {
                                tagsData.lanes.push(tag);
                            }
                            // 상황 태그
                            else if (lolTags.situations.includes(tag)) {
                                tagsData.situations.push(tag);
                            }
                            // 오브젝트 태그가 있다면 상황에 추가
                            else if (lolTags.objects && lolTags.objects.includes(tag)) {
                                tagsData.situations.push(tag);
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
                    
                    console.log("수정 페이지 - 원본 데이터:", data.post);
                    console.log("수정 페이지 - 변환된 태그 데이터:", tagsData);
                    console.log("수정 페이지 - PostForm에 전달할 데이터:", formattedData);
                    
                    setInitialData(formattedData);
                } else {
                    throw new Error('게시글 데이터를 불러올 수 없습니다.');
                }
            } catch (error) {
                console.error("게시글 로드 실패:", error);
                alert(error.message || '게시글을 불러오는데 실패했습니다.');
                // 에러 처리 (예: 404 페이지로 리다이렉트)
                router.push("/lol/community");
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
                    gameType="lol"
                    title="리그 오브 레전드 법원"
                    description="소환사의 협곡에서 발생한 분쟁을 공정하게 심판합니다"
                />
                <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <p className="text-red-600 mb-4">{authError}</p>
                        <button
                            onClick={() => router.push("/lol/community")}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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
            console.log("LoL 게시글 수정:", { postId, ...formData });

            const response = await fetch(`/api/community/lol/posts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '게시글 수정에 실패했습니다.');
            }

            // 성공 시 상세 페이지로 리다이렉트
            router.push(`/lol/community/post/${postId}`);
        } catch (error) {
            console.error("게시글 수정 실패:", error);
            alert(error.message || '게시글 수정에 실패했습니다.');
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
