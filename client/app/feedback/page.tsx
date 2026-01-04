"use client";

import { FormEvent, useState } from "react";
import UserPageShell from "@/app/homepage/components/UserPageShell";

type FeedbackForm = {
  title: string;
  type: string;
  message: string;
  contact: string;
};

export default function FeedbackPage() {
  const [form, setForm] = useState<FeedbackForm>({
    title: "",
    type: "idea",
    message: "",
    contact: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setForm({
      title: "",
      type: "idea",
      message: "",
      contact: "",
    });
  };

  const updateField = (key: keyof FeedbackForm, value: string) => {
    setSubmitted(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <UserPageShell
      title="Đóng góp ý kiến"
      description="Chia sẻ ý tưởng hoặc báo lỗi khi sử dụng VLU Renting. Chúng tôi đọc mọi đóng góp và phản hồi sớm nhất."
      actions={
        <span className="rounded-full bg-green-100 px-4 py-2 text-xs font-semibold text-green-800">
          Mục tiêu: phản hồi trong 24h
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800" htmlFor="title">
                  Tiêu đề
                </label>
                <input
                  id="title"
                  type="text"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
                  placeholder="Ví dụ: Đề xuất bộ lọc ký túc xá"
                  value={form.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-800" htmlFor="type">
                  Loại ý kiến
                </label>
                <select
                  id="type"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
                  value={form.type}
                  onChange={(e) => updateField("type", e.target.value)}
                >
                  <option value="idea">Ý tưởng / Đề xuất</option>
                  <option value="bug">Báo lỗi</option>
                  <option value="support">Hỗ trợ sử dụng</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800" htmlFor="message">
                Nội dung chi tiết
              </label>
              <textarea
                id="message"
                rows={6}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
                placeholder="Mô tả rõ vấn đề, bước thực hiện, mong muốn hoặc đề xuất cụ thể..."
                value={form.message}
                onChange={(e) => updateField("message", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-800" htmlFor="contact">
                Email / Số điện thoại (không bắt buộc)
              </label>
              <input
                id="contact"
                type="text"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
                placeholder="Để lại thông tin nếu bạn muốn được phản hồi trực tiếp"
                value={form.contact}
                onChange={(e) => updateField("contact", e.target.value)}
              />
            </div>

            {submitted && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                Cảm ơn bạn! Ý kiến đã được ghi nhận, chúng tôi sẽ phản hồi sớm nhất.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Bạn cũng có thể gửi email tới support@vlu-renting.vn nếu muốn đính kèm hình ảnh.
              </p>
              <button
                type="submit"
                className="rounded-full bg-[#D51F35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#b01628] active:scale-95"
              >
                Gửi ý kiến
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Gợi ý nội dung</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>- Mô tả rõ màn hình/bộ lọc bạn đang dùng.</li>
              <li>- Đính kèm ảnh chụp lỗi (nếu có).</li>
              <li>- Cho biết mục tiêu của bạn (tìm phòng, đăng tin...).</li>
              <li>- Để lại thông tin liên hệ nếu cần trả lời gấp.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900">Kênh hỗ trợ nhanh</h3>
            <p className="mt-2 text-sm text-gray-700">
              Hotline: <span className="font-semibold text-gray-900">1900 1234</span>
            </p>
            <p className="text-sm text-gray-700">Email: support@vlu-renting.vn</p>
            <p className="text-sm text-gray-700">Thời gian: 8:00 – 22:00 (thứ 2 – CN)</p>
          </div>
        </div>
      </div>
    </UserPageShell>
  );
}
