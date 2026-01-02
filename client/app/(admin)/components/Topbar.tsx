"use client";

import {
  BellIcon,
  ChevronRightIcon,
  DotsHorizontalIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

function toTitle(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function Topbar() {
  const pathname = usePathname();
  const [q, setQ] = useState("");

  const breadcrumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const dashboardIndex = segments.indexOf("dashboard");
    const relevant = dashboardIndex >= 0 ? segments.slice(dashboardIndex) : segments;
    return ["Admin", ...relevant.map(toTitle)];
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
      <div className="flex items-center gap-4 px-6 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb} className="inline-flex items-center gap-1">
                {crumb}
                {index < breadcrumbs.length - 1 ? (
                  <ChevronRightIcon className="h-3.5 w-3.5 text-gray-400" />
                ) : null}
              </span>
            ))}
          </div>
          <div className="mt-1 text-lg font-semibold text-gray-900">Admin Console</div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative hidden md:block">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search users, listings..."
              className="w-[280px] rounded-xl border border-gray-200 bg-white px-10 py-2 text-sm outline-none ring-1 ring-transparent transition focus:border-gray-300 focus:ring-gray-900/10"
            />
          </div>

          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50">
            <BellIcon className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />
          </button>

          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 text-sm font-semibold text-white">
              AD
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-sm font-semibold text-gray-900">Admin</div>
              <div className="text-xs text-gray-500">admin@vlu.vn</div>
            </div>
            <DotsHorizontalIcon className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
