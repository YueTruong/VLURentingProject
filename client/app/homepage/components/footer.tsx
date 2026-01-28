import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return(
    <footer className="w-full bg-[#010433] text-white px-4 py-6">
      <div className="max-w-full mx-auto px-6 flex flex-wrap items-center justify-between gap-6">

        {/* Left side (Logo + Copyright) */}
        <div className="flex flex-col space-y-4 ">
          <Image
            src="/images/VLU-Renting-Logo.svg"
            alt="VLU Renting Logo"
            width={187}
            height={57}
            className="object-contain"
          />

          <p className="text-sm text-gray-300">
            Copyright 2025 © VLU Renting. All Right Reserved
          </p>
        </div>

        {/* Right side (Links) */}
        <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
          <Link href="/terms" className="hover:text-red-400 transition">Điều khoản sử dụng</Link>
          <Link href="/privacy" className="hover:text-red-400 transition">Chính sách bảo mật</Link>
          <Link href="/user-policy" className="hover:text-red-400 transition">Chính sách người dùng</Link>
          <Link href="/feedback" className="hover:text-red-400 transition">Liên hệ</Link>
        </div>

      </div>
    </footer>
  );
}
