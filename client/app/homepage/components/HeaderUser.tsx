"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BellIcon, ChatBubbleIcon, PlusIcon } from "@radix-ui/react-icons";
import UserMenu from "@/app/homepage/components/UserMenu";
import ThemeToggleButton from "@/app/theme/ThemeToggleButton";

type SessionUser = {
  role?: string;
  accessToken?: string;
};

function TopHeader() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  const userRole = (session?.user as SessionUser)?.role?.toLowerCase();
  const isLandlord = userRole === "landlord";

  useEffect(() => {
    if (!session?.user?.accessToken) return;

    const fetchUnread = async () => {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          "http://localhost:3001";

        const res = await fetch(`${apiUrl}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
          cache: "no-store",
        });

        if (!res.ok) return;
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      } catch (error) {
        console.error(error);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [session]);

  return (
    <header className="relative z-50 w-full border-b border-[color:var(--surface-navy-border)] text-white shadow-lg">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--surface-navy-900), var(--surface-navy-800), var(--surface-navy-700))",
        }}
      />

      <div className="relative flex h-[100px] w-full items-center justify-between px-6 md:px-10 2xl:px-16">
        <Link href="/" className="z-10 shrink-0 transition-transform duration-300 hover:scale-105">
          <Image
            src="/images/VLU-Renting-Logo.svg"
            alt="VLU Renting"
            width={160}
            height={64}
            className="h-[50px] w-auto object-contain sm:h-[60px] md:h-[70px]"
            priority
          />
        </Link>

        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 text-center xl:block">
          <h1 className="whitespace-nowrap text-[36px] font-extrabold leading-none tracking-tight drop-shadow-lg 2xl:text-[42px]">
            <span className="text-[color:var(--brand-accent)]">VLU</span>
            <span className="text-white">RENTING</span>
          </h1>
          <p className="mt-2 whitespace-nowrap text-[12px] font-medium tracking-wide text-gray-300 opacity-90 2xl:text-[14px]">
            Trang web giúp sinh viên Văn Lang tìm kiếm nhà trọ phù hợp
          </p>
        </div>

        <div className="z-10 flex items-center gap-3 sm:gap-4">
          <ThemeToggleButton
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 active:scale-95"
            iconClassName="h-5 w-5"
          />

          {isLandlord ? (
            <Link
              href="/post"
              className="group flex h-10 w-10 items-center justify-center gap-2 rounded-full bg-[color:var(--brand-accent)] text-sm font-bold text-white shadow-md shadow-red-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[color:var(--brand-accent-strong)] hover:shadow-lg active:scale-95 md:w-auto md:px-5"
              title="Đăng tin mới"
            >
              <PlusIcon className="h-4 w-4 font-bold" />
              <span className="hidden md:inline">Đăng tin</span>
            </Link>
          ) : null}

          <Link
            href="/chat"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-[color:var(--surface-navy-900)] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] active:scale-95"
            aria-label="Chat"
          >
            <ChatBubbleIcon className="h-5 w-5" />
          </Link>

          <Link
            href="/notifications"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white hover:text-[color:var(--surface-navy-900)] hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] active:scale-95"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[color:var(--brand-accent)] px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-[color:var(--surface-navy-900)]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Link>

          <div className="border-l border-white/10 pl-2">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

function SearchBar() {
  return (
    <div className="relative h-[200px] w-full overflow-hidden sm:h-60 md:h-[280px]">
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
        style={{ backgroundImage: "url('/images/Background-Image.svg')" }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(to top, var(--surface-navy-overlay), transparent)",
          }}
        />
      </div>
    </div>
  );
}

export default function Header() {
  return (
    <div className="flex w-full flex-col shadow-2xl">
      <TopHeader />
      <SearchBar />
    </div>
  );
}