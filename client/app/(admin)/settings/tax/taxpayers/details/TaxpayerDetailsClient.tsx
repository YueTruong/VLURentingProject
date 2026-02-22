"use client";

import { useRouter } from "next/navigation";

type TaxpayerDetailsClientProps = {
  country: string;
  businessIdChoice: "yes" | "no";
};

export default function TaxpayerDetailsClient({ country, businessIdChoice }: TaxpayerDetailsClientProps) {
  const router = useRouter();
  const isBusinessFlow = businessIdChoice === "yes";

  return (
    <div className="min-h-screen bg-white text-[#222222]">
      <main className="mx-auto w-full px-6 py-6 lg:px-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/settings/tax/taxpayers?flow=VAT&country=VN")}
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#f3f4f6] px-6 text-[15px] font-semibold text-[#111827]"
          >
            Thoát
          </button>
        </div>

        <div className="mx-auto mt-6 w-full max-w-[740px] pb-40">
          <h1 className="text-[32px] font-semibold leading-[1.2] text-[#111827]">{isBusinessFlow ? "Thêm số ĐKKD" : "Thêm thông tin người nộp thuế"}</h1>
          <p className="mt-3 text-[14px] leading-7 text-[#4b5563]">
            {isBusinessFlow
              ? "Chúng tôi sẽ sử dụng thông tin này để xác định điều kiện khấu trừ thuế của bạn."
              : "Chúng tôi sẽ sử dụng thông tin này để hoàn tất hồ sơ thuế của bạn."}
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="text-[14px] font-semibold text-[#111827]">{isBusinessFlow ? "Tên của người nộp thuế hoặc doanh nghiệp" : "Tên người nộp thuế"}</label>
              <input
                placeholder={isBusinessFlow ? "Tên của người nộp thuế hoặc doanh nghiệp" : "Tên người nộp thuế"}
                className="mt-2 h-[56px] w-full rounded-xl border border-[#9ca3af] px-4 text-[16px] text-[#111827] outline-none placeholder:text-[#6b7280]"
              />
            </div>

            {isBusinessFlow ? (
              <div>
                <label className="text-[14px] font-semibold text-[#111827]">Số ĐKKD</label>
                <input
                  placeholder="Số ĐKKD"
                  className="mt-2 h-[56px] w-full rounded-xl border border-[#9ca3af] px-4 text-[16px] text-[#111827] outline-none placeholder:text-[#6b7280]"
                />
                <p className="mt-2 text-[13px] text-[#6b7280]">Nhập số đăng ký kinh doanh (ĐKKD) của bạn, gồm 10 chữ số.</p>
              </div>
            ) : null}

            <div>
              <p className="text-[14px] font-semibold text-[#111827]">Địa chỉ doanh nghiệp hoặc nơi cư trú</p>

              <button
                type="button"
                className="mt-2 flex h-[56px] w-full items-center justify-between rounded-xl border border-[#d1d5db] px-4 text-left"
              >
                <div>
                  <p className="text-[12px] text-[#6b7280]">Quốc gia/khu vực</p>
                  <p className="mt-0.5 text-[18px] leading-none text-[#111827]">{country}</p>
                </div>
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#111827]" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>

              <div className="mt-3 overflow-hidden rounded-2xl border border-[#9ca3af]">
                <input
                  placeholder="Địa chỉ đường/phố"
                  className="h-[56px] w-full border-b border-[#9ca3af] px-4 text-[16px] text-[#111827] outline-none placeholder:text-[#6b7280]"
                />
                <input
                  placeholder="Căn hộ, tầng, v.v. (nếu có)"
                  className="h-[56px] w-full border-b border-[#9ca3af] px-4 text-[16px] text-[#111827] outline-none placeholder:text-[#6b7280]"
                />
                <input
                  placeholder="Tên tòa nhà (nếu có)"
                  className="h-[56px] w-full border-b border-[#9ca3af] px-4 text-[16px] text-[#111827] outline-none placeholder:text-[#6b7280]"
                />
                <input
                  placeholder="Thành phố/quận/thị xã"
                  className="h-[56px] w-full border-b border-[#9ca3af] px-4 text-[16px] text-[#111827] outline-none placeholder:text-[#6b7280]"
                />
                <input
                  placeholder="Đô thị/tỉnh"
                  className="h-[56px] w-full border-b border-[#9ca3af] px-4 text-[16px] text-[#111827] outline-none placeholder:text-[#6b7280]"
                />
                <input
                  placeholder="Mã bưu chính"
                  className="h-[56px] w-full px-4 text-[16px] text-[#111827] outline-none placeholder:text-[#6b7280]"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-[#e5e7eb] bg-white">
        <div className="mx-auto flex h-[84px] w-full items-center justify-between px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.push("/settings/tax/taxpayers?flow=VAT&country=VN")}
            className="text-[16px] font-semibold text-[#111827]"
          >
            Quay lại
          </button>

          <button type="button" disabled className="rounded-xl bg-[#e5e7eb] px-8 py-3 text-[16px] font-semibold text-[#9ca3af]">
            Gửi
          </button>
        </div>
      </footer>
    </div>
  );
}
