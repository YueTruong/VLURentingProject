"use client";

import Image from "next/image";
import Link from "next/link";
import UserMenu from "@/app/homepage/components/UserMenu";
import ThemeToggleButton from "@/app/theme/ThemeToggleButton";

export default function Topbar() {
  const tagline =
    "Trang web gi\u00fap sinh vi\u00ean V\u0103n Lang t\u00ecm nh\u00e0 tr\u1ecd ph\u00f9 h\u1ee3p";

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/VLU-Renting-Logo.svg"
              alt="VLU Renting"
              width={140}
              height={52}
              className="object-contain"
              priority
            />
          </Link>
          <div className="hidden min-w-0 text-xs text-gray-500 lg:block">{tagline}</div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggleButton
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 active:scale-95"
            iconClassName="h-5 w-5"
          />
          <Link
            href="/chat"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 active:scale-95"
            aria-label="Chat"
          >
            <Image src="/icons/Chat.svg" alt="Chat" width={20} height={20} className="icon-adapt-dark" />
          </Link>
          <Link
            href="/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 active:scale-95"
            aria-label="Notifications"
          >
            <Image src="/icons/Notification.svg" alt="Notifications" width={20} height={20} className="icon-adapt-dark" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
          </Link>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
