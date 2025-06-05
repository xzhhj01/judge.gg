"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LoginButton from "@/app/components/LoginButton";
import axios from "axios";

export default function Login() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({
        email: "",
        password: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setErrors((prev) => ({
            ...prev,
            [name]: "",
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/auth/login', formData);
            if (response.status === 200) {
                // 로그인 성공 후 페이지 새로고침하여 세션 상태 갱신
                window.location.href = "/";
            }
        } catch (error) {
            console.error("로그인 실패:", error);
            const errorMessage = error.response?.data?.error || "이메일 또는 비밀번호가 올바르지 않습니다.";
            setErrors({
                email: errorMessage,
                password: "",
            });
        }
    };

    return (
        <div className="mx-auto p-4 max-w-md mt-16">
            <h2 className="text-2xl font-semibold text-center mb-6">로그인</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 mb-1">이메일</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full p-2 border rounded focus:outline-none focus:border-blue-500"
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
                        onChange={handleChange}
                        className="block w-full p-2 border rounded focus:outline-none focus:border-blue-500"
                        required
                    />
                    {errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.password}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 mt-6"
                >
                    로그인
                </button>
            </form>

            <p className="text-center text-sm mt-4">
                계정이 없으신가요?{" "}
                <a href="/signup" className="text-blue-500">
                    회원가입
                </a>
            </p>

            <div className="my-6 text-center">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">
                            또는
                        </span>
                    </div>
                </div>
                <div className="mt-6 flex justify-center">
                    <LoginButton />
                </div>
            </div>
        </div>
    );
}
