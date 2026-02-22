"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import UserTopBar from "@/app/homepage/components/UserTopBar";
import PostWizard from "./PostWizard";

const TAX_UPDATE_URL = "/settings/tax";

export default function PostPage() {
  const router = useRouter();
  const [showTaxPrompt, setShowTaxPrompt] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <UserTopBar />
      <PostWizard />

      {showTaxPrompt ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 px-4">
          <div className="relative w-full max-w-[520px] rounded-[30px] bg-white px-8 pb-8 pt-12 shadow-xl sm:px-10">
            <button
              type="button"
              onClick={() => setShowTaxPrompt(false)}
              aria-label="Đóng thông báo"
              className="absolute right-6 top-6 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#111827] hover:bg-[#f3f4f6]"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <p className="text-center text-sm text-gray-500">Cần cung cấp cho mục đích khấu trừ thuế</p>

            <div className="mt-6 flex justify-center">
              <div className="relative h-[116px] w-[116px]">
                <Image src="/images/House.svg" alt="Tax update" fill className="object-contain" />
              </div>
            </div>

            <h2 className="mt-5 text-center text-2xl font-semibold leading-snug text-[#111827] sm:text-[28px]">
              Cập nhật thông tin của bạn cho mục đích khấu trừ thuế
            </h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-gray-600 sm:text-base">
              Thêm số đăng ký kinh doanh (ĐKKD) để đảm bảo không bị khấu trừ thuế đối với thu nhập từ hoạt động kinh doanh của bạn.
            </p>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => router.push(TAX_UPDATE_URL)}
                className="inline-flex min-w-[260px] items-center justify-center rounded-2xl bg-[#111827] px-7 py-3.5 text-base font-semibold text-white hover:bg-black"
              >
                Cập nhật thông tin thuế
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}


