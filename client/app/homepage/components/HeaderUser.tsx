"use client";

import Image from "next/image";
import Link from "next/link";
import UserMenu from "@/app/homepage/components/UserMenu";

function TopHeader() {
  return (
    <header className="w-full bg-[#010433] text-white relative z-20">
      <div className="w-full mx-auto flex items-center justify-between py-4 px-12 h-[100px]">
        <div className="shrink-0">
          <Image src="/images/VLU-Renting-Logo.svg" alt="VLU Renting" width={187} height={74} className="object-contain" />
        </div>

        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center hidden md:block">
          <h1 className="text-[42px] font-extrabold tracking-wide">
            <span className="text-white">VLU</span>{" "}
            <span className="text-[#D51F35]">Renting</span>
          </h1>
          <p className="text-[16px] text-gray-300 font-light -mt-1">
            Trang web giúp sinh viên Văn Lang tìm kiếm nhà trọ phù hợp
          </p>
        </div>

        <div className="flex gap-4">
          <Link
            href="/post"
            className="
              shrink-0 w-[100px] h-10 font-bold
              bg-black rounded-full flex items-center justify-center 
              transition-all duration-300 active:scale-95
            "
          >
            Đăng tin
          </Link>

          <Link
            href="/chat"
            className="
              shrink-0 w-[60px] h-10
              bg-white rounded-full flex items-center
              justify-center shadow-sm border border-gray-100
              transistion-all duration-300 active:scale-95 hover:bg-gray-100
            "
            aria-label="Trò chuyện"
          >
            <Image src="/icons/Chat.svg" alt="Chat" width={24} height={24} />
          </Link>

          <Link
            href="/notifications"
            className="
              shrink-0 w-[60px] h-10
              bg-white rounded-full flex items-center
              justify-center hover:bg-gray-100 shadow-sm border border-gray-100
              transistion-all duration-300 active:scale-95
            "
            aria-label="Thông báo"
          >
            <Image src="/icons/Notification.svg" alt="Thông báo" width={24} height={24} />
          </Link>

          <div className="ml-2">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  );
}

function SearchBar() {
  return (
    <div className="relative w-full h-[276px]">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/Background-Image.svg')" }}
      >
        <div className="absolute inset-0 bg-black/10" />
      </div>
    </div>
  );
}

export default function Header() {
  return (
    <div className="flex flex-col w-full">
      <TopHeader />
      <SearchBar />
    </div>
  );
}
