"use client";

import { useEffect } from "react";

export default function Snackbar({
    message,
    type = "success",
    isVisible,
    onClose,
    duration = 3000,
}) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose, duration]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
            <div
                className={`px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 ${
                    type === "success"
                        ? "bg-green-500 text-white"
                        : type === "error"
                        ? "bg-red-500 text-white"
                        : "bg-blue-500 text-white"
                }`}
            >
                {/* 아이콘 */}
                <div className="flex-shrink-0">
                    {type === "success" ? (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    ) : type === "error" ? (
                        <svg
                            className="w-5 h-5"
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
                    ) : (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    )}
                </div>

                {/* 메시지 */}
                <span className="font-medium">{message}</span>

                {/* 닫기 버튼 */}
                <button
                    onClick={onClose}
                    className="flex-shrink-0 ml-4 text-white hover:text-gray-200 transition-colors"
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
            </div>
        </div>
    );
}
