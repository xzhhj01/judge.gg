import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Providers from "./utils/providers";
import { ThemeProvider } from "./components/ThemeProvider";
import Footer from "./components/Footer";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "Judge.gg",
    description: "게임 심판 플랫폼",
};

export default function RootLayout({ children }) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-dark-900 text-gray-900 dark:text-white transition-colors`}
            >
                <ThemeProvider>
                    <Providers>
                        <Header />
                        <main className="min-h-screen">{children}</main>
                        <Footer />
                    </Providers>
                </ThemeProvider>
            </body>
        </html>
    );
}
