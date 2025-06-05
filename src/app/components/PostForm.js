"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    validatePostTitle,
    validatePostContent,
    validateVoteOptions,
    getCharacterCountDisplay,
    VALIDATION_LIMITS,
} from "@/app/utils/validation";
import Snackbar from "@/app/components/Snackbar";
import communityTags from "@/data/communityTags.json";

export default function PostForm({
    gameType,
    mode = "create",
    initialData = null,
    onSubmit,
}) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || "");
    const [videoFile, setVideoFile] = useState(null);
    const [selectedTags, setSelectedTags] = useState({
        champions: initialData?.tags?.champions || [],
        lanes: initialData?.tags?.lanes || [],
        situations: initialData?.tags?.situations || [],
        agents: initialData?.tags?.agents || [],
        maps: initialData?.tags?.maps || [],
        roles: initialData?.tags?.roles || [],
    });

    // selectedTags 상태 변화 디버깅
    useEffect(() => {
        console.log("PostForm - selectedTags 상태 변화:", selectedTags);
        console.log("PostForm - champions 태그 개수:", selectedTags.champions?.length || 0);
    }, [selectedTags]);
    const [content, setContent] = useState(initialData?.content || "");

    // 투표 설정
    const [voteType, setVoteType] = useState(
        gameType === "lol" ? "champion" : "agent"
    );
    const [voteOptions, setVoteOptions] = useState(["", ""]);
    const [allowNeutral, setAllowNeutral] = useState(false);
    const [voteDeadline, setVoteDeadline] = useState("");

    // 유효성 검사 상태
    const [validationErrors, setValidationErrors] = useState({});

    // 스낵바 상태
    const [snackbar, setSnackbar] = useState({
        isVisible: false,
        message: "",
        type: "success",
    });

    // 게임별 태그 데이터
    const tagData = communityTags[gameType];

    // 발로란트 에이전트 역할군
    const agentRoles =
        gameType === "valorant" && tagData?.agents
            ? {
                  타격대: tagData.agents
                      .filter((agent) => agent.role === "타격대")
                      .map((agent) => agent.name),
                  감시자: tagData.agents
                      .filter((agent) => agent.role === "감시자")
                      .map((agent) => agent.name),
                  척후대: tagData.agents
                      .filter((agent) => agent.role === "척후대")
                      .map((agent) => agent.name),
                  전략가: tagData.agents
                      .filter((agent) => agent.role === "전략가")
                      .map((agent) => agent.name),
              }
            : {};

    // 요원의 역할군 찾기
    const getAgentRole = (agentName) => {
        if (gameType !== "valorant" || !tagData?.agents) return null;
        const agent = tagData.agents.find((a) => a.name === agentName);
        return agent ? agent.role : null;
    };

    const [tagSearch, setTagSearch] = useState("");

    // 수정 모드일 때 초기 데이터 설정
    useEffect(() => {
        if (mode === "edit" && initialData) {
            console.log("PostForm 초기 데이터 설정:", initialData);
            console.log("PostForm mode:", mode);
            console.log("PostForm gameType:", gameType);
            
            setTitle(initialData.title || "");
            setContent(initialData.content || "");
            
            const tagsToSet = initialData.tags || {
                champions: [],
                lanes: [],
                situations: [],
                maps: [],
                agents: [],
                roles: [],
            };
            console.log("PostForm - 설정할 태그들:", tagsToSet);
            console.log("PostForm - champions 태그:", tagsToSet.champions);
            setSelectedTags(tagsToSet);
            
            setVoteOptions(initialData.voteOptions || ["", ""]);
            setAllowNeutral(initialData.allowNeutral || false);
            setVoteDeadline(initialData.voteDeadline || "");
        }
    }, [mode, initialData]);

    // textarea 자동 높이 조절
    const handleTextareaResize = (e) => {
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
    };

    // 태그 추가
    const addTag = (category, tag) => {
        if (!selectedTags[category]?.includes(tag)) {
            setSelectedTags((prev) => {
                const newTags = { ...prev };
                newTags[category] = [...(prev[category] || []), tag];

                // 요원 선택 시 해당 역할군 자동 추가
                if (category === "agents" && gameType === "valorant") {
                    const role = getAgentRole(tag);
                    if (role && !(prev.roles || []).includes(role)) {
                        newTags.roles = [...(prev.roles || []), role];
                    }
                }

                return newTags;
            });
        }
    };

    // 태그 제거
    const removeTag = (category, tag) => {
        setSelectedTags((prev) => {
            const newTags = { ...prev };
            newTags[category] = prev[category].filter((t) => t !== tag);

            // 요원 제거 시 해당 역할군의 다른 요원이 없다면 역할군도 제거
            if (category === "agents" && gameType === "valorant") {
                const role = getAgentRole(tag);
                if (role) {
                    const remainingAgentsInRole = (newTags.agents || []).filter(
                        (agent) => getAgentRole(agent) === role
                    );
                    if (remainingAgentsInRole.length === 0) {
                        newTags.roles = (prev.roles || []).filter((r) => r !== role);
                    }
                }
            }

            return newTags;
        });
    };

    // 역할군 토글
    const toggleRole = (role) => {
        setSelectedTags((prev) => {
            const newTags = { ...prev };
            if (prev.roles.includes(role)) {
                newTags.roles = prev.roles.filter((r) => r !== role);
            } else {
                newTags.roles = [...prev.roles, role];
            }
            return newTags;
        });
    };

    // 투표 옵션 업데이트
    const updateVoteOption = (index, value) => {
        const newOptions = [...voteOptions];
        newOptions[index] = value;
        setVoteOptions(newOptions);

        const validation = validateVoteOptions(newOptions);
        setValidationErrors((prev) => ({
            ...prev,
            voteOptions: validation.isValid ? null : validation.message,
        }));
    };

    // 실시간 유효성 검사
    const handleTitleChange = (e) => {
        const newTitle = e.target.value;
        setTitle(newTitle);

        const validation = validatePostTitle(newTitle);
        setValidationErrors((prev) => ({
            ...prev,
            title: validation.isValid ? null : validation.message,
        }));
    };

    const handleContentChange = (e) => {
        const newContent = e.target.value;
        setContent(newContent);

        const validation = validatePostContent(newContent);
        setValidationErrors((prev) => ({
            ...prev,
            content: validation.isValid ? null : validation.message,
        }));
    };

    // 폼 제출
    const handleSubmit = (e) => {
        e.preventDefault();

        // Flatten the tags structure for the service
        const flatTags = [];
        Object.values(selectedTags).forEach(tagArray => {
            flatTags.push(...tagArray);
        });

        const formData = {
            title,
            content,
            tags: flatTags,
            videoFile: videoFile,
            videoUrl: videoUrl || null,
            voteOptions,
            allowNeutral,
            voteDeadline,
        };

        if (onSubmit) {
            onSubmit(formData);
        }

        // 스낵바 표시
        setSnackbar({
            isVisible: true,
            message:
                mode === "create"
                    ? "재판이 성공적으로 등록되었습니다!"
                    : "재판이 성공적으로 수정되었습니다!",
            type: "success",
        });
    };

    // 스낵바 닫기
    const closeSnackbar = () => {
        setSnackbar((prev) => ({ ...prev, isVisible: false }));
    };

    const gameColor = gameType === "lol" ? "blue" : "red";
    const cancelUrl =
        gameType === "lol" ? "/lol/community" : "/valorant/community";

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900">
                    {mode === "create" ? "새 재판 열기" : "재판 수정하기"}
                </h1>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-8 px-4 sm:px-6 lg:px-8"
            >
                {/* 1. 제목 입력 */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        제목 <span className="text-red-500">*</span>
                    </h2>
                    <input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="어떤 상황에 대해 재판을 요청하시나요?"
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${gameColor}-500 focus:border-transparent`}
                        required
                    />
                    {validationErrors.title && (
                        <p className="text-red-500 text-sm mt-2">
                            {validationErrors.title}
                        </p>
                    )}
                </section>

                {/* 2. 동영상 업로드 */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        동영상 업로드
                    </h2>
                    {mode === "edit" ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-gray-50">
                            <p className="text-gray-400 text-sm">
                                동영상은 수정할 수 없습니다
                            </p>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            {videoUrl ? (
                                <div className="space-y-4">
                                    <div className="text-green-600">
                                        <svg
                                            className="w-12 h-12 mx-auto mb-2"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <p className="font-medium">
                                            {videoUrl}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setVideoUrl("");
                                            setVideoFile(null);
                                        }}
                                        className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                        파일 제거
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <svg
                                        className="w-12 h-12 text-gray-400 mx-auto mb-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                        />
                                    </svg>
                                    <p className="text-sm text-gray-500 mb-4">
                                        MP4, AVI, MOV 파일 지원 (최대 100MB)
                                    </p>
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setVideoFile(file);
                                                setVideoUrl(file.name);
                                            }
                                        }}
                                        className="hidden"
                                        id="video-file"
                                    />
                                    <label
                                        htmlFor="video-file"
                                        className={`bg-${gameColor}-500 hover:bg-${gameColor}-600 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors`}
                                    >
                                        동영상 파일 선택
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* 3. 태그 선택 */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">
                        태그 선택
                    </h2>

                    <div className="space-y-6">
                        {gameType === "lol" ? (
                            <>
                                {/* 챔피언 */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                        챔피언
                                    </h3>

                                    {/* 선택된 챔피언 태그 표시 */}
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                                            선택된 챔피언 (디버그: {(selectedTags.champions || []).length}개)
                                        </h4>
                                        {(selectedTags.champions || []).length > 0 ? (
                                            <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                                {(selectedTags.champions || []).map(
                                                    (tag) => (
                                                        <span
                                                            key={`champions-${tag}`}
                                                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm cursor-pointer hover:bg-blue-200 transition-colors"
                                                            onClick={() =>
                                                                removeTag(
                                                                    "champions",
                                                                    tag
                                                                )
                                                            }
                                                        >
                                                            {tag}
                                                            <button
                                                                type="button"
                                                                className="ml-2 text-current hover:text-red-600 font-bold"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    removeTag("champions", tag);
                                                                }}
                                                            >
                                                                ×
                                                            </button>
                                                        </span>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-500 text-sm">
                                                선택된 챔피언이 없습니다. (디버그: {JSON.stringify(selectedTags.champions)})
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">챔피언 추가</h4>
                                        <input
                                            type="text"
                                            placeholder="챔피언 이름을 검색하세요..."
                                            value={tagSearch}
                                            onChange={(e) =>
                                                setTagSearch(e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 h-24 overflow-y-auto">
                                        {tagSearch ? (
                                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                                {tagData.champions
                                                    .filter((tag) =>
                                                        tag
                                                            .toLowerCase()
                                                            .includes(
                                                                tagSearch.toLowerCase()
                                                            )
                                                    )
                                                    .map((tag) => (
                                                        <button
                                                            key={tag}
                                                            type="button"
                                                            onClick={() =>
                                                                addTag(
                                                                    "champions",
                                                                    tag
                                                                )
                                                            }
                                                            disabled={(selectedTags.champions || []).includes(
                                                                tag
                                                            )}
                                                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                                                                (selectedTags.champions || []).includes(
                                                                    tag
                                                                )
                                                                    ? "bg-blue-200 text-blue-800 border-blue-400 cursor-not-allowed"
                                                                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                                                            }`}
                                                        >
                                                            {tag}
                                                        </button>
                                                    ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-gray-500 text-sm text-center">
                                                    챔피언 이름을 검색해주세요
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 라인 */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                        라인
                                    </h3>
                                    <div className="grid grid-cols-5 gap-2">
                                        {tagData.lanes.map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() =>
                                                    (selectedTags.lanes || []).includes(
                                                        tag
                                                    )
                                                        ? removeTag(
                                                              "lanes",
                                                              tag
                                                          )
                                                        : addTag("lanes", tag)
                                                }
                                                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                                    (selectedTags.lanes || []).includes(
                                                        tag
                                                    )
                                                        ? "bg-green-100 text-green-700 border-green-400 font-medium"
                                                        : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* 맵 */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                                        <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                        맵
                                    </h3>
                                    <div className="grid grid-cols-4 gap-2">
                                        {tagData.maps.map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() =>
                                                    (selectedTags.maps || []).includes(
                                                        tag
                                                    )
                                                        ? removeTag("maps", tag)
                                                        : addTag("maps", tag)
                                                }
                                                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                                    (selectedTags.maps || []).includes(
                                                        tag
                                                    )
                                                        ? "bg-orange-100 text-orange-700 border-orange-400 font-medium"
                                                        : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 요원별 */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                        요원별
                                    </h3>

                                    {/* 선택된 요원 태그 표시 */}
                                    {(selectedTags.agents || []).length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">선택된 요원</h4>
                                            <div className="flex flex-wrap gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                                                {(selectedTags.agents || []).map((tag) => (
                                                    <span
                                                        key={`agents-${tag}`}
                                                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm cursor-pointer hover:bg-red-200 transition-colors"
                                                        onClick={() =>
                                                            removeTag("agents", tag)
                                                        }
                                                    >
                                                        {tag}
                                                        <button
                                                            type="button"
                                                            className="ml-2 text-current hover:text-red-600 font-bold"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                removeTag("agents", tag);
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">요원 추가</h4>
                                        <input
                                            type="text"
                                            placeholder="요원 이름을 검색하세요..."
                                            value={tagSearch}
                                            onChange={(e) =>
                                                setTagSearch(e.target.value)
                                            }
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 h-24 overflow-y-auto">
                                        {tagSearch ? (
                                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                                {tagData.agents
                                                    .filter(
                                                        (agent) =>
                                                            agent.name
                                                                .toLowerCase()
                                                                .includes(
                                                                    tagSearch.toLowerCase()
                                                                ) ||
                                                            agent.role
                                                                .toLowerCase()
                                                                .includes(
                                                                    tagSearch.toLowerCase()
                                                                )
                                                    )
                                                    .map((agent) => (
                                                        <button
                                                            key={agent.name}
                                                            type="button"
                                                            onClick={() =>
                                                                addTag(
                                                                    "agents",
                                                                    agent.name
                                                                )
                                                            }
                                                            disabled={(selectedTags.agents || []).includes(
                                                                agent.name
                                                            )}
                                                            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                                                (selectedTags.agents || []).includes(
                                                                    agent.name
                                                                )
                                                                    ? "bg-red-200 text-red-800 border-red-400 cursor-not-allowed"
                                                                    : "bg-white text-gray-700 border-gray-300 hover:border-red-400"
                                                            }`}
                                                        >
                                                            {agent.name}
                                                        </button>
                                                    ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-gray-500 text-sm text-center">
                                                    요원 이름을 검색해주세요
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* 역할군 */}
                                <div className="mt-4">
                                    <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                        역할군
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {Object.keys(agentRoles).map((role) => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => toggleRole(role)}
                                                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                                    (selectedTags.roles || []).includes(
                                                        role
                                                    )
                                                        ? "bg-red-200 text-red-800 border-red-400"
                                                        : "bg-white text-gray-700 border-gray-300 hover:border-red-400"
                                                }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* 상황별 */}
                        <div>
                            <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                상황별
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                                {tagData.situations.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() =>
                                            (selectedTags.situations || []).includes(
                                                tag
                                            )
                                                ? removeTag("situations", tag)
                                                : addTag("situations", tag)
                                        }
                                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                            (selectedTags.situations || []).includes(
                                                tag
                                            )
                                                ? "bg-purple-100 text-purple-700 border-purple-400 font-medium"
                                                : "bg-white text-gray-700 border-gray-300 hover:border-purple-400"
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. 본문 입력 */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        본문 <span className="text-red-500">*</span>
                    </h2>
                    <textarea
                        value={content}
                        onChange={handleContentChange}
                        placeholder="상황에 대해 자세히 설명해주세요. 어떤 점이 문제였는지, 어떤 판단을 원하는지 구체적으로 작성해주세요."
                        rows={8}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${gameColor}-500 focus:border-transparent resize-none`}
                        required
                    />
                    {validationErrors.content && (
                        <p className="text-red-500 text-sm mt-2">
                            {validationErrors.content}
                        </p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                        {
                            getCharacterCountDisplay(
                                content,
                                VALIDATION_LIMITS.POST_CONTENT
                            ).text
                        }
                    </p>
                </section>

                {/* 5. 투표 설정 */}
                <section className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        투표 설정 <span className="text-red-500">*</span>
                    </h2>

                    <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-4">
                            투표 옵션
                        </h3>

                        <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex flex-wrap items-center justify-center gap-4">
                                {/* 옵션 1 */}
                                <div className="flex-1 min-w-[200px] max-w-xs">
                                    <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 text-center">
                                        {mode === "edit" ? (
                                            <div className="w-full px-4 py-3 text-center bg-gray-100 text-gray-600 font-medium text-lg rounded-lg">
                                                {voteOptions[0] ||
                                                    "첫 번째 선택지"}
                                            </div>
                                        ) : (
                                            <textarea
                                                value={voteOptions[0]}
                                                onChange={(e) =>
                                                    updateVoteOption(
                                                        0,
                                                        e.target.value
                                                    )
                                                }
                                                onInput={handleTextareaResize}
                                                placeholder="첫 번째 선택지"
                                                maxLength={
                                                    VALIDATION_LIMITS.VOTE_OPTION
                                                }
                                                rows={1}
                                                className="w-full px-4 py-3 text-center border-0 rounded-lg focus:ring-2 focus:ring-gray-500 focus:outline-none bg-white text-gray-700 font-medium text-lg resize-none overflow-hidden"
                                            />
                                        )}
                                    </div>
                                    {mode !== "edit" && (
                                        <div className="text-xs text-gray-500 text-left mt-2 px-4">
                                            {(voteOptions[0] || "").length}/
                                            {VALIDATION_LIMITS.VOTE_OPTION}자
                                        </div>
                                    )}
                                </div>

                                {/* VS */}
                                <div className="flex-shrink-0">
                                    <div
                                        className={`w-16 h-16 rounded-full flex items-center justify-center ${
                                            allowNeutral
                                                ? "bg-gray-500"
                                                : "bg-gray-600"
                                        }`}
                                    >
                                        <span className="text-white font-bold text-xs">
                                            {allowNeutral ? "중립기어" : "VS"}
                                        </span>
                                    </div>
                                </div>

                                {/* 옵션 2 */}
                                <div className="flex-1 min-w-[200px] max-w-xs">
                                    <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 text-center">
                                        {mode === "edit" ? (
                                            <div className="w-full px-4 py-3 text-center bg-gray-100 text-gray-600 font-medium text-lg rounded-lg">
                                                {voteOptions[1] ||
                                                    "두 번째 선택지"}
                                            </div>
                                        ) : (
                                            <textarea
                                                value={voteOptions[1]}
                                                onChange={(e) =>
                                                    updateVoteOption(
                                                        1,
                                                        e.target.value
                                                    )
                                                }
                                                onInput={handleTextareaResize}
                                                placeholder="두 번째 선택지"
                                                maxLength={
                                                    VALIDATION_LIMITS.VOTE_OPTION
                                                }
                                                rows={1}
                                                className="w-full px-4 py-3 text-center border-0 rounded-lg focus:ring-2 focus:ring-gray-500 focus:outline-none bg-white text-gray-700 font-medium text-lg resize-none overflow-hidden"
                                            />
                                        )}
                                    </div>
                                    {mode !== "edit" && (
                                        <div className="text-xs text-gray-500 text-left mt-2 px-4">
                                            {(voteOptions[1] || "").length}/
                                            {VALIDATION_LIMITS.VOTE_OPTION}자
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {validationErrors.voteOptions && mode !== "edit" && (
                            <p className="text-red-500 text-sm mt-2">
                                {validationErrors.voteOptions}
                            </p>
                        )}
                    </div>

                    {/* 중립 옵션 */}
                    <div className="mb-6">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={allowNeutral}
                                onChange={(e) =>
                                    setAllowNeutral(e.target.checked)
                                }
                                disabled={mode === "edit"}
                                className="mr-3"
                            />
                            <span
                                className={`text-sm ${
                                    mode === "edit"
                                        ? "text-gray-500"
                                        : "text-gray-700"
                                }`}
                            >
                                중립 옵션 추가
                            </span>
                        </label>
                    </div>

                    {/* 마감 기한 */}
                    <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-3">
                            투표 마감 기한
                        </h3>
                        <input
                            type="datetime-local"
                            value={voteDeadline}
                            onChange={(e) => setVoteDeadline(e.target.value)}
                            className={`px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${gameColor}-500 focus:border-transparent`}
                        />
                    </div>
                </section>

                {/* 제출 버튼 */}
                <div className="flex justify-center space-x-4 pt-6">
                    <Link
                        href={cancelUrl}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </Link>
                    <button
                        type="submit"
                        className={`px-8 py-3 bg-${gameColor}-500 hover:bg-${gameColor}-600 text-white rounded-lg font-medium transition-colors`}
                    >
                        {mode === "create" ? "재판 열기" : "수정 완료"}
                    </button>
                </div>
            </form>

            {/* 스낵바 표시 */}
            <Snackbar
                isVisible={snackbar.isVisible}
                message={snackbar.message}
                type={snackbar.type}
                onClose={closeSnackbar}
            />
        </div>
    );
}
