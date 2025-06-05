"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function MentorProfilePage() {
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
    const [selectedCurriculums, setSelectedCurriculums] = useState([]);

    const curriculumOptions = [
        "영상 피드백",
        "실시간 원포인트 피드백",
        "실시간 1:1 강의",
    ];

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

    // 커리큘럼 토글
    const toggleCurriculum = (curriculum) => {
        setSelectedCurriculums((prev) => {
            if (prev.includes(curriculum)) {
                return prev.filter((item) => item !== curriculum);
            } else {
                return [...prev, curriculum];
            }
        });
    };

    // 폼 제출
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // FormData 객체 생성
            const formData = new FormData();

            // 기본 정보 추가
            formData.append("selectedGame", selectedGame);
            formData.append("nickname", nickname);
            formData.append("oneLineIntro", oneLineIntro);
            formData.append("detailedIntro", detailedIntro);
            if (profileImage) {
                formData.append("profileImage", profileImage);
            }

            // 선택된 태그들 추가
            formData.append("characterTags", JSON.stringify(characterTags));
            formData.append("lineTags", JSON.stringify(lineTags));
            formData.append("experienceTags", JSON.stringify(experienceTags));

            // 선택된 커리큘럼 추가
            formData.append("curriculums", JSON.stringify(selectedCurriculums));

            // 계정 정보 추가
            accounts.forEach((account, index) => {
                if (account.name) {
                    formData.append(`account_${index}_name`, account.name);
                    if (account.screenshot) {
                        formData.append(
                            `account_${index}_screenshot`,
                            account.screenshot
                        );
                    }
                }
            });

            // 경력 상세 정보 추가
            formData.append(
                "experienceDetails",
                JSON.stringify(experienceDetails)
            );

            // API 엔드포인트로 데이터 전송
            const response = await fetch("/api/mentor/profile/update", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("프로필 업데이트에 실패했습니다.");
            }

            alert("프로필이 성공적으로 업데이트되었습니다!");
        } catch (error) {
            console.error("Error:", error);
            alert(error.message);
        }
    };

    // 초기 데이터 로드
    useEffect(() => {
        const loadMentorProfile = async () => {
            try {
                const response = await fetch("/api/mentor/profile");
                if (!response.ok) {
                    throw new Error("프로필 로드에 실패했습니다.");
                }
                const data = await response.json();

                // 데이터 설정
                setSelectedGame(data.selectedGame || "lol");
                setNickname(data.nickname || "");
                setOneLineIntro(data.oneLineIntro || "");
                setAccounts(data.accounts || [{ name: "", screenshot: null }]);
                setCharacterTags(data.characterTags || []);
                setLineTags(data.lineTags || []);
                setExperienceTags(data.experienceTags || []);
                setExperienceDetails(data.experienceDetails || [""]);
                setDetailedIntro(data.detailedIntro || "");
                setSelectedCurriculums(data.curriculums || []);
            } catch (error) {
                console.error("Error loading profile:", error);
                alert("프로필 로드 중 오류가 발생했습니다.");
            }
        };

        loadMentorProfile();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 헤더 */}
                <div className="mb-8">
                    <Link
                        href="/mypage"
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
                        마이페이지로
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">
                        멘토 프로필 관리
                    </h1>
                    <p className="text-gray-600 mt-2">
                        멘토링 정보를 관리하고 프로필을 업데이트하세요.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

                    {/* 경력사항 */}
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">
                            경력사항 <span className="text-red-500">*</span>
                        </h2>
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
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                                                    ? "bg-primary-500 border-primary-500"
                                                    : "border-gray-300 group-hover:border-primary-500"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                            required
                        />
                        <p className="text-sm text-gray-500 mt-2">
                            {detailedIntro.length}/1000자
                        </p>
                    </section>

                    {/* 제출 버튼 */}
                    <div className="flex justify-end gap-3">
                        <Link
                            href="/mypage"
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            취소
                        </Link>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                        >
                            저장하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
