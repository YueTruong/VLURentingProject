"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import PrivacySettingsPanel from "../components/PrivacySettingsPanel";

type SidebarItem = {
  label: string;
  href?: string;
  active?: boolean;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SidebarNav({ items }: { items: SidebarItem[] }) {
  return (
    <nav>
      <ul className="space-y-1">
        {items.map((item) => {
          const baseClass = cn(
            "block rounded-md px-3 py-2.5 text-sm transition",
            item.active
              ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-900/60 dark:hover:text-gray-100",
          );

          return (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={baseClass}
                  aria-current={item.active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ) : (
                <button type="button" className={cn(baseClass, "w-full text-left")}>
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className="lg:sticky lg:top-8">
      <div className="hidden lg:block">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        <div className="mt-6">{children}</div>
      </div>

      <details className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 lg:hidden">
        <summary className="cursor-pointer list-none text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </summary>
        <div className="mt-4">{children}</div>
      </details>
    </aside>
  );
}

export default function PrivacySettingsPage() {
  const sidebarItems: SidebarItem[] = [
    { label: "Thông tin cá nhân", href: "/settings" },
    { label: "Đăng nhập và bảo mật", href: "/settings?tab=login-security" },
    { label: "Quyền riêng tư", href: "/settings/privacy", active: true },
    { label: "Thông báo" },
    { label: "Đối tác" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <main className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-14">
          <SidebarSection title="Cài đặt tài khoản">
            <SidebarNav items={sidebarItems} />
          </SidebarSection>
          <PrivacySettingsPanel />
        </div>
      </main>
    </div>
  );
}
