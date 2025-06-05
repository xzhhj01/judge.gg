"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { mentorService } from '@/app/services/mentor/mentor.service';
import communityTags from '@/data/communityTags.json';

const SERVICE_TYPES = [
    {
        id: "replay",
        name: "영상 피드백",
        description: "녹화된 게임 영상을 보고 상세한 피드백을 제공합니다.",
        icon: "🎥",
    },
    {
        id: "realtime",
        name: "실시간 1:1",
        description: "디스코드를 통해 실시간으로 1:1 코칭을 진행합니다.",
        icon: "🎮",
    },
    {
        id: "chat",
        name: "채팅 상담",
        description: "채팅을 통해 빠르게 질문하고 답변받을 수 있습니다.",
        icon: "💬",
    },
];

export default function MentorRegisterPage() {
    const router = useRouter();
    const [selectedGame, setSelectedGame] = useState("lol");
    const [profileImage, setProfileImage] = useState(null);
    const [nickname, setNickname] = useState("");
    const [oneLineIntro, setOneLineIntro] = useState("");
    const [accounts, setAccounts] = useState([{ name: "", screenshot: null }]);
    const [characterTags, setCharacterTags] = useState([]);
    const [lineTags, setLineTags] = useState([]);
    const [experienceTags, setExperienceTags] = useState([]);
    const [experienceDetails, setExperienceDetails] = useState([""]);
    const [detailedIntro, setDetailedIntro] = useState("");
    const [contact, setContact] = useState("");
    const [responseRate, setResponseRate] = useState(100);
    const [experienceYears, setExperienceYears] = useState(1);

    const [newCharacterTag, setNewCharacterTag] = useState("");
    const [newLineTag, setNewLineTag] = useState("");
    const [newExperienceTag, setNewExperienceTag] = useState("");

    const [championSearch, setChampionSearch] = useState("");

    const [selectedCurriculums, setSelectedCurriculums] = useState([]);

    const curriculumOptions = [
        "영상 피드백",
        "실시간 원포인트 피드백",
        "실시간 1:1 강의",
    ];

    const [services, setServices] = useState({
        lol: SERVICE_TYPES.map((type) => ({
            type: type.id,
            enabled: false,
            price: 0,
        })),
        valorant: SERVICE_TYPES.map((type) => ({
            type: type.id,
            enabled: false,
            price: 0,
        })),
    });

    const toggleCurriculum = (curriculum) => {
        setSelectedCurriculums((prev) => {
            if (prev.includes(curriculum)) {
                return prev.filter((item) => item !== curriculum);
            } else {
                return [...prev, curriculum];
            }
        });
    };

    // communityTags.json에서 데이터 가져오기
    const tagData = {
        lol: {
            lanes: communityTags.lol.lanes,
            champions: communityTags.lol.champions,
            situations: communityTags.lol.situations
        },
        valorant: {
            agents: communityTags.valorant.agents.map(agent => agent.name),
            maps: communityTags.valorant.maps,
            situations: communityTags.valorant.situations
        },
    };

    const featureTags = [
        "친절함",
        "열정적임", 
        "전문적임",
        "유머러스함",
        "인내심 강함",
        "체계적임",
        "꼼꼼함",
        "이해하기 쉬움"
    ];

    const [selectedTags, setSelectedTags] = useState({
        champions: [],
        lanes: [],
        situations: [],
        maps: [],
        agents: [],
        experience: [],
    });

    const experienceTagList = [
        "프로게이머",
        "코치",
        "연습생",
        "스트리머",
        "유튜버",
        "대회 입상",
        "고티어",
    ];

    // 태그 상태 변경 시 강제 렌더링
    useEffect(() => {
        console.log("selectedTags changed:", selectedTags);
    }, [selectedTags]);

    // 계정 추가
    const addAccount = () => {
        if (accounts.length < 5) {
            setAccounts([...accounts, { name: "", screenshot: null }]);
        }
    };

    // 계정 제거
    const removeAccount = (index) => {
        if (accounts.length > 1) {
            setAccounts(accounts.filter((_, i) => i !== index));
        }
    };

    // 계정 정보 업데이트
    const updateAccount = (index, field, value) => {
        const updatedAccounts = [...accounts];
        updatedAccounts[index][field] = value;
        setAccounts(updatedAccounts);
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

    // 태그 토글
    const toggleTag = (category, tag) => {
        console.log(`Toggling tag: ${tag} in category: ${category}`);
        if (selectedTags[category].includes(tag)) {
            removeTag(category, tag);
        } else {
            addTag(category, tag);
        }
        console.log("Updated selectedTags:", selectedTags);
    };

    // 경력 상세 추가
    const addExperienceDetail = () => {
        setExperienceDetails([...experienceDetails, ""]);
    };

    // 경력 상세 제거
    const removeExperienceDetail = (index) => {
        if (experienceDetails.length > 1) {
            setExperienceDetails(
                experienceDetails.filter((_, i) => i !== index)
            );
        }
    };

    // 경력 상세 업데이트
    const updateExperienceDetail = (index, value) => {
        const updatedDetails = [...experienceDetails];
        updatedDetails[index] = value;
        setExperienceDetails(updatedDetails);
    };

    // 파일 업로드 핸들러
    const handleFileUpload = (file, type, index = null) => {
        if (type === "profile") {
            setProfileImage(file);
        } else if (type === "screenshot" && index !== null) {
            updateAccount(index, "screenshot", file);
        }
    };

    // 게임 선택 시 태그 초기화
    const handleGameSelection = (game) => {
        setSelectedGame(game);
        setSelectedTags({
            champions: [],
            lanes: [],
            situations: [],
            maps: [],
            agents: [],
            experience: [],
        });
    };

    const handleServiceChange = (gameType, serviceType, field, value) => {
        setServices((prev) => ({
            ...prev,
            [gameType]: prev[gameType].map((service) =>
                service.type === serviceType
                    ? { ...service, [field]: value }
                    : service
            ),
        }));
    };

    // 폼 제출
    const handleSubmit = async (e) => {
        e.preventDefault();

        // 필수 항목 검증
        if (!nickname.trim()) {
            alert("닉네임을 입력해주세요.");
            return;
        }
        if (!oneLineIntro.trim()) {
            alert("한줄 소개를 입력해주세요.");
            return;
        }
        if (!detailedIntro.trim()) {
            alert("상세 소개를 입력해주세요.");
            return;
        }
        if (!contact.trim()) {
            alert("연락처를 입력해주세요.");
            return;
        }
        if (!profileImage) {
            alert("프로필 사진을 업로드해주세요.");
            return;
        }
        if (selectedCurriculums.length === 0) {
            alert("최소 1개 이상의 커리큘럼을 선택해주세요.");
            return;
        }
        if (!accounts[0].name || !accounts[0].screenshot) {
            alert("최소 1개의 Riot ID와 스크린샷을 등록해주세요.");
            return;
        }

        try {
            // FormData 객체 생성
            const formData = new FormData();

            // 기본 정보 추가
            formData.append("selectedGame", selectedGame);
            formData.append("nickname", nickname);
            formData.append("oneLineIntro", oneLineIntro);
            formData.append("detailedIntro", detailedIntro);
            formData.append("contact", contact);
            formData.append("responseRate", responseRate);
            formData.append("experienceYears", experienceYears);
            formData.append("profileImage", profileImage);

            // 선택된 태그들 추가
            formData.append("tags", JSON.stringify(selectedTags));

            // 선택된 커리큘럼 추가
            formData.append("curriculums", JSON.stringify(selectedCurriculums));

            // 계정 정보 추가
            accounts.forEach((account, index) => {
                if (account.name && account.screenshot) {
                    formData.append(`account_${index}_name`, account.name);
                    formData.append(
                        `account_${index}_screenshot`,
                        account.screenshot
                    );
                }
            });

            // 경력 상세 정보 추가
            formData.append(
                "experienceDetails",
                JSON.stringify(experienceDetails)
            );

            // 서비스 정보 추가
            services[selectedGame].forEach((service, index) => {
                if (service.enabled) {
                    formData.append(`service_${index}_type`, service.type);
                    formData.append(
                        `service_${index}_price`,
                        service.price.toString()
                    );
                }
            });

            // API 엔드포인트로 데이터 전송
            const response = await fetch("/api/mentor/register", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("멘토 등록에 실패했습니다.");
            }

            const data = await response.json();
            alert("멘토 등록이 완료되었습니다!");

            // 등록 완료 후 멘토 목록 페이지로 이동
            window.location.href = "/mentor";
        } catch (error) {
            console.error("Error:", error);
            alert(error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <Link
                        href="/mentor"
                        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                            />
                        </svg>
                        멘토 목록으로
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">
                        멘토 등록하기
                    </h1>
                    <p className="text-gray-600 mt-2">
                        게임 변호사로 활동하기 위한 정보를 입력해주세요.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* 게임 선택 */}
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            게임 선택 <span className="text-red-500">*</span>
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => handleGameSelection("lol")}
                                className={`p-4 border-2 rounded-lg transition-colors ${
                                    selectedGame === "lol"
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="text-center">
                                    <div className="text-2xl mb-2">🎮</div>
                                    <div className="font-medium">
                                        League of Legends
                                    </div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleGameSelection("valorant")}
                                className={`p-4 border-2 rounded-lg transition-colors ${
                                    selectedGame === "valorant"
                                        ? "border-red-500 bg-red-50"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="text-center">
                                    <div className="text-2xl mb-2">🔫</div>
                                    <div className="font-medium">VALORANT</div>
                                </div>
                            </button>
                        </div>
                    </section>

                    {/* 프로필 사진 */}
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            프로필 사진 <span className="text-red-500">*</span>
                        </h2>
                        <div className="flex items-center space-x-6">
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                {profileImage ? (
                                    <img
                                        src={URL.createObjectURL(profileImage)}
                                        alt="프로필"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <svg
                                        className="w-8 h-8 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        handleFileUpload(
                                            e.target.files[0],
                                            "profile"
                                        )
                                    }
                                    className="hidden"
                                    id="profile-upload"
                                />
                                <label
                                    htmlFor="profile-upload"
                                    className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 px-4 py-2 rounded-lg cursor-pointer transition-colors mb-4"
                                >
                                    사진 업로드
                                </label>
                                <p className="text-sm text-gray-500 mt-4">
                                    JPG, PNG 파일만 업로드 가능합니다.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 닉네임 */}
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            닉네임 <span className="text-red-500">*</span>
                        </h2>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="멘토로 활동할 닉네임을 입력해주세요"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </section>

                    {/* 한줄소개 */}
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            한줄 소개 <span className="text-red-500">*</span>
                        </h2>
                        <input
                            type="text"
                            value={oneLineIntro}
                            onChange={(e) => setOneLineIntro(e.target.value)}
                            placeholder="자신을 한줄로 소개해주세요"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            maxLength={100}
                            required
                        />
                        <p className="text-sm text-gray-500 mt-2">
                            {oneLineIntro.length}/100자
                        </p>
                    </section>

                    {/* 계정 정보 */}
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                    Riot ID{" "}
                                    <span className="text-red-500">*</span>
                                </h2>
                                <p className="text-sm text-gray-500">
                                    - Riot ID 전적 공개가 되어 있는지 확인해
                                    주세요.
                                    <br />- 인증을 위해 Riot ID 마이페이지 캡처
                                    화면을 업로드해주세요.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={addAccount}
                                disabled={accounts.length >= 5}
                                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm transition-colors"
                            >
                                계정 추가 ({accounts.length}/5)
                            </button>
                        </div>

                        <div className="space-y-4">
                            {accounts.map((account, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 rounded-lg p-4"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-medium text-gray-900">
                                            계정 {index + 1}
                                        </h3>
                                        {accounts.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeAccount(index)
                                                }
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="text"
                                            value={account.name}
                                            onChange={(e) =>
                                                updateAccount(
                                                    index,
                                                    "name",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="플레이어 이름 + #태그"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) =>
                                                handleFileUpload(
                                                    e.target.files[0],
                                                    "screenshot",
                                                    index
                                                )
                                            }
                                            className="hidden"
                                            id={`screenshot-${index}`}
                                        />
                                        <label
                                            htmlFor={`screenshot-${index}`}
                                            className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg cursor-pointer transition-colors"
                                        >
                                            {account.screenshot
                                                ? "파일 변경"
                                                : "파일 선택"}
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 태그 */}
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">
                            태그
                        </h2>

                        {/* 특징 태그 */}
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-900 mb-3">
                                특징
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {featureTags.map((tag, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() =>
                                            toggleTag("situations", tag)
                                        }
                                        className={`inline-flex px-3 py-1 rounded-full text-sm border transition-colors bg-white text-gray-700 border-gray-300 ${
                                            selectedTags.situations.includes(
                                                tag
                                            )
                                                ? "bg-green-100"
                                                : "bg-white"
                                        }`}
                                        style={{
                                            backgroundColor:
                                                selectedTags.situations.includes(
                                                    tag
                                                )
                                                    ? "#d1fae5"
                                                    : "#ffffff",
                                            borderColor:
                                                selectedTags.situations.includes(
                                                    tag
                                                )
                                                    ? "#34d399"
                                                    : "#d1d5db",
                                        }}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 라인/역할 태그 */}
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-900 mb-3">
                                {selectedGame === "valorant" ? "역할" : "라인"}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {(selectedGame === "valorant"
                                    ? tagData[selectedGame]?.agents
                                    : tagData[selectedGame]?.lanes
                                ).map((tag, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() =>
                                            toggleTag(
                                                selectedGame === "valorant"
                                                    ? "agents"
                                                    : "lanes",
                                                tag
                                            )
                                        }
                                        className={`inline-flex px-3 py-1 rounded-full text-sm border transition-colors bg-white text-gray-700 border-gray-300 ${
                                            selectedTags[
                                                selectedGame === "valorant"
                                                    ? "agents"
                                                    : "lanes"
                                            ].includes(tag)
                                                ? "bg-purple-100"
                                                : "bg-white"
                                        }`}
                                        style={{
                                            backgroundColor: selectedTags[
                                                selectedGame === "valorant"
                                                    ? "agents"
                                                    : "lanes"
                                            ].includes(tag)
                                                ? "#e9d5ff"
                                                : "#ffffff",
                                            borderColor: selectedTags[
                                                selectedGame === "valorant"
                                                    ? "agents"
                                                    : "lanes"
                                            ].includes(tag)
                                                ? "#a78bfa"
                                                : "#d1d5db",
                                        }}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 챔피언/요원 태그 */}
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-900 mb-3">
                                {selectedGame === "valorant"
                                    ? "특화 요원"
                                    : "특화 챔피언"}
                            </h3>
                            <input
                                type="text"
                                placeholder={`${selectedGame === "valorant" ? "요원" : "챔피언"} 이름을 검색하세요...`}
                                value={championSearch}
                                onChange={(e) =>
                                    setChampionSearch(e.target.value)
                                }
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                            />
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                <div className="flex flex-wrap gap-2">
                                    {(selectedGame === "valorant" 
                                        ? tagData[selectedGame]?.agents 
                                        : tagData[selectedGame]?.champions
                                    )
                                        ?.filter((tag) =>
                                            tag
                                                .toLowerCase()
                                                .includes(
                                                    championSearch.toLowerCase()
                                                )
                                        )
                                        ?.map((tag, index) => (
                                            <button
                                                key={index}
                                                type="button"
                                                onClick={() =>
                                                    toggleTag("champions", tag)
                                                }
                                                className={`inline-flex px-3 py-1 rounded-full text-sm border transition-colors ${
                                                    selectedTags.champions.includes(
                                                        tag
                                                    )
                                                        ? "bg-blue-100 border-blue-400 text-blue-800"
                                                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                </div>
                            </div>
                            {selectedTags.champions.length > 0 && (
                                <div className="mt-3">
                                    <p className="text-sm text-gray-600 mb-2">
                                        선택된 {selectedGame === "valorant" ? "요원" : "챔피언"}: {selectedTags.champions.length}개
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedTags.champions.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleTag("champions", tag)}
                                                    className="ml-1 text-blue-600 hover:text-blue-800"
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 경력사항 */}
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">
                            경력사항
                        </h2>

                        {/* 경력 년수 */}
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-900 mb-3">
                                경력 년수
                            </h3>
                            <div className="flex items-center space-x-4">
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={experienceYears}
                                    onChange={(e) => setExperienceYears(parseInt(e.target.value) || 1)}
                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <span className="text-gray-700">년</span>
                                <p className="text-sm text-gray-500">
                                    해당 게임의 경력 년수를 입력해주세요
                                </p>
                            </div>
                        </div>

                        {/* 경력 태그 */}
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-900 mb-3">
                                경력 태그
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {experienceTagList.map((tag, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() =>
                                            toggleTag("experience", tag)
                                        }
                                        className={`inline-flex px-3 py-1 rounded-full text-sm border transition-colors bg-white text-gray-700 border-gray-300 ${
                                            selectedTags.experience?.includes(
                                                tag
                                            )
                                                ? "bg-orange-100"
                                                : "bg-white"
                                        }`}
                                        style={{
                                            backgroundColor:
                                                selectedTags.experience?.includes(
                                                    tag
                                                )
                                                    ? "#ffedd5"
                                                    : "#ffffff",
                                            borderColor:
                                                selectedTags.experience?.includes(
                                                    tag
                                                )
                                                    ? "#fb923c"
                                                    : "#d1d5db",
                                        }}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 상세 경력 */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-medium text-gray-900">
                                    상세 경력
                                </h3>
                                <button
                                    type="button"
                                    onClick={addExperienceDetail}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                                >
                                    항목 추가
                                </button>
                            </div>
                            <div className="space-y-3">
                                {experienceDetails.map((detail, index) => (
                                    <div key={index} className="flex space-x-2">
                                        <input
                                            type="text"
                                            value={detail}
                                            onChange={(e) =>
                                                updateExperienceDetail(
                                                    index,
                                                    e.target.value
                                                )
                                            }
                                            placeholder="상세 경력을 입력해주세요"
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        {experienceDetails.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removeExperienceDetail(
                                                        index
                                                    )
                                                }
                                                className="text-red-500 hover:text-red-700 px-2"
                                            >
                                                <svg
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* 커리큘럼 선택 */}
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">
                            커리큘럼 선택{" "}
                            <span className="text-red-500">*</span>
                        </h2>
                        <div className="space-y-4">
                            {curriculumOptions.map((curriculum, index) => (
                                <label
                                    key={index}
                                    className="flex items-center space-x-3 cursor-pointer group"
                                >
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={selectedCurriculums.includes(
                                                curriculum
                                            )}
                                            onChange={() =>
                                                toggleCurriculum(curriculum)
                                            }
                                            className="hidden"
                                        />
                                        <div
                                            className={`w-5 h-5 border rounded transition-colors ${
                                                selectedCurriculums.includes(
                                                    curriculum
                                                )
                                                    ? "bg-blue-500 border-blue-500"
                                                    : "border-gray-300 group-hover:border-blue-500"
                                            }`}
                                        >
                                            {selectedCurriculums.includes(
                                                curriculum
                                            ) && (
                                                <svg
                                                    className="w-5 h-5 text-white"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-gray-700 group-hover:text-gray-900">
                                        {curriculum}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* 상세 소개 */}
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            상세 소개 <span className="text-red-500">*</span>
                        </h2>
                        <textarea
                            value={detailedIntro}
                            onChange={(e) => setDetailedIntro(e.target.value)}
                            placeholder="자신에 대해 자세히 소개해주세요. 멘토링 스타일, 강점, 경험 등을 포함해주세요."
                            rows={6}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            required
                        />
                        <p className="text-sm text-gray-500 mt-2">
                            {detailedIntro.length}/1000자
                        </p>
                    </section>

                    {/* 연락처 정보 */}
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            연락처 정보 <span className="text-red-500">*</span>
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    연락처 (디스코드, 카카오톡 등)
                                </label>
                                <input
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="예: discord#1234, 카카오톡ID 등"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    멘티들이 연락할 수 있는 연락처를 입력해주세요.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    예상 응답률 (%)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={responseRate}
                                    onChange={(e) => setResponseRate(parseInt(e.target.value) || 100)}
                                    className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    멘토링 요청에 대한 예상 응답률을 입력해주세요.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 서비스 설정 */}
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            서비스 설정
                        </h2>
                        <div className="space-y-4">
                            {SERVICE_TYPES.map((service) => (
                                <div
                                    key={service.id}
                                    className="border border-gray-200 rounded-lg p-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span>{service.icon}</span>
                                                <h3 className="font-medium">
                                                    {service.name}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {service.description}
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={
                                                    services[selectedGame].find(
                                                        (s) =>
                                                            s.type ===
                                                            service.id
                                                    ).enabled
                                                }
                                                onChange={(e) =>
                                                    handleServiceChange(
                                                        selectedGame,
                                                        service.id,
                                                        "enabled",
                                                        e.target.checked
                                                    )
                                                }
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                    {services[selectedGame].find(
                                        (s) => s.type === service.id
                                    ).enabled && (
                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                가격 설정
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1000"
                                                    value={
                                                        services[
                                                            selectedGame
                                                        ].find(
                                                            (s) =>
                                                                s.type ===
                                                                service.id
                                                        ).price
                                                    }
                                                    onChange={(e) =>
                                                        handleServiceChange(
                                                            selectedGame,
                                                            service.id,
                                                            "price",
                                                            parseInt(
                                                                e.target.value
                                                            ) || 0
                                                        )
                                                    }
                                                    className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                />
                                                <span className="text-gray-500">
                                                    원
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 제출 버튼 */}
                    <div className="flex justify-center pt-6">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-lg text-lg transition-colors shadow-md hover:shadow-lg"
                        >
                            멘토 신청하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
