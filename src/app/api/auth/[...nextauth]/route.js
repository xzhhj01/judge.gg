import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
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
        async jwt({ token, account }) {
            console.log("JWT Callback - Account:", account);
            console.log("JWT Callback - Token:", token);
            if (account) {
                token.accessToken = account.access_token;
                token.idToken = account.id_token;
            }
            return token;
        },
        async session({ session, token }) {
            console.log("Session Callback - Token:", token);
            console.log("Session Callback - Session:", session);
            session.accessToken = token.accessToken;
            session.idToken = token.idToken;
            return session;
        },
    },
    pages: {
        error: '/auth/error', // 에러 페이지 경로 설정
    },
    debug: true, // 개발 환경에서 디버그 활성화
});

export { handler as GET, handler as POST }; 