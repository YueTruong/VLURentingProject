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

  // Lấy role trực tiếp thông qua type đã mở rộng
  const userRole = session?.user?.role?.toLowerCase();
  
  // Logic phân quyền
  const canUseChatAndNotif = userRole === "student" || userRole === "landlord";

  useEffect(() => {
    // Nếu chưa đăng nhập HOẶC không có quyền (là admin) thì không gọi API
    if (status !== "authenticated" || !canUseChatAndNotif) return;

    let active = true;

    const fetchUnread = async () => {
      try {
        const token = session?.user?.accessToken;
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
        
        const res = await fetch(`${apiUrl}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store' 
        });

        if (!active) return;

        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.count);
        }
      } catch (error) {
        if (!active) return;
        const anyError = error as { name?: string };
        if (anyError?.name === "AbortError") return;
        if (process.env.NODE_ENV === "development") {
          console.warn("Lỗi lấy số thông báo:", error);
        }
      }
    };

    fetchUnread();
    const intervalId = setInterval(fetchUnread, 15000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [session, status, canUseChatAndNotif]);

  return (
    <header className="sticky top-0 z-40 border-b border-(--surface-navy-border) text-white backdrop-blur shadow-sm">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(to right, var(--surface-navy-900), var(--surface-navy-800), var(--surface-navy-700))",
        }}
      />
      
      <div className="relative mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-10">
        
        {/* LOGO */}
        <div className="flex items-center gap-3">
          <Link href="/" className="shrink-0 transition-transform duration-300 hover:scale-105 z-10">
            <Image 
              src="/images/VLU-Renting-Logo.svg" 
              alt="VLU Renting" 
              width={140} 
              height={52} 
              className="object-contain"
              priority
            />
          </Link>
          <div className="hidden text-xs font-medium text-gray-300 tracking-wide uppercase sm:block">
            Trang web giúp sinh viên Văn Lang tìm nhà trọ phù hợp
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-3 z-10">
          
          <ThemeToggleButton
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
            iconClassName="h-5 w-5"
          />
          
          {session ? (
            <>
              {/* CHỈ HIỆN CHAT & THÔNG BÁO CHO STUDENT VÀ LANDLORD */}
              {canUseChatAndNotif && (
                <>
                  <Link
                    href="/chat"
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white hover:text-(--surface-navy-900) active:scale-95"
                    aria-label="Trò chuyện"
                  >
                    <ChatBubbleIcon className="h-5 w-5" />
                  </Link>

                  <Link
                    href="/notifications"
                    className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white hover:text-(--surface-navy-900) active:scale-95"
                    aria-label="Thông báo"
                  >
                    <BellIcon className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-(--brand-accent) px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-(--surface-navy-900)">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              <div className="pl-1 border-l border-white/10 ml-1">
                <UserMenu />
              </div>
            </>
          ) : (
            <button
              onClick={() => signIn()}
              className="rounded-full bg-(--brand-accent) px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-(--brand-accent-strong) active:scale-95"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
