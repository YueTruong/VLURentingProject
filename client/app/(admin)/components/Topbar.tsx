"use client";

import { useMemo, useState } from "react";

export default function Topbar() {
  const [q, setQ] = useState("");
  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric"});
  }, []);

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-2xl">
      <div className="flex items-center gap-3 px-6 py-4">
        <div className="min-w-9 flex-1">
          <div className="text-sm text-gray-500">{today}</div>
          <div className="text-lg font-semibold">Welcome back👋</div>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          <div className="relative">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search users, listings..."
              className="w-[320px]  rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-non focus:ring-2 focus:ring-gray-900/10"
            />
            {/* <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              ⌘K
            </div> */}
          </div>

          <button className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
            Export
          </button>
          <button className="rounded-xl bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800">
            New
          </button>
        </div>
      </div>
    </header>
  );
}