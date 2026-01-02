"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import UserMenu from "@/app/homepage/components/UserMenu";

export default function UserTopBar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/VLU-Renting-Logo.svg" alt="VLU Renting" width={140} height={52} className="object-contain" />
          </Link>
          <div className="hidden sm:block text-xs text-gray-500">Trang web giúp sinh viên Văn Lang tìm nhà trọ phù hợp</div>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link
                href="/chat"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:scale-95"
                aria-label="Trò chuyện"
              >
                <Image src="/icons/Chat.svg" alt="Chat" width={22} height={22} />
              </Link>
              <Link
                href="/notifications"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 active:scale-95"
                aria-label="Thông báo"
              >
                <Image src="/icons/Notification.svg" alt="Thông báo" width={22} height={22} />
              </Link>
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
