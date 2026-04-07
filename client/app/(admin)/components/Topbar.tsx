"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { BellIcon, ChatBubbleIcon, PlusIcon } from "@radix-ui/react-icons";
import UserMenu from "@/app/_shared/navigation/UserMenu";
import ThemeToggleButton from "@/app/theme/ThemeToggleButton";
import { getUnreadNotificationCount } from "@/app/services/notifications";

export default function Topbar() {
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const canUseChatAndNotif = Boolean(session);
  const canPostListing = Boolean(session);

  useEffect(() => {
    if (status !== "authenticated" || !canUseChatAndNotif) return;

    let active = true;

    const fetchUnread = async () => {
      try {
        const token = session?.user?.accessToken;
        if (!token) return;

        const nextCount = await getUnreadNotificationCount(token);
        if (!active) return;
        setUnreadCount(nextCount);
      } catch (error) {
        if (!active) return;
        if (process.env.NODE_ENV === "development") {
          console.warn("Khong the lay so thong bao chua doc:", error);
        }
      }
    };

    void fetchUnread();
    const intervalId = window.setInterval(() => {
      void fetchUnread();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [canUseChatAndNotif, session, status]);

  return (
    <header className="sticky top-0 z-40 border-b border-(--surface-navy-border) text-white shadow-lg">
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
            <span className="text-(--brand-accent)">VLU</span>
            <span className="text-white">RENTING</span>
          </h1>
          <p className="mt-2 whitespace-nowrap text-[12px] font-medium tracking-wide text-gray-300 opacity-90 2xl:text-[14px]">
            Trang web giúp sinh viên Văn Lang tìm kiếm nhà trọ phù hợp
          </p>
        </div>

        <div className="z-10 flex items-center gap-3 sm:gap-4">
          <ThemeToggleButton
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
            iconClassName="h-5 w-5"
          />

          {session ? (
            <>
              {canPostListing ? (
                <Link
                  href="/post"
                  className="group flex h-10 w-10 items-center justify-center gap-2 rounded-full bg-(--brand-accent) text-sm font-bold text-white shadow-md shadow-red-900/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-(--brand-accent-strong) hover:shadow-lg active:scale-95 md:w-auto md:px-5"
                  title="Đăng tin mới"
                >
                  <PlusIcon className="h-4 w-4 font-bold" />
                  <span className="hidden md:inline">Đăng tin</span>
                </Link>
              ) : null}

              {canUseChatAndNotif ? (
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
                    {unreadCount > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-(--brand-accent) px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-(--surface-navy-900)">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    ) : null}
                  </Link>
                </>
              ) : null}

              <div className="border-l border-white/10 pl-2">
                <UserMenu />
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void signIn()}
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
