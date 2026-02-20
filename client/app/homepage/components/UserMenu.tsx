"use client";

import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTheme } from "@/app/theme/ThemeProvider";

type SessionUser = {
  image?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string;
};

const VERIFICATION_KEY = "vlu.landlord.verified";

function readVerificationFlag() {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(VERIFICATION_KEY) === "true";
}

function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-(--theme-text-subtle)"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.5M12 18.5V21M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M3 12h2.5M18.5 12H21M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77"
      />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 14.5A8.5 8.5 0 019.5 3a7 7 0 1011.5 11.5z"
      />
    </svg>
  );
}

function Icon({ children, danger = false }: { children: ReactNode; danger?: boolean }) {
  return (
    <span
      className={`grid h-9 w-9 place-items-center rounded-xl ${
        danger
          ? "bg-(--brand-accent-soft) text-(--brand-accent)"
          : "bg-(--theme-surface-muted) text-(--theme-text)"
      }`}
    >
      {children}
    </span>
  );
}

type MenuItemProps = {
  href?: string;
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  danger?: boolean;
};

function MenuItem({ href, label, icon, onClick, danger }: MenuItemProps) {
  const base =
    "flex w-full items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-[color:var(--theme-surface-muted)] active:scale-[0.99]";
  const text = danger ? "text-[color:var(--brand-accent)]" : "text-[color:var(--theme-text)]";

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

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="bg-(--theme-surface-muted) px-4 py-2 text-xs font-semibold uppercase tracking-wider text-(--theme-text-subtle)">
      {children}
    </div>
  );
}

export default function UserMenu() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean>(() => readVerificationFlag());
  const menuRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  useEffect(() => {
    const syncVerifiedState = (event: StorageEvent) => {
      if (event.key !== VERIFICATION_KEY) {
        return;
      }
      setIsVerified(readVerificationFlag());
    };

    window.addEventListener("storage", syncVerifiedState);
    return () => {
      window.removeEventListener("storage", syncVerifiedState);
    };
  }, []);

  if (!session) {
    return null;
  }

  const user = (session.user ?? {}) as SessionUser;
  const userImage = user.image || "/images/Admins.png";
  const userName = user.name || "User";
  const roleKey = (user.role ?? "student").toLowerCase();
  const roleLabelMap: Record<string, string> = {
    admin: "Admin",
    landlord: "Chủ trọ",
    student: "Sinh viên",
  };
  const roleLabel = roleLabelMap[roleKey] ?? "Người dùng";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => {
          setIsVerified(readVerificationFlag());
          setIsOpen((value) => !value);
        }}
        className="flex items-center gap-2 rounded-full border border-(--theme-border) bg-(--theme-surface) p-1 pl-3 text-(--theme-text) transition hover:shadow-md active:scale-95"
      >
        <div className="relative h-8 w-8 overflow-hidden rounded-full border border-(--theme-border)">
          <Image src={userImage} alt="Avatar" fill className="object-cover" />
        </div>

        <span className="hidden items-center gap-1 text-sm font-semibold md:flex">
          {userName}
          {isVerified ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v6c0 4.418-3 7-7 8-4-1-7-3.582-7-8V7l7-4z" />
            </svg>
          ) : null}
        </span>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`mr-1 h-4 w-4 text-(--theme-text-subtle) transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-3 max-h-[calc(100vh-96px)] w-[320px] max-w-[90vw] overflow-hidden rounded-2xl border border-(--theme-border) bg-(--theme-surface) text-(--theme-text) shadow-2xl">
          <div className="flex max-h-[calc(100vh-96px)] flex-col">
            <div className="flex flex-col items-center px-6 pb-4 pt-6">
              <div className="relative h-16 w-16 overflow-hidden rounded-full ring-4 ring-(--theme-surface) shadow-sm">
                <Image src={userImage} alt="Avatar" fill className="object-cover" />
              </div>

              <div className="mt-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-sm font-bold text-(--theme-text)">{userName}</p>
                  <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-(--theme-border) bg-(--theme-surface-muted) px-2.5 py-1 text-xs font-semibold text-(--theme-text-muted)">
                    {roleLabel}
                  </span>
                </div>

                {user.email ? (
                  <p className="mt-1 max-w-[260px] truncate text-xs text-(--theme-text-muted)">{user.email}</p>
                ) : null}

                {isVerified ? (
                  <div className="mt-2 flex justify-center">
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-300/70 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-500">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v6c0 4.418-3 7-7 8-4-1-7-3.582-7-8V7l7-4z" />
                      </svg>
                      Đã xác minh
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 h-px w-full bg-(--theme-border)" />
            </div>

            <div className="flex-1 overflow-y-auto">
              <SectionTitle>Tài khoản</SectionTitle>
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
                <MenuItem
                  href="/my-posts"
                  label="Tin của tôi"
                  icon={
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
                    </svg>
                  }
                  onClick={() => setIsOpen(false)}
                />
                <MenuItem
                  href="/landlord-verification"
                  label="Xác minh chủ trọ"
                  icon={
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v6c0 4.418-3 7-7 8-4-1-7-3.582-7-8V7l7-4z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                    </svg>
                  }
                  onClick={() => setIsOpen(false)}
                />
              </div>

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
                <MenuItem
                  href="/contracts"
                  label="Hợp đồng thuê"
                  icon={
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17h6" />
                    </svg>
                  }
                  onClick={() => setIsOpen(false)}
                />
                <MenuItem
                  href="/roommate-management"
                  label="Quản lý ở ghép"
                  icon={
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 11a4 4 0 100-8 4 4 0 000 8z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M23 20v-2a4 4 0 00-3-3.87" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  }
                  onClick={() => setIsOpen(false)}
                />
                <MenuItem
                  href="/post"
                  label="Đăng tin"
                  icon={
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 11a4 4 0 100-8 4 4 0 000 8z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M23 20v-2a4 4 0 00-3-3.87" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                  }
                  onClick={() => setIsOpen(false)}
                />
                <MenuItem
                  href="/contract-sign"
                  label="Ký hợp đồng"
                  icon={
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l2 2 4-4" />
                    </svg>
                  }
                  onClick={() => setIsOpen(false)}
                />
              </div>

              <SectionTitle>Khác</SectionTitle>
              <div className="p-2">
                <MenuItem
                  href="/profile"
                  label="Thông tin cá nhân"
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

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 transition hover:bg-(--theme-surface-muted) active:scale-[0.99]"
                  onClick={toggleTheme}
                >
                  <Icon>{isDark ? <SunIcon /> : <MoonIcon />}</Icon>
                  <span className="flex-1 text-left text-sm font-medium text-(--theme-text)">Giao diện</span>
                  <span className="text-xs font-semibold text-(--theme-text-subtle)">{isDark ? "Tối" : "Sáng"}</span>
                </button>

                <div className="my-1 h-px bg-(--theme-border)" />

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
          </div>
        </div>
      ) : null}
    </div>
  );
}
