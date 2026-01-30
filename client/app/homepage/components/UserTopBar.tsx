"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import UserMenu from "@/app/homepage/components/UserMenu";

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
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10">
        
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
          <div className="hidden sm:block text-xs text-gray-500">
            Trang web giúp sinh viên Văn Lang tìm nhà trọ phù hợp
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-3">
          {session ? (
            <>
              {/* Nút Chat */}
              <Link
                href="/chat"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:scale-95"
                aria-label="Trò chuyện"
              >
                <Image src="/icons/Chat.svg" alt="Chat" width={22} height={22} />
                {/* Ghi chú: Hiện tại hệ thống Notification đã bao gồm cả tin nhắn chat.
                   Nếu em muốn tách riêng số tin nhắn chưa đọc ở đây, cần thêm API đếm chat riêng.
                   Tạm thời user sẽ nhìn vào Thông báo để biết có tin nhắn mới.
                */}
              </Link>

              {/* Nút Thông báo (Có Badge đỏ) */}
              <Link
                href="/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:scale-95"
                aria-label="Thông báo"
              >
                <Image src="/icons/Notification.svg" alt="Thông báo" width={22} height={22} />
                
                {/* 👇 Hiển thị số đỏ nếu có thông báo */}
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D51F35] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
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
              className="rounded-full bg-[#D51F35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b01628] active:scale-95"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}