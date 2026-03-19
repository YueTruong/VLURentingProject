import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "./_shared/providers/SessionProviderWrapper";
import { ThemeProvider } from "./theme/ThemeProvider";
import { Toaster } from "react-hot-toast";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const themeInitScript = `
(() => {
  try {
    const storageKey = "vlu.theme";
    const stored = window.localStorage.getItem(storageKey);
    const theme =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
  } catch {
    const root = document.documentElement;
    root.dataset.theme = "light";
    root.style.colorScheme = "light";
    root.classList.add("light");
    root.classList.remove("dark");
  }
})();
`;

export const metadata: Metadata = {
  title: "VLU Renting",
  description: "Nền tảng hỗ trợ sinh viên Văn Lang tìm và thuê nhà trọ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="overflow-x-hidden">
        <ThemeProvider>
          <SessionProviderWrapper>
            {children}
            {/* Đặt Toaster ở đây để hiển thị thông báo toàn cầu */}
            <Toaster 
              position="top-right" 
              reverseOrder={false} 
              toastOptions={{
                duration: 3000, // Thời gian hiển thị 3 giây
              }}
            />
          </SessionProviderWrapper>
        </ThemeProvider>
        <SpeedInsights/>
        <Analytics />
      </body>
    </html>
  );
}
