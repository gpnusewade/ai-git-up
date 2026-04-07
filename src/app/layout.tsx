import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/context/theme-context";
import { I18nProvider } from "@/lib/i18n";
import MaintenancePage from "@/components/maintenance-page";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "文字风格模仿工具",
  description: "AI驱动的文字风格迁移工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isPageAvailable =true/* process.env.PAGE_AVAILABLE === 'true'; */

  return (
    <html
      lang="zh-CN"
      data-theme="light"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <I18nProvider>
          <ThemeProvider>
            {isPageAvailable ? children : <MaintenancePage />}
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
