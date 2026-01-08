import Image from "next/image";
import Link from "next/link";

// 2. Sub-component: TopHeader
function TopHeader() {
  return (
    <header className="w-full bg-[#010433] text-white relative z-20">
      <div className="w-full mx-auto flex items-center justify-between py-4 px-12 h-[100px]">
        {/* Logo */}
        <div className="shrink-0">
          <Image
            src="/images/VLU-Renting-Logo.svg"
            alt="VLU Renting"
            width={187}
            height={74}
            className="object-contain"
          />
        </div>

        {/* Title */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center hidden md:block">
          <h1 className="text-[42px] font-extrabold tracking-wide">
            <span className="text-white">VLU</span>{" "}
            <span className="text-[#D51F35]">Renting</span>
          </h1>
          <p className="text-[16px] text-gray-300 font-light -mt-1">
            Trang web giúp sinh viên Văn Lang tìm kiếm nhà trọ phù hợp
          </p>
        </div>

        {/* Login button */}
        <Link href="/login">
          <button
            type="button"
            className="
              shrink-0 w-[140px] h-10 
              bg-white text-black rounded-full 
              flex items-center justify-center gap-2 
              font-semibold text-sm shadow-md 
              hover:bg-gray-100 transition-all active:scale-95
            "
          >
            <div className="w-5 h-5 relative">
              <Image
                src="/icons/UserIcon.svg"
                alt="user"
                fill
                className="object-contain"
              />
            </div>
            Thành viên
          </button>
        </Link>
      </div>
    </header>
  );
}

// 3. Sub-component: SearchBar
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

// 4. Header chính
export default function Header() {
  return (
    <div className="flex flex-col w-full">
      <TopHeader />
      <SearchBar />
    </div>
  );
}
