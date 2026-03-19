import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[color:var(--surface-navy-900)] px-4 py-6 text-white">
      <div className="max-w-full mx-auto flex flex-wrap items-center justify-between gap-6 px-6">
        <div className="flex flex-col space-y-4">
          <Image
            src="/images/VLU-Renting-Logo.svg"
            alt="VLU Renting Logo"
            width={187}
            height={57}
            className="object-contain"
          />

          <p className="text-sm text-gray-300">
            Copyright 2025 © VLURenting. All Right Reserved
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-sm font-medium">
          <Link href="/terms" className="transition hover:text-[color:var(--brand-accent)]">
            Điều khoản sử dụng
          </Link>
          <Link href="/privacy" className="transition hover:text-[color:var(--brand-accent)]">
            Chính sách bảo mật
          </Link>
          <Link href="/user-policy" className="transition hover:text-[color:var(--brand-accent)]">
            Chính sách người dùng
          </Link>
          <Link href="/feedback" className="transition hover:text-[color:var(--brand-accent)]">
            Liên hệ
          </Link>
        </div>
      </div>
    </footer>
  );
}