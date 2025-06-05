'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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
        let mounted = true;
        
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (mounted) {
                setUser(currentUser);
                setLoading(false);
            }
        }, (error) => {
            if (mounted) {
                console.error('Firebase auth state change error:', error);
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
    }, []);

    // NextAuth 세션과 Firebase auth 동기화
    useEffect(() => {
        if (status !== 'loading') {
            console.log('🔍 인증 상태 동기화:', {
                hasSession: !!session,
                hasUser: !!user,
                sessionUser: session?.user ? {
                    id: session.user.id,
                    uid: session.user.uid,
                    email: session.user.email,
                    name: session.user.name
                } : null,
                firebaseUser: user ? {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName
                } : null
            });
            
            // NextAuth 세션이 있지만 Firebase user가 없는 경우
            if (session && !user) {
                console.log('🔍 NextAuth 세션 우선 사용');
                // Firebase에 로그인 시도하지 않고 NextAuth 세션을 우선
                setUser(session.user);
            }
            setLoading(false);
        }
    }, [status, session, user]);

    const logout = useCallback(async () => {
        try {
            // Firebase 로그아웃
            await firebaseSignOut(auth);
            setUser(null);
        } catch (error) {
            console.error('Firebase 로그아웃 실패:', error);
        }
    }, []);

    const value = useMemo(() => ({
        user: session?.user || user,
        loading: loading || status === 'loading',
        logout
    }), [user, session, loading, status, logout]);

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