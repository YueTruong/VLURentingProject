import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "./homepage/components/SessionProviderWrapper";
import { ThemeProvider } from "./theme/ThemeProvider";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className="overflow-x-hidden">
        <ThemeProvider>
          <SessionProviderWrapper>{children}</SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}