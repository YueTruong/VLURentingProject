"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Tab({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`relative pb-3 text-2xl font-semibold transition ${ active ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
    >
      {label}
      {active && (
        <span className="absolute left-0 -bottom-px h-[3px] w-full bg-blue-600 rounded-full" />
      )}
    </Link>
  );
}

export default function SettingsTabs() {
  return (
    <div className="flex items-end gap-10 border-b border-gray-200 px-10 pt-10">
      <Tab href="/settings" label="Thông tin" />
      <Tab href="/settings/password" label="Mật khẩu" />
    </div>
  );
}