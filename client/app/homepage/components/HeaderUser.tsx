"use client";

import Image from "next/image";
import Link from "next/link";
import SelectBox from "@/app/homepage/components/SelectBox";
import UserMenu from "@/app/homepage/components/UserMenu";

const CAMPUS_OPTIONS = [
  { value: "cs1", label: "Cơ sở 1 (Nguyễn Khắc Nhu)" },
  { value: "cs2", label: "Cơ sở 2 (Phan Văn Trị)" },
  { value: "cs3", label: "Cơ sở 3 (Đặng Thùy Trâm)" },
];

const PRICE_OPTIONS = [
  { value: "duoi-3tr", label: "Dưới 3 triệu" },
  { value: "3tr-5tr", label: "3 triệu - 5 triệu" },
  { value: "tren-5tr", label: "Trên 5 triệu" },
];

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
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/Background-Image.svg')" }}>
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-6xl px-4">
        <form
          className="
            bg-white rounded-[10px] shadow-xl p-2
            flex flex-col md:flex-row items-center gap-2
            overflow-visible relative z-30
          "
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <div
            className="
              flex-1 flex items-center px-4 w-full h-12
              border-b md:border-b-0 md:border-r border-gray-200
            "
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 mr-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm nhà trọ ..."
              className="w-full outline-none text-gray-700 placeholder-gray-500 bg-transparent"
            />
          </div>

          <SelectBox icon="📍" placeholder="Chọn cơ sở" options={CAMPUS_OPTIONS} />
          <SelectBox icon="💰" placeholder="Chọn giá tiền" options={PRICE_OPTIONS} />

          <button
            type="submit"
            className="
              bg-[#D51F35] text-white
              px-8 h-12 rounded-[10px]
              font-bold shadow-md
              hover:bg-[#b01628] transition-all duration-300 ease-in-out active:scale-95  
              w-full md:w-auto
            "
          >
            Search
          </button>
        </form>
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
