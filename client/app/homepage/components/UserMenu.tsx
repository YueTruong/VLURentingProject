"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}

function Icon({ 
  children, 
  danger = false 
}: { 
  children: React.ReactNode; 
  danger?: boolean; 
}) {
  return (
    <span className={`grid h-9 w-9 place-items-center rounded-xl ${ danger ? "bg-gray-100 text-red-600" : "bg-gray-100 text-gray-800"}`}>
      {children}
    </span>
  );
}

function MenuItem({
  href,
  label,
  icon,
  onClick,
  danger,
}: {
  href?: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const base =
    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition hover:bg-gray-50 active:scale-[0.99]";
  const text = danger ? "text-red-600" : "text-gray-900";

  const content = (
    <>
      <Icon danger={danger}>{icon}</Icon>
      <span className={`flex-1 text-sm font-medium ${text}`}>{label}</span>
      <ChevronRight />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={base} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={base} onClick={onClick}>
      {content}
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-100/70">
      {children}
    </div>
  );
}

export default function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  if (!session) return null;

  const userImage = session.user?.image || "/images/Admins.png";
  const userName = session.user?.name || "User";

  return (
    <div className="relative" ref={menuRef}>
      {/* Nút Avatar (giữ như bạn đang dùng) */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 border border-gray-300 rounded-full p-1 pl-3 hover:shadow-md transition active:scale-95"
      >
        <div className="w-8 h-8 relative rounded-full overflow-hidden border border-gray-200">
          <Image src={userImage} alt="Avatar" fill className="object-cover" />
        </div>

        <span className="text-sm font-semibold hidden md:block">{userName}</span>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-4 h-4 text-gray-500 mr-1 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Panel menu kiểu trong ảnh */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[320px] max-w-[90vw] rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden z-50">
          {/* Header user */}
          <div className="px-6 pt-6 pb-4 flex flex-col items-center">
            <div className="relative h-16 w-16 rounded-full overflow-hidden ring-4 ring-white shadow-sm">
              <Image src={userImage} alt="Avatar" fill className="object-cover" />
            </div>

            <div className="mt-3 text-center">
              <p className="text-base font-bold text-gray-900">{userName}</p>
              {session.user?.email && (
                <p className="text-xs text-gray-500 mt-1 truncate max-w-[260px]">{session.user.email}</p>
              )}
            </div>

            <div className="mt-4 h-px w-full bg-gray-200" />
          </div>

          {/* Section: Tiện ích */}
          <SectionTitle>Tiện ích</SectionTitle>
          <div className="p-2">
            <MenuItem
              href="/dashboard"
              label="Dashboard"
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm10 8h8V11h-8v10zM3 21h8v-6H3v6zm10-10h8V3h-8v8z" />
                </svg>
              }
              onClick={() => setIsOpen(false)}
            />
          </div>

          {/* Section: Tiện ích (list) */}
          <SectionTitle>Tiện ích</SectionTitle>
          <div className="p-2">
            <MenuItem
              href="/favorites"
              label="Yêu thích"
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              }
              onClick={() => setIsOpen(false)}
            />
            <MenuItem
              href="/my-reviews"
              label="Đánh giá từ tôi"
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
                </svg>
              }
              onClick={() => setIsOpen(false)}
            />
          </div>

          {/* Section: Khác */}
          <SectionTitle>Khác</SectionTitle>
          <div className="p-2">
            <MenuItem
              href="/settings"
              label="Tài khoản"
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 10-16 0" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 13a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              }
              onClick={() => setIsOpen(false)}
            />
            <MenuItem
              href="/feedback"
              label="Đóng góp ý kiến"
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a4 4 0 01-4 4H7l-4 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
                </svg>
              }
              onClick={() => setIsOpen(false)}
            />

            <div className="my-1 h-px bg-gray-100" />

            <MenuItem
              label="Đăng xuất"
              danger
              icon={
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 17l5-5-5-5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12H9" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19H6a3 3 0 01-3-3V8a3 3 0 013-3h6" />
                </svg>
              }
              onClick={() => signOut({ callbackUrl: "/" })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
