"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import UserMenu from "@/app/homepage/components/UserMenu";
import { 
  ChatBubbleIcon, 
  BellIcon, 
  PlusIcon 
} from "@radix-ui/react-icons";

type SessionUser = {
  role?: string;
  accessToken?: string;
  // add other properties as needed
};

// Sub-component: TopHeader
function TopHeader() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  // Logic lấy role an toàn (xử lý chữ hoa/thường)
  // Ép kiểu (session?.user as any) để tránh lỗi TypeScript nếu em chưa khai báo type cho role
  const userRole = (session?.user as SessionUser)?.role?.toLowerCase(); 
  const isLandlord = userRole === 'landlord';

  // Logic lấy số thông báo
  useEffect(() => {
    if (session?.user?.accessToken) {
      const fetchUnread = async () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
          const res = await fetch(`${apiUrl}/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${session.user.accessToken}` },
            cache: 'no-store'
          });
          if (res.ok) {
            const data = await res.json();
            setUnreadCount(data.count);
          }
        } catch (error) { console.error(error); }
      };
      fetchUnread();
      const interval = setInterval(fetchUnread, 15000);
      return () => clearInterval(interval);
    }
  }, [session]);

  return (
    <header className="relative w-full bg-[#010433] text-white z-50 shadow-lg border-b border-white/5">
      <div className="absolute inset-0 bg-linear-to-r from-[#010433] via-[#060c4d] to-[#010433] pointer-events-none" />

      <div className="relative w-full flex h-[100px] items-center justify-between px-6 md:px-10 2xl:px-16">
        
        {/* === LEFT: LOGO === */}
        <Link href="/" className="shrink-0 transition-transform hover:scale-105 duration-300 z-10">
          <Image
            src="/images/VLU-Renting-Logo.svg"
            alt="VLU Renting"
            width={160}
            height={64}
            className="object-contain w-auto h-[50px] sm:h-[60px] md:h-[70px]"
            priority
          />
        </Link>

        {/* === CENTER: TITLE === */}
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 text-center xl:block z-0 pointer-events-none">
          <h1 className="text-[36px] 2xl:text-[42px] font-extrabold leading-none tracking-tight drop-shadow-lg whitespace-nowrap">
            <span className="text-[#D51F35]">VLU</span>
            <span className="text-white">RENTING</span>
          </h1>
          <p className="mt-2 text-[12px] 2xl:text-[14px] font-medium text-gray-300 tracking-wide opacity-90 whitespace-nowrap">
            Trang web giúp sinh viên Văn Lang tìm kiếm nhà trọ phù hợp
          </p>
        </div>

        {/* === RIGHT: ACTIONS === */}
        <div className="flex items-center gap-3 sm:gap-4 z-10">
          
          {/* 👇 LOGIC PHÂN QUYỀN: CHỈ HIỆN NÚT ĐĂNG TIN NẾU LÀ LANDLORD */}
          {isLandlord && (
            <Link
              href="/post"
              className="
                group flex h-10 items-center justify-center gap-2 
                rounded-full bg-[#D51F35] text-white 
                font-bold text-sm shadow-md shadow-red-900/20
                transition-all duration-300
                hover:bg-[#b01628] hover:shadow-lg hover:-translate-y-0.5
                active:scale-95
                w-10 md:w-auto md:px-5 
              "
              title="Đăng tin mới"
            >
              <PlusIcon className="h-4 w-4 font-bold" />
              <span className="hidden md:inline">Đăng tin</span>
            </Link>
          )}

          {/* Chat */}
          <Link
            href="/chat"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white border border-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-[#0b1a57] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] active:scale-95"
          >
            <ChatBubbleIcon className="h-5 w-5" />
          </Link>

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white border border-white/10 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-[#0b1a57] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] active:scale-95"
          >
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D51F35] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-[#010433]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            )}
          </Link>

          {/* Menu */}
          <div className="pl-2 border-l border-white/10">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

// Sub-component: SearchBar
function SearchBar() {
  return (
    <div className="relative w-full h-[200px] sm:h-60 md:h-[280px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
        style={{ backgroundImage: "url('/images/Background-Image.svg')" }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-linear-to-t from-[#010433]/90 via-transparent to-transparent" />
      </div>
    </div>
  );
}

export default function Header() {
  return (
    <div className="flex flex-col w-full shadow-2xl">
      <TopHeader />
      <SearchBar />
    </div>
  );
}