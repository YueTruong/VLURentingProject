"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { BellIcon, ChatBubbleIcon } from "@radix-ui/react-icons";
import UserMenu from "@/app/homepage/components/UserMenu";
import ThemeToggleButton from "@/app/theme/ThemeToggleButton";

export default function UserTopBar() {
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  // Logic gọi API lấy số thông báo chưa đọc
  useEffect(() => {
    // Chỉ chạy khi đã đăng nhập
    if (status !== "authenticated") return;

    const fetchUnread = async () => {
      try {
        const token = session?.user?.accessToken;

        console.log("Token sending to API:", token);

        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        
        const res = await fetch(`${apiUrl}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
          // Thêm cache: 'no-store' để đảm bảo luôn lấy dữ liệu mới nhất
          cache: 'no-store' 
        });

        if (res.ok) {
          const data = await res.json();
          // data.count trả về từ backend
          setUnreadCount(data.count);
        }
      } catch (error) {
        console.error("Lỗi lấy số thông báo:", error);
      }
    };

    // 1. Gọi ngay lập tức khi load trang
    fetchUnread();

    // 2. Thiết lập Polling: Tự động gọi lại mỗi 15 giây để cập nhật số mới
    const intervalId = setInterval(fetchUnread, 15000);

    // Dọn dẹp khi component unmount
    return () => clearInterval(intervalId);
  }, [session, status]);

  return (
    <header className="sticky top-0 z-40 border-b border-[color:var(--surface-navy-border)] text-white backdrop-blur relative">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(to right, var(--surface-navy-900), var(--surface-navy-800), var(--surface-navy-700))",
        }}
      />
      <div className="relative mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10">
        
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image 
              src="/images/VLU-Renting-Logo.svg" 
              alt="VLU Renting" 
              width={140} 
              height={52} 
              className="object-contain" 
            />
          </Link>
          <div className="hidden text-xs text-white/70 sm:block">
            Trang web giúp sinh viên Văn Lang tìm nhà trọ phù hợp
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-3">
          <ThemeToggleButton
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 active:scale-95"
            iconClassName="h-5 w-5"
          />
          {session ? (
            <>
              {/* Nút Chat */}
              <Link
                href="/chat"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 active:scale-95"
                aria-label="Trò chuyện"
              >
                <ChatBubbleIcon className="h-5 w-5" />
                {/* Ghi chú: Hiện tại hệ thống Notification đã bao gồm cả tin nhắn chat.
                   Nếu em muốn tách riêng số tin nhắn chưa đọc ở đây, cần thêm API đếm chat riêng.
                   Tạm thời user sẽ nhìn vào Thông báo để biết có tin nhắn mới.
                */}
              </Link>

              {/* Nút Thông báo (Có Badge đỏ) */}
              <Link
                href="/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 active:scale-95"
                aria-label="Thông báo"
              >
                <BellIcon className="h-5 w-5" />
                
                {/* 👇 Hiển thị số đỏ nếu có thông báo */}
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--brand-accent)] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-[color:var(--surface-navy-900)]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* Menu User */}
              <UserMenu />
            </>
          ) : (
            <button
              onClick={() => signIn()}
              className="rounded-full bg-[color:var(--brand-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--brand-accent-strong)] active:scale-95"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
