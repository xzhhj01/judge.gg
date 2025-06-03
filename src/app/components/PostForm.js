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

export default function PostForm({
    gameType,
    mode = "create",
    initialData = null,
    onSubmit,
}) {
    const [title, setTitle] = useState("");
    const [videoFile, setVideoFile] = useState(null);
    const [selectedTags, setSelectedTags] = useState({
        champions: [],
        lanes: [],
        situations: [],
        maps: [],
        agents: [],
    });
    const [content, setContent] = useState("");

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
    const tagData = {
        lol: {
            champions: [
                "야스오",
                "제드",
                "아리",
                "진",
                "카이사",
                "그레이브즈",
                "리 신",
                "쓰레쉬",
                "블리츠크랭크",
            ],
            lanes: ["탑", "정글", "미드", "원딜", "서포터"],
            situations: [
                "갱킹",
                "팀파이트",
                "라인전",
                "오브젝트",
                "백도어",
                "로밍",
            ],
        },
        valorant: {
            maps: [
                "바인드",
                "헤이븐",
                "스플릿",
                "어센트",
                "아이스박스",
                "브리즈",
                "프랙처",
                "펄",
            ],
            agents: [
                "제트",
                "레이나",
                "피닉스",
                "레이즈",
                "요루",
                "네온",
                "세이지",
                "킬조이",
                "사이퍼",
                "소바",
                "오멘",
                "브림스톤",
                "바이퍼",
                "아스트라",
            ],
            situations: [
                "스파이크 설치",
                "스파이크 해제",
                "클러치",
                "에코",
                "러시",
                "로테이션",
                "플래시 어시스트",
                "스모크 플레이",
            ],
        },
    };

    // 발로란트 에이전트 역할군
    const agentRoles = {
        제트: "듀얼리스트",
        레이나: "듀얼리스트",
        피닉스: "듀얼리스트",
        레이즈: "듀얼리스트",
        요루: "듀얼리스트",
        네온: "듀얼리스트",
        세이지: "센티넬",
        킬조이: "센티넬",
        사이퍼: "센티넬",
        챔버: "센티넬",
        소바: "이니시에이터",
        브리치: "이니시에이터",
        스카이: "이니시에이터",
        케이오: "이니시에이터",
        오멘: "컨트롤러",
        브림스톤: "컨트롤러",
        바이퍼: "컨트롤러",
        아스트라: "컨트롤러",
    };

    const [tagSearch, setTagSearch] = useState("");

    // 수정 모드일 때 초기 데이터 설정
    useEffect(() => {
        if (mode === "edit" && initialData) {
            setTitle(initialData.title || "");
            setContent(initialData.content || "");
            setSelectedTags(
                initialData.tags || {
                    champions: [],
                    lanes: [],
                    situations: [],
                    maps: [],
                    agents: [],
                }
            );
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
        if (!selectedTags[category].includes(tag)) {
            setSelectedTags((prev) => ({
                ...prev,
                [category]: [...prev[category], tag],
            }));
        }
    };

    // 태그 제거
    const removeTag = (category, tag) => {
        setSelectedTags((prev) => ({
            ...prev,
            [category]: prev[category].filter((t) => t !== tag),
        }));
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

        const formData = {
            title,
            videoFile,
            selectedTags,
            content,
            voteType,
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

    const currentTagData = tagData[gameType];
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
                            {videoFile ? (
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
                                            {videoFile.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {(
                                                videoFile.size /
                                                1024 /
                                                1024
                                            ).toFixed(2)}{" "}
                                            MB
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setVideoFile(null)}
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
                                        onChange={(e) =>
                                            setVideoFile(e.target.files[0])
                                        }
                                        className="hidden"
                                        id="video-upload"
                                    />
                                    <label
                                        htmlFor="video-upload"
                                        className={`bg-${gameColor}-500 hover:bg-${gameColor}-600 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors`}
                                    >
                                        파일 선택
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
                                    {selectedTags.champions.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {selectedTags.champions.map(
                                                (tag) => (
                                                    <span
                                                        key={`champions-${tag}`}
                                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm cursor-pointer"
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
                                                            className="ml-2 text-current hover:text-red-600"
                                                        >
                                                            ×
                                                        </button>
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    )}

                                    <div className="mb-3">
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
                                                {currentTagData.champions
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
                                                            disabled={selectedTags.champions.includes(
                                                                tag
                                                            )}
                                                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                                                                selectedTags.champions.includes(
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
                                    <div className="flex flex-wrap gap-2">
                                        {currentTagData.lanes.map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() =>
                                                    selectedTags.lanes.includes(
                                                        tag
                                                    )
                                                        ? removeTag(
                                                              "lanes",
                                                              tag
                                                          )
                                                        : addTag("lanes", tag)
                                                }
                                                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                                    selectedTags.lanes.includes(
                                                        tag
                                                    )
                                                        ? "bg-green-100 text-green-700 border-green-400"
                                                        : "bg-white text-gray-700 border-gray-300"
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
                                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                        {currentTagData.maps.map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() =>
                                                    selectedTags.maps.includes(
                                                        tag
                                                    )
                                                        ? removeTag("maps", tag)
                                                        : addTag("maps", tag)
                                                }
                                                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                                    selectedTags.maps.includes(
                                                        tag
                                                    )
                                                        ? "bg-orange-200 text-orange-800 border-orange-400"
                                                        : "bg-white text-gray-700 border-gray-300 hover:border-orange-400"
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 에이전트 */}
                                <div>
                                    <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                                        <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                                        에이전트
                                    </h3>

                                    {/* 선택된 에이전트 태그 표시 */}
                                    {selectedTags.agents.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {selectedTags.agents.map((tag) => (
                                                <span
                                                    key={`agents-${tag}`}
                                                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm cursor-pointer"
                                                    onClick={() =>
                                                        removeTag("agents", tag)
                                                    }
                                                >
                                                    {tag}
                                                    <button
                                                        type="button"
                                                        className="ml-2 text-current hover:text-red-600"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <input
                                            type="text"
                                            placeholder="에이전트 이름을 검색하세요..."
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
                                                {currentTagData.agents
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
                                                                selectedTags.agents.includes(
                                                                    tag
                                                                )
                                                                    ? removeTag(
                                                                          "agents",
                                                                          tag
                                                                      )
                                                                    : addTag(
                                                                          "agents",
                                                                          tag
                                                                      )
                                                            }
                                                            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                                                                selectedTags.agents.includes(
                                                                    tag
                                                                )
                                                                    ? "bg-red-200 text-red-800 border-red-400"
                                                                    : "bg-white text-gray-700 border-gray-300 hover:border-red-400"
                                                            }`}
                                                        >
                                                            <div>{tag}</div>
                                                            {agentRoles[
                                                                tag
                                                            ] && (
                                                                <div className="text-xs text-gray-500 mt-0.5">
                                                                    {
                                                                        agentRoles[
                                                                            tag
                                                                        ]
                                                                    }
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p className="text-gray-500 text-sm text-center">
                                                    에이전트 이름을 검색해주세요
                                                </p>
                                            </div>
                                        )}
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
                            <div className="flex flex-wrap gap-2">
                                {currentTagData.situations.map((tag) => (
                                    <button
                                        key={tag}
                                        type="button"
                                        onClick={() =>
                                            selectedTags.situations.includes(
                                                tag
                                            )
                                                ? removeTag("situations", tag)
                                                : addTag("situations", tag)
                                        }
                                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                            selectedTags.situations.includes(
                                                tag
                                            )
                                                ? "bg-purple-100 text-purple-700 border-purple-400"
                                                : "bg-white text-gray-700 border-gray-300"
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
                                            {voteOptions[0].length}/
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
                                            {voteOptions[1].length}/
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
