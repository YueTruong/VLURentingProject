"use client";

import Image from "next/image";
import Link from "next/link";
import { PersonIcon } from "@radix-ui/react-icons";
import ThemeToggleButton from "@/app/theme/ThemeToggleButton";

// 2. Sub-component: TopHeader
function TopHeader() {
  return (
    <header className="relative z-50 w-full border-b border-(--surface-navy-border) text-white shadow-lg">
      {/* Background Gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(to right, var(--surface-navy-900), var(--surface-navy-800), var(--surface-navy-700))",
        }}
      />

      {/* Container: w-full để tràn màn hình, px-6 để đẩy sát biên hơn */}
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
        {/* Logic: 
            - xl (Laptop): Hiện tiêu đề to, Slogan chữ nhỏ.
            - 2xl (PC lớn): Hiện đầy đủ thoải mái.
            - hidden: Ẩn trên tablet/mobile.
        */}
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 text-center xl:block z-0 pointer-events-none">
          <h1 className="text-[36px] 2xl:text-[42px] font-extrabold leading-none tracking-tight drop-shadow-lg whitespace-nowrap">
            <span className="text-(--brand-accent)">VLU</span>
            <span className="text-white">RENTING</span>
          </h1>
          {/* Dòng slogan dài: Chỉ hiện trên màn hình > 1280px, chỉnh font nhỏ lại chút để vừa vặn */}
          <p className="mt-2 text-[12px] 2xl:text-[14px] font-medium text-gray-300 tracking-wide opacity-90 whitespace-nowrap">
            Trang web giúp sinh viên Văn Lang tìm kiếm nhà trọ phù hợp
          </p>
        </div>

        {/* === RIGHT: ACTIONS === */}
        <div className="z-10 shrink-0 flex items-center gap-3">
          <ThemeToggleButton
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            iconClassName="h-5 w-5"
          />
          <Link
            href="/login"
            className="
              group relative flex h-10 sm:h-11 w-[130px] sm:w-[150px] items-center justify-center gap-2.5 
              rounded-full bg-[#ffffff] text-[#010433]
              font-bold text-xs sm:text-sm shadow-md transition-all duration-300
              hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:-translate-y-0.5
              active:scale-95
            "
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e6ebff] text-[#010433] transition-colors group-hover:bg-(--brand-accent) group-hover:text-white">
              <PersonIcon className="h-4 w-4" />
            </div>
              <span>Thành viên</span>
          </Link>
        </div>

      </div>
    </header>
  );
}

// 3. Sub-component: SearchBar
function SearchBar() {
  return (
    <div className="relative w-full h-[200px] sm:h-60 md:h-[280px] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
        style={{ backgroundImage: "url('/images/Background-Image.svg')" }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "linear-gradient(to top, var(--surface-navy-overlay), transparent)" }}
        />
      </div>
    </div>
  );
}

// 4. Header chính
export default function Header() {
  return (
    <div className="flex flex-col w-full shadow-2xl">
      <TopHeader />
      <SearchBar />
    </div>
  );
}
