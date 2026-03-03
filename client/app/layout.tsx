import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "./homepage/components/SessionProviderWrapper";
import { ThemeProvider } from "./theme/ThemeProvider";
import { Toaster } from "react-hot-toast";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

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
      <body className="overflow-x-hidden">
        <ThemeProvider>
          <SessionProviderWrapper>
            {children}
            {/* 👇 2. Đặt Toaster ở đây để hiển thị thông báo toàn cầu */}
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
