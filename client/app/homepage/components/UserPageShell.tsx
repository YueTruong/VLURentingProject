"use client";

import { ReactNode } from "react";
import UserTopBar from "@/app/homepage/components/UserTopBar";

type UserPageShellProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function UserPageShell({ title, description, actions, children }: UserPageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <UserTopBar />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-r from-[#010433] via-[#0a0f55] to-[#111827] text-white">
          <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #D51F35 0, transparent 25%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.2) 0, transparent 35%)" }} />
          <div className="container relative mx-auto px-4 py-12 flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-gray-200">
                User menu
              </span>
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">{title}</h1>
              <p className="text-base text-gray-200 md:text-lg">{description}</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gray-100">
                  Luồng người dùng
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gray-100">
                  Cập nhật thời gian thực
                </span>
              </div>
            </div>
            {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
          </div>
        </section>

        <section className="container mx-auto px-4 pt-10 pb-14">
          {children}
        </section>
      </main>
    </div>
  );
}
