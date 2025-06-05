"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function SignUp() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        nickname: "",
        role: "USER",
        lolTier: null,
        lolNickname: null,
        lolUserNum: null,
        valTier: null,
        valNickname: null,
        valUserNum: null,
    });

    const [errors, setErrors] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        nickname: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            nickname: "",
        };

        if (!formData.username.trim()) {
            newErrors.username = "실명을 입력해주세요";
            isValid = false;
        }

        if (!formData.nickname.trim()) {
            newErrors.nickname = "닉네임을 입력해주세요";
            isValid = false;
        }

        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            newErrors.email = "올바른 이메일 형식이 아닙니다";
            isValid = false;
        }

        if (formData.password.length < 6) {
            newErrors.password = "비밀번호는 6자 이상이어야 합니다";
            isValid = false;
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "비밀번호가 일치하지 않습니다";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // 입력 시 에러 메시지 초기화
        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post('/api/auth/signup', formData);
            if (response.status === 200) {
                router.push("/login");
            }
        } catch (error) {
            console.error("회원가입 실패:", error);
            const errorMessage = error.response?.data?.error || "회원가입에 실패했습니다.";
            
            if (errorMessage.includes("이메일")) {
                setErrors((prev) => ({
                    ...prev,
                    email: errorMessage,
                }));
            } else {
                setErrors((prev) => ({
                    ...prev,
                    email: errorMessage,
                }));
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto p-4 max-w-md mt-16">
            <h2 className="text-2xl font-semibold text-center mb-6">
                회원가입
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 mb-1">이름</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        className="block w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                        onChange={handleChange}
                        required
                    />
                    {errors.username && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.username}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-gray-700 mb-1">닉네임</label>
                    <input
                        type="text"
                        name="nickname"
                        value={formData.nickname}
                        className="block w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                        onChange={handleChange}
                        required
                    />
                    {errors.nickname && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.nickname}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-gray-700 mb-1">이메일</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        className="block w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                        onChange={handleChange}
                        required
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-gray-700 mb-1">비밀번호</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        className="block w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                        onChange={handleChange}
                        required
                    />
                    {errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.password}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-gray-700 mb-1">
                        비밀번호 확인
                    </label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        className="block w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                        onChange={handleChange}
                        required
                    />
                    {errors.confirmPassword && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.confirmPassword}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? "가입 중..." : "가입하기"}
                </button>
            </form>
            <p className="text-center text-sm mt-4">
                이미 계정이 있으신가요?{" "}
                <a href="/login" className="text-blue-500">
                    로그인
                </a>
            </p>
        </div>
    );
}
