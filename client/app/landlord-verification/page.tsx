"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import UserPageShell from "@/app/homepage/components/UserPageShell";

type VerificationStatus = "not_submitted" | "pending" | "verified";

type VerificationForm = {
  fullName: string;
  phone: string;
  email: string;
  idNumber: string;
  ownershipType: string;
  propertyAddress: string;
  bankAccount: string;
};

type ConsentState = {
  accuracy: boolean;
  terms: boolean;
  privacy: boolean;
  sensitive: boolean;
};

const statusConfig: Record<
  VerificationStatus,
  { label: string; tone: string; description: string }
> = {
  not_submitted: {
    label: "Chưa gửi hồ sơ",
    tone: "bg-gray-100 text-(--theme-text-muted)",
    description: "Bạn cần hoàn tất hồ sơ để nhận huy hiệu chủ trọ đã xác minh.",
  },
  pending: {
    label: "Đang duyệt",
    tone: "bg-yellow-100 text-yellow-800",
    description: "Hồ sơ đang được kiểm tra. Thời gian dự kiến 1-3 ngày làm việc.",
  },
  verified: {
    label: "Đã xác minh",
    tone: "bg-green-100 text-green-800",
    description: "Hồ sơ hợp lệ. Huy hiệu xác minh đã được hiển thị trên tin đăng.",
  },
};

const VERIFICATION_STORAGE_KEY = "vlu.landlord.verified";
const VERIFICATION_PENDING_KEY = "vlu.landlord.pending";

export default function LandlordVerificationPage() {
  const [status, setStatus] = useState<VerificationStatus>(() => {
    if (typeof window === "undefined") return "not_submitted";
    const verified = localStorage.getItem(VERIFICATION_STORAGE_KEY) === "true";
    if (verified) return "verified";
    const pending = localStorage.getItem(VERIFICATION_PENDING_KEY) === "true";
    if (pending) return "pending";
    return "not_submitted";
  });
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [otpSentAt, setOtpSentAt] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [consents, setConsents] = useState<ConsentState>({
    accuracy: false,
    terms: false,
    privacy: false,
    sensitive: false,
  });
  const [form, setForm] = useState<VerificationForm>({
    fullName: "",
    phone: "",
    email: "",
    idNumber: "",
    ownershipType: "owner",
    propertyAddress: "",
    bankAccount: "",
  });


  const statusInfo = statusConfig[status];
  const allConsented = useMemo(() => Object.values(consents).every(Boolean), [consents]);
  const canSendOtp = form.phone.trim().length > 0;
  const canVerifyOtp = otpCode.trim().length >= 4;
  const isReady = useMemo(
    () =>
      form.fullName.trim().length > 1 &&
      form.phone.trim().length > 0 &&
      form.email.trim().length > 0 &&
      form.idNumber.trim().length > 0 &&
      form.propertyAddress.trim().length > 5 &&
      otpVerified &&
      allConsented,
    [form, otpVerified, allConsented]
  );

  const handleSendOtp = () => {
    if (!canSendOtp) return;
    setOtpSentAt(new Date().toLocaleString("vi-VN"));
    setOtpVerified(false);
    setOtpError(null);
  };

  const handleVerifyOtp = () => {
    if (!canVerifyOtp) {
      setOtpError("Vui lòng nhập mã OTP hợp lệ.");
      return;
    }
    setOtpVerified(true);
    setOtpError(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isReady) return;
    localStorage.setItem(VERIFICATION_PENDING_KEY, "true");
    localStorage.removeItem(VERIFICATION_STORAGE_KEY);
    setStatus("pending");
    setSubmittedAt(new Date().toLocaleString("vi-VN"));
  };

  return (
    <UserPageShell
      title="Xác minh chủ trọ"
      description="Hoàn tất hồ sơ xác minh để tăng độ tin cậy và ưu tiên hiển thị tin đăng."
      eyebrow="Chủ trọ"
      actions={
        <span className="rounded-full bg-(--theme-surface)/10 px-4 py-2 text-xs font-semibold text-white">
          {statusInfo.label}
        </span>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-5 shadow-sm lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-(--theme-text)">Trạng thái hồ sơ</h2>
                <p className="text-sm text-(--theme-text-muted)">{statusInfo.description}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.tone}`}>
                {statusInfo.label}
              </span>
            </div>
            {submittedAt && (
              <div className="mt-3 text-xs text-(--theme-text-subtle)">Gửi hồ sơ lúc: {submittedAt}</div>
            )}
            {status !== "verified" && (
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem(VERIFICATION_STORAGE_KEY, "true");
                  localStorage.removeItem(VERIFICATION_PENDING_KEY);
                  setStatus("verified");
                }}
                className="mt-4 rounded-full border border-(--theme-border) bg-(--theme-surface-muted) px-4 py-2 text-xs font-semibold text-(--theme-text-muted) hover:bg-gray-100"
              >
                Giả lập duyệt thành công
              </button>
            )}
            <div className="mt-4 rounded-xl border border-dashed border-(--theme-border) bg-(--theme-surface-muted) p-4 text-xs text-(--theme-text-muted)">
              VLU Renting là nền tảng trung gian kết nối người thuê và chủ trọ. Thông tin xác minh chỉ phục
              vụ kiểm duyệt nội bộ, không công khai cho người thuê. Người đăng tin chịu trách nhiệm về tính
              chính xác của nội dung đăng tải.
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-(--theme-text-muted)">
                <Link href="/terms" className="hover:text-(--brand-accent)">
                  Điều khoản sử dụng
                </Link>
                <span>•</span>
                <Link href="/privacy" className="hover:text-(--brand-accent)">
                  Chính sách bảo mật
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-(--theme-text)">Thông tin bắt buộc trước khi đăng tin</h3>
              <ul className="mt-3 space-y-2 text-sm text-(--theme-text-muted)">
                {[
                  "Họ tên, số điện thoại (xác thực OTP), email",
                  "Địa chỉ phòng, giá thuê, diện tích",
                  "Mô tả chi tiết và hình ảnh thực tế",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-(--brand-accent)" />
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-xs text-(--theme-text-subtle)">
                Nội dung tin đăng sẽ hiển thị công khai, vui lòng đảm bảo chính xác.
              </div>
            </div>

            <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-(--theme-text)">Giấy tờ xác minh (khi cần)</h3>
              <ul className="mt-3 space-y-2 text-sm text-(--theme-text-muted)">
                {[
                  "CCCD/CMND (mặt trước & mặt sau)",
                  "Giấy tờ chứng minh quyền sở hữu/ủy quyền",
                  "Ảnh phòng cho thuê rõ ràng",
                  "Thông tin liên hệ chính chủ",
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1 h-2 w-2 rounded-full bg-(--brand-accent)" />
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-xs text-(--theme-text-subtle)">
                Giấy tờ chỉ phục vụ kiểm duyệt nội bộ, không công khai cho người thuê.
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-6 shadow-sm lg:col-span-2"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-(--theme-text)">Họ và tên</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-(--theme-border) px-4 py-3 text-sm text-(--theme-text) outline-none transition focus:border-(--brand-primary) focus:ring-1 focus:ring-(--theme-border)"
                  placeholder="Nguyễn Văn A"
                  value={form.fullName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-(--theme-text)">Số điện thoại</label>
                <input
                  type="tel"
                  className="w-full rounded-xl border border-(--theme-border) px-4 py-3 text-sm text-(--theme-text) outline-none transition focus:border-(--brand-primary) focus:ring-1 focus:ring-(--theme-border)"
                  placeholder="09xx xxx xxx"
                  value={form.phone}
                  onChange={(e) => {
                    setForm((prev) => ({ ...prev, phone: e.target.value }));
                    setOtpCode("");
                    setOtpSentAt(null);
                    setOtpVerified(false);
                    setOtpError(null);
                  }}
                  required
                />
                <div className="flex flex-wrap items-center gap-2 text-xs text-(--theme-text-subtle)">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={!canSendOtp}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      canSendOtp
                        ? "border border-(--theme-border) bg-(--theme-surface) text-(--theme-text-muted) hover:bg-(--theme-surface-muted)"
                        : "cursor-not-allowed bg-gray-100 text-(--theme-text-subtle)"
                    }`}
                  >
                    Gửi OTP
                  </button>
                  {otpSentAt && <span>Đã gửi OTP lúc {otpSentAt}</span>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-(--theme-text)">Email</label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-(--theme-border) px-4 py-3 text-sm text-(--theme-text) outline-none transition focus:border-(--brand-primary) focus:ring-1 focus:ring-(--theme-border)"
                  placeholder="chutro@email.com"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-(--theme-text)">Mã OTP</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    className="w-full rounded-xl border border-(--theme-border) px-4 py-3 text-sm text-(--theme-text) outline-none transition focus:border-(--brand-primary) focus:ring-1 focus:ring-(--theme-border)"
                    placeholder="Nhập mã OTP"
                    value={otpCode}
                    onChange={(e) => {
                      setOtpCode(e.target.value);
                      setOtpVerified(false);
                      setOtpError(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={!canVerifyOtp}
                    className={`rounded-full px-3 py-2 text-xs font-semibold ${
                      canVerifyOtp
                        ? "bg-gray-900 text-white hover:bg-black"
                        : "cursor-not-allowed bg-gray-200 text-(--theme-text-subtle)"
                    }`}
                  >
                    Xác thực
                  </button>
                </div>
                {otpVerified && <div className="text-xs text-green-600">OTP đã được xác thực.</div>}
                {otpError && <div className="text-xs text-red-600">{otpError}</div>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-(--theme-text)">Số CCCD/CMND</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-(--theme-border) px-4 py-3 text-sm text-(--theme-text) outline-none transition focus:border-(--brand-primary) focus:ring-1 focus:ring-(--theme-border)"
                  placeholder="0123456789"
                  value={form.idNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, idNumber: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-(--theme-text)">Hình thức sở hữu</label>
                <select
                  className="w-full rounded-xl border border-(--theme-border) px-4 py-3 text-sm text-(--theme-text) outline-none transition focus:border-(--brand-primary) focus:ring-1 focus:ring-(--theme-border)"
                  value={form.ownershipType}
                  onChange={(e) => setForm((prev) => ({ ...prev, ownershipType: e.target.value }))}
                >
                  <option value="owner">Chính chủ</option>
                  <option value="authorized">Được ủy quyền cho thuê</option>
                  <option value="sublease">Cho thuê lại hợp pháp</option>
                </select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-(--theme-text)">Địa chỉ bất động sản</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-(--theme-border) px-4 py-3 text-sm text-(--theme-text) outline-none transition focus:border-(--brand-primary) focus:ring-1 focus:ring-(--theme-border)"
                  placeholder="12/3 Nguyễn Gia Trí, P.25, Bình Thạnh"
                  value={form.propertyAddress}
                  onChange={(e) => setForm((prev) => ({ ...prev, propertyAddress: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold text-(--theme-text)">Tài khoản nhận cọc (tuỳ chọn)</label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-(--theme-border) px-4 py-3 text-sm text-(--theme-text) outline-none transition focus:border-(--brand-primary) focus:ring-1 focus:ring-(--theme-border)"
                  placeholder="Ngân hàng - Số tài khoản"
                  value={form.bankAccount}
                  onChange={(e) => setForm((prev) => ({ ...prev, bankAccount: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-(--theme-text)">Tải CCCD/CMND</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="w-full rounded-xl border border-dashed border-(--theme-border) bg-(--theme-surface-muted) px-4 py-3 text-sm text-(--theme-text-muted)"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-(--theme-text)">Giấy tờ chứng minh sở hữu</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="w-full rounded-xl border border-dashed border-(--theme-border) bg-(--theme-surface-muted) px-4 py-3 text-sm text-(--theme-text-muted)"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-(--theme-border) bg-(--theme-surface-muted) p-4 text-sm text-(--theme-text-muted)">
              <div className="text-sm font-semibold text-(--theme-text)">Xác nhận & đồng ý</div>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-(--theme-border) text-(--brand-accent) focus:ring-[#D51F35]"
                  checked={consents.accuracy}
                  onChange={(e) => setConsents((prev) => ({ ...prev, accuracy: e.target.checked }))}
                />
                <span>
                  Tôi xác nhận thông tin cung cấp là chính xác và chịu trách nhiệm về nội dung tin đăng.
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-(--theme-border) text-(--brand-accent) focus:ring-[#D51F35]"
                  checked={consents.sensitive}
                  onChange={(e) => setConsents((prev) => ({ ...prev, sensitive: e.target.checked }))}
                />
                <span>
                  Tôi đồng ý cho phép xử lý dữ liệu nhạy cảm (CCCD/CMND, giấy tờ sở hữu) cho mục đích
                  kiểm duyệt nội bộ và không công khai.
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-(--theme-border) text-(--brand-accent) focus:ring-[#D51F35]"
                  checked={consents.terms}
                  onChange={(e) => setConsents((prev) => ({ ...prev, terms: e.target.checked }))}
                />
                <span>
                  Tôi đã đọc và đồng ý với{" "}
                  <Link href="/terms" className="font-semibold text-(--theme-text) hover:text-(--brand-accent)">
                    Điều khoản sử dụng
                  </Link>
                  .
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-(--theme-border) text-(--brand-accent) focus:ring-[#D51F35]"
                  checked={consents.privacy}
                  onChange={(e) => setConsents((prev) => ({ ...prev, privacy: e.target.checked }))}
                />
                <span>
                  Tôi đã đọc và đồng ý với{" "}
                  <Link href="/privacy" className="font-semibold text-(--theme-text) hover:text-(--brand-accent)">
                    Chính sách bảo mật
                  </Link>
                  .
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={!isReady}
                className={`rounded-full px-5 py-3 text-sm font-semibold text-white transition ${
                  isReady ? "bg-(--brand-accent) hover:bg-(--brand-accent-strong)" : "cursor-not-allowed bg-gray-300"
                }`}
              >
                Gửi hồ sơ xác minh
              </button>
              {!isReady && (
                <span className="text-xs text-(--theme-text-subtle)">
                  Vui lòng điền đủ thông tin, xác thực OTP và đồng ý điều khoản.
                </span>
              )}
            </div>
          </form>

          <div className="space-y-4">
            <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-(--theme-text)">Lợi ích khi xác minh</h3>
              <ul className="mt-3 space-y-2 text-sm text-(--theme-text-muted)">
                <li>• Hiển thị huy hiệu “Chủ trọ đã xác minh”.</li>
                <li>• Tăng độ tin cậy, ưu tiên trong đề xuất tìm kiếm.</li>
                <li>• Dễ dàng nhận đặt lịch xem phòng.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-(--theme-text)">Preview huy hiệu</h3>
              <div className="mt-3 rounded-xl border border-(--theme-border) bg-(--theme-surface-muted) p-4">
                <div className="text-sm font-semibold text-(--theme-text)">
                  Phòng trọ gần VLU - Full tiện nghi
                </div>
                <div className="mt-1 text-xs text-(--theme-text-subtle)">Bình Thạnh • 4.5 triệu/tháng</div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    {status === "verified" ? "Chủ trọ đã xác minh" : "Chưa xác minh"}
                  </span>
                  <span className="text-xs text-(--theme-text-subtle)">Tỷ lệ phản hồi 95%</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-(--theme-border) bg-(--theme-surface) p-5 text-xs text-(--theme-text-muted)">
              Thông tin cá nhân được bảo vệ theo chính sách bảo mật và Nghị định 13/2023/NĐ-CP. Nền tảng chỉ
              lưu dữ liệu cần thiết để phục vụ kiểm duyệt và vận hành dịch vụ.
            </div>
          </div>
        </div>
      </div>
    </UserPageShell>
  );
}
