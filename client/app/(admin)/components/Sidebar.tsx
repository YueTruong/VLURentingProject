"use client";

import {
  ArrowLeftIcon,
  BarChartIcon,
  FileTextIcon,
  HomeIcon,
  PersonIcon,
  PieChartIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type NavItem = { href: string; label: string; icon: ReactNode };

const nav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <BarChartIcon className="h-4 w-4" /> },
  { href: "/dashboard/analytics", label: "Analytics", icon: <PieChartIcon className="h-4 w-4" /> },
  { href: "/dashboard/users", label: "Users", icon: <PersonIcon className="h-4 w-4" /> },
  { href: "/dashboard/listings", label: "Listings", icon: <HomeIcon className="h-4 w-4" /> },
  { href: "/dashboard/properties", label: "Properties", icon: <FileTextIcon className="h-4 w-4" /> },
];

function NavLink({ href, label, icon, active }: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-gray-900 text-white shadow-sm ring-1 ring-gray-800"
          : "text-gray-700 hover:bg-gray-100",
      ].join(" ")}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const activeHref =
    nav.reduce<string | null>((match, item) => {
      const isActive =
        pathname === item.href ||
        pathname === `${item.href}/` ||
        pathname.startsWith(`${item.href}/`);

      if (!isActive) return match;
      return !match || item.href.length > match.length ? item.href : match;
    }, null) ?? "";

  return (
    <aside className="sticky top-0 h-screen w-[260px] border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col p-5">
        <div className="rounded-2xl bg-gray-900 px-4 py-3 text-white shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-200/80">Admin Panel</div>
          <div className="text-base font-semibold">VLU Renting</div>
        </div>

        <nav className="mt-6 space-y-1">
          {nav.map((item) => (
            <NavLink key={item.href} {...item} active={item.href === activeHref} />
          ))}
        </nav>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-gray-500">Quick tip</div>
          <div className="mt-2 text-sm font-medium text-gray-900">Connect analytics API later</div>
          <p className="mt-1 text-xs text-gray-500">
            UI is ready for SWR/React Query - just wire the endpoints.
          </p>
        </div>

        <div className="mt-auto pt-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to site</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
