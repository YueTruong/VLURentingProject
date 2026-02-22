"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TaxpayersClientProps = {
  country: string;
};

export default function TaxpayersClient({ country }: TaxpayersClientProps) {
  const router = useRouter();
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [businessIdChoice, setBusinessIdChoice] = useState<"yes" | "no" | null>(null);
  const canContinue = businessIdChoice !== null;

  return (
    <div className="min-h-screen bg-white text-[#222222]">
      <main className="mx-auto w-full px-6 py-6 lg:px-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsExitDialogOpen(true)}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#f3f4f6] px-6 text-[15px] font-semibold text-[#111827]"
          >
            Thoát
          </button>
        </div>

        <div className="mx-auto mt-6 w-full max-w-[740px] pb-40">
          <h1 className="text-[32px] font-semibold leading-[1.2] text-[#111827]">Chọn quốc gia hoặc khu vực</h1>
          <p className="mt-3 text-[14px] leading-7 text-[#4b5563]">
            Hãy cho chúng tôi biết nơi bạn đăng ký mã số thuế GTGT, mã số thuế GST hoặc mã số thuế tương đương thuế GTGT.
          </p>

          <button type="button" className="mt-6 flex w-full items-center justify-between rounded-2xl border border-[#d1d5db] px-5 py-3 text-left">
            <div>
              <p className="text-[14px] text-[#6b7280]">Quốc gia/khu vực</p>
              <p className="mt-1 text-[18px] leading-none text-[#111827]">{country}</p>
            </div>
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#111827]" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <h2 className="mt-8 text-[30px] font-semibold text-[#111827]">Bạn có số ĐKKD không?</h2>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={() => setBusinessIdChoice("yes")}
              className={`w-full rounded-2xl px-5 py-3.5 text-left text-[18px] font-normal text-[#111827] transition-transform duration-100 active:translate-y-[1px] active:scale-[0.995] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)] ${
                businessIdChoice === "yes" ? "border-2 border-[#111827]" : "border border-[#d1d5db]"
              } focus:outline-none`}
            >
              Có
            </button>
            <button
              type="button"
              onClick={() => setBusinessIdChoice("no")}
              className={`w-full rounded-2xl px-5 py-3.5 text-left text-[18px] font-normal text-[#111827] transition-transform duration-100 active:translate-y-[1px] active:scale-[0.995] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.12)] ${
                businessIdChoice === "no" ? "border-2 border-[#111827]" : "border border-[#d1d5db]"
              } focus:outline-none`}
            >
              Không
            </button>
          </div>

          <p className="mt-3 text-[14px] leading-7 text-[#4b5563]">
            Thêm số ĐKKD để đảm bảo không bị khấu trừ thuế đối với thu nhập từ hoạt động kinh doanh của bạn.
            <span className="ml-1 font-semibold underline underline-offset-4 text-[#111827]">Tìm hiểu thêm</span>
          </p>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-[#e5e7eb] bg-white">
        <div className="mx-auto flex h-[84px] w-full items-center justify-end px-6 lg:px-8">
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => {
              if (!businessIdChoice) return;
              router.push(`/settings/tax/taxpayers/details?flow=VAT&country=VN&business=${businessIdChoice}`);
            }}
            className={`rounded-xl px-8 py-3 text-[16px] font-semibold transition ${
              canContinue ? "bg-[#111827] text-white hover:bg-[#000000]" : "bg-[#e5e7eb] text-[#9ca3af]"
            }`}
          >
            Tiếp theo
          </button>
        </div>
      </footer>

      {isExitDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Đóng xác nhận thoát"
            onClick={() => setIsExitDialogOpen(false)}
            className="absolute inset-0 bg-black/45"
          />

          <div className="relative w-full max-w-[560px] rounded-[28px] bg-white shadow-2xl">
            <div className="px-6 pb-5 pt-5">
              <button
                type="button"
                onClick={() => setIsExitDialogOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#111827] hover:bg-[#f3f4f6]"
                aria-label="Đóng"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>

              <h3 className="mt-2 text-[30px] font-semibold leading-[1.2] text-[#111827]">Bạn có chắc chắn muốn thoát không?</h3>
              <p className="mt-3 text-[14px] leading-7 text-[#4b5563]">
                Bạn chưa thêm mã số thuế GTGT, mã số thuế GST hoặc mã số thuế tương đương thuế GTGT. Điều này có thể ảnh hưởng đến việc khấu trừ thuế của bạn.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-[#e5e7eb] px-6 py-4">
              <button type="button" onClick={() => setIsExitDialogOpen(false)} className="text-[16px] font-semibold text-[#111827]">
                Hủy
              </button>
              <button
                type="button"
                onClick={() => router.push("/settings/tax")}
                className="rounded-2xl bg-[#111827] px-5 py-2.5 text-[16px] font-semibold text-white"
              >
                Có, hãy thoát
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
