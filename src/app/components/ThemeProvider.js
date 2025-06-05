"use client";

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {}
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 안전하게 localStorage와 window 객체에 접근
    try {
      // 로컬 스토리지에서 테마 설정 불러오기
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
      } else {
        // 시스템 다크모드 설정 확인
        if (typeof window !== 'undefined' && window.matchMedia) {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setTheme(isDark ? 'dark' : 'light');
        }
      }
    } catch (error) {
      console.log('Failed to load theme preference, using default');
      setTheme('light');
    }
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      try {
        // HTML 클래스 업데이트
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        
        // 로컬 스토리지에 저장
        localStorage.setItem('theme', theme);
      } catch (error) {
        console.log('Failed to apply theme');
      }
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // SSR 이슈 방지
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white">
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // 에러를 던지는 대신 기본값을 반환
    return {
      theme: 'light',
      toggleTheme: () => {}
    };
  }
  return context;
}