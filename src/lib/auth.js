import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    access_type: "offline",
                    prompt: "consent",
                    response_type: "code",
                    scope: "openid email profile"
                }
            }
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            // 로그인 성공 시 Firebase에 사용자 정보 저장
            if (account?.provider === 'google' && user) {
                try {
                    const { loginService } = await import('@/app/services/user/login.service');
                    await loginService.handleUserData(user);
                } catch (error) {
                    console.error('Firebase 사용자 데이터 저장 실패:', error);
                    // Firebase 오류가 있어도 로그인은 성공으로 처리
                    return true;
                }
            }
            return true;
        },
        async jwt({ token, account, user }) {
            if (account) {
                token.accessToken = account.access_token;
                token.idToken = account.id_token;
                token.provider = account.provider;
            }
            if (user) {
                token.uid = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.idToken = token.idToken;
            session.provider = token.provider;
            session.user.uid = token.uid;
            return session;
        },
        async redirect({ url, baseUrl }) {
            // 로그인 후 메인 페이지로 리다이렉트
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    },
    pages: {
        signIn: '/login',
        error: '/auth/error',
    },
    session: {
        strategy: 'jwt',
    },
    debug: process.env.NODE_ENV === 'development',
};