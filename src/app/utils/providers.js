'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/firebase.config';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // 에러를 던지는 대신 기본값을 반환
        return {
            user: null,
            loading: false,
            logout: () => {}
        };
    }
    return context;
};

function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { data: session, status } = useSession();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // NextAuth 세션 상태 변화 감지
    useEffect(() => {
        if (status !== 'loading') {
            setLoading(false);
        }
    }, [status]);

    const logout = async () => {
        try {
            // Firebase 로그아웃
            await firebaseSignOut(auth);
            setUser(null);
        } catch (error) {
            console.error('Firebase 로그아웃 실패:', error);
        }
    };

    const value = {
        user,
        loading: loading || status === 'loading',
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default function Providers({ children }) {
    return (
        <SessionProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </SessionProvider>
    );
} 