"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import UserTopBar from "@/app/homepage/components/UserTopBar";
import PostWizard from "./PostWizard";

const TAX_UPDATE_URL = "/settings/tax";

export default function PostPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <UserTopBar />
      <PostWizard />

      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/35 px-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tax-update-title"
          className="relative w-full max-w-[520px] rounded-[30px] bg-white px-8 pb-8 pt-12 shadow-xl sm:px-10"
        >
          <p className="text-center text-sm text-gray-500">Cần cung cấp cho mục đích khấu trừ thuế</p>

          <div className="mt-6 flex justify-center">
            <div className="relative h-[116px] w-[116px]">
              <Image src="/images/House.svg" alt="Tax update" fill className="object-contain" />
            </div>
          </div>

          <h2
            id="tax-update-title"
            className="mt-5 text-center text-2xl font-semibold leading-snug text-[#111827] sm:text-[28px]"
          >
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
    </div>
  );
}
