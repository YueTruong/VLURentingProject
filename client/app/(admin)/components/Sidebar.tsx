"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { href: string; label: string; icon?: string };

const nav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "📊"},
  { href: "/dashboard/analytics", label: "Analytics", icon: "📈" },
  { href: "/dashboard/users", label: "Users", icon: "👤" },
  { href: "/dashboard/properties", label: "Properties", icon: "🏠" },  
];

function NavLink({ href, label, icon }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-gray-900 text-white shadow-sm"
          : "text-gray-700 hover:bg-gray-100",
      ].join(" ")}
    >
      <span className="text-base">{icon ?? "•"}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="sticky top-0 h-screen w-[260px] border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col p-5">
        
        <div className="rounded-2xl bg-gray-900 px-4 py-3 text-white">
          <div className="text-sm opacity-80">Admin Panel</div>
          <div className="text-base font-semibold">VLU Renting</div>
        </div>

        <nav className="mt-5 space-y-1">
          {nav.map((it) => (
            <NavLink key={it.href} {...it} />
          ))}
        </nav>

        <div className="mt-6 rounded-2xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500">Quick tip</div>
          <div className="mt-1 text-sm font-medium">
            Thay API vào sau
          </div>
        </div>

        <div className="mt-auto pt-4">
          <Link
            href="/loggedhomepage"
            className="flex items-center rounded-xl px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            <span className="text-base text-red-600">←</span>
            <span className="flex-1 text-center">Home</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
