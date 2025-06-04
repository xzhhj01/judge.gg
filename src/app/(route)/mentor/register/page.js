"use client";

import { useState } from "react";
import Link from "next/link";

export default function MentorRegisterPage() {
    const [selectedGame, setSelectedGame] = useState("");
    const [profileImage, setProfileImage] = useState(null);
    const [nickname, setNickname] = useState("");
    const [oneLineIntro, setOneLineIntro] = useState("");
    const [accounts, setAccounts] = useState([{ name: "", screenshot: null }]);
    const [characterTags, setCharacterTags] = useState([]);
    const [lineTags, setLineTags] = useState([]);
    const [experienceTags, setExperienceTags] = useState([]);
    const [experienceDetails, setExperienceDetails] = useState([""]);
    const [detailedIntro, setDetailedIntro] = useState("");

    const [newCharacterTag, setNewCharacterTag] = useState("");
    const [newLineTag, setNewLineTag] = useState("");
    const [newExperienceTag, setNewExperienceTag] = useState("");

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
    const addTag = (type) => {
        if (type === "character" && newCharacterTag.trim()) {
            setCharacterTags([...characterTags, newCharacterTag.trim()]);
            setNewCharacterTag("");
        } else if (type === "line" && newLineTag.trim()) {
            setLineTags([...lineTags, newLineTag.trim()]);
            setNewLineTag("");
        } else if (type === "experience" && newExperienceTag.trim()) {
            setExperienceTags([...experienceTags, newExperienceTag.trim()]);
            setNewExperienceTag("");
        }
    };

    // 태그 제거
    const removeTag = (type, index) => {
        if (type === "character") {
            setCharacterTags(characterTags.filter((_, i) => i !== index));
        } else if (type === "line") {
            setLineTags(lineTags.filter((_, i) => i !== index));
        } else if (type === "experience") {
            setExperienceTags(experienceTags.filter((_, i) => i !== index));
        }
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

    // 폼 제출
    const handleSubmit = (e) => {
        e.preventDefault();
        // 폼 검증 및 제출 로직
        console.log({
            selectedGame,
            profileImage,
            nickname,
            oneLineIntro,
            accounts,
            characterTags,
            lineTags,
            experienceTags,
            experienceDetails,
            detailedIntro,
        });
        alert("멘토 등록이 완료되었습니다!");
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
                                onClick={() => setSelectedGame("lol")}
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
                                onClick={() => setSelectedGame("valorant")}
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
                                    className="bg-primary-500 hover:bg-primary-600 text-black border border-gray-300 px-4 py-2 rounded-lg cursor-pointer transition-colors"
                                >
                                    사진 업로드
                                </label>
                                <p className="text-sm text-gray-500 mt-2">
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
                            <h2 className="text-lg font-semibold text-gray-900">
                                {selectedGame === "lol"
                                    ? "소환사명"
                                    : "배틀태그"}{" "}
                                <span className="text-red-500">*</span>
                            </h2>
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

                                    <div className="space-y-3">
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
                                            placeholder={
                                                selectedGame === "lol"
                                                    ? "소환사명을 입력해주세요"
                                                    : "배틀태그를 입력해주세요"
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            required
                                        />

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                인증 캡처 화면{" "}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </label>
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
                                            {account.screenshot && (
                                                <p className="text-sm text-green-600 mt-1">
                                                    {account.screenshot.name}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                라이엇 아이디 마이페이지 캡처
                                                화면을 업로드해주세요
                                            </p>
                                        </div>
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
                            <div className="flex flex-wrap gap-2 mb-3">
                                {characterTags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeTag("character", index)
                                            }
                                            className="ml-2 text-green-500 hover:text-green-700"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newCharacterTag}
                                    onChange={(e) =>
                                        setNewCharacterTag(e.target.value)
                                    }
                                    placeholder="특징 태그 입력"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    onKeyPress={(e) =>
                                        e.key === "Enter" &&
                                        (e.preventDefault(),
                                        addTag("character"))
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => addTag("character")}
                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    추가
                                </button>
                            </div>
                        </div>

                        {/* 라인 태그 */}
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-900 mb-3">
                                라인
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {lineTags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeTag("line", index)
                                            }
                                            className="ml-2 text-purple-500 hover:text-purple-700"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newLineTag}
                                    onChange={(e) =>
                                        setNewLineTag(e.target.value)
                                    }
                                    placeholder="라인 태그 입력"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    onKeyPress={(e) =>
                                        e.key === "Enter" &&
                                        (e.preventDefault(), addTag("line"))
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => addTag("line")}
                                    className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    추가
                                </button>
                            </div>
                        </div>

                        {/* 챔피언 태그 (추후 추가) */}
                        <div>
                            <h3 className="font-medium text-gray-900 mb-3">
                                챔피언
                            </h3>
                            <p className="text-sm text-gray-500">
                                추후 업데이트 예정입니다.
                            </p>
                        </div>
                    </section>

                    {/* 경력사항 */}
                    <section className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">
                            경력사항
                        </h2>

                        {/* 경력 태그 */}
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-900 mb-3">
                                경력 태그
                            </h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {experienceTags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeTag("experience", index)
                                            }
                                            className="ml-2 text-orange-500 hover:text-orange-700"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newExperienceTag}
                                    onChange={(e) =>
                                        setNewExperienceTag(e.target.value)
                                    }
                                    placeholder="경력 태그 입력 (예: 프로게이머, 코치, 스트리머)"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    onKeyPress={(e) =>
                                        e.key === "Enter" &&
                                        (e.preventDefault(),
                                        addTag("experience"))
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => addTag("experience")}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                                >
                                    추가
                                </button>
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
                    <div className="flex justify-center pt-6">
                        <button
                            type="submit"
                            className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors"
                        >
                            멘토 등록 신청하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
