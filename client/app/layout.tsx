import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "./homepage/components/SessionProviderWrapper";

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
    <html lang="en">
      <body
      >
       <SessionProviderWrapper>
          {children}
       </SessionProviderWrapper>
      </body>
    </html>
  );
}
