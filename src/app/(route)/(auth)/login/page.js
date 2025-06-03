'use client';

import LoginButton from "@/app/components/LoginButton";

export default function Login() {
  return (
    <div className="mx-auto p-4 max-w-xs">
      <h2 className="text-xl text-center mb-4">로그인</h2>
      <form>
        <input type="email" placeholder="이메일" required className="block w-full mb-3 p-2 border rounded" />
        <input type="password" placeholder="비밀번호" required className="block w-full mb-4 p-2 border rounded" />
        <button type="submit" className="w-full p-2 bg-[#1FAB89] text-white rounded">로그인</button>
      </form>
      <p className="text-center text-sm mt-2">
        계정이 없으신가요? <a href="/signup" className="text-[#1FAB89]">회원가입</a>
      </p>
      <div className="my-6 text-center">
        <span className="text-gray-400">— 또는 —</span>
        <div className="mt-3 flex justify-center">
          <LoginButton />
        </div>
      </div>
    </div>
  );
}
