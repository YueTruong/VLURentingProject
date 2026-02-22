"use client";

import { useState } from "react";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: () => void;
  label: string;
};

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 ${
        checked ? "bg-[#111827]" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

const postSettings = [
  {
    key: "searchEngine",
    title: "Cho phép bài đăng của tôi xuất hiện trong các công cụ tìm kiếm",
    description: "Giúp người dùng tìm thấy bài đăng của bạn thông qua các nền tảng tìm kiếm phổ biến.",
  },
  {
    key: "hometown",
    title: "Hiển thị thành phố và quốc gia quê hương tôi",
    description: "Hiển thị thông tin khu vực quê hương để hồ sơ của bạn minh bạch hơn.",
  },
  {
    key: "expertType",
    title: "Hiển thị loại chuyên gia của tôi",
    description: "Cho người khác biết lĩnh vực bạn có kinh nghiệm hoặc chuyên môn.",
  },
  {
    key: "joinedTime",
    title: "Hiển thị thời gian đã tham gia của tôi",
    description: "Cho người khác biết bạn đã tham gia nền tảng trong bao lâu.",
  },
  {
    key: "bookedServices",
    title: "Hiển thị các dịch vụ mà tôi đã đặt",
    description: "Hiển thị thông tin dịch vụ đã sử dụng để tăng mức độ tin cậy hồ sơ.",
  },
] as const;

const dataPrivacyRows = [
  "Yêu cầu cho biết dữ liệu cá nhân của tôi",
  "Giúp cải thiện các tính năng được hỗ trợ bởi AI",
  "Xóa tài khoản của tôi",
];

export default function PrivacySettingsPage() {
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const [postPrivacy, setPostPrivacy] = useState<Record<(typeof postSettings)[number]["key"], boolean>>({
    searchEngine: true,
    hometown: false,
    expertType: false,
    joinedTime: true,
    bookedServices: false,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <main className="mx-auto w-full max-w-[720px] rounded-3xl bg-white px-6 py-10 sm:px-8">
        <section>
          <h1 className="mb-6 text-xl font-semibold text-[#111827]">Quyền riêng tư</h1>

          <div className="flex items-start justify-between gap-6 rounded-xl px-3 py-4 hover:bg-gray-50">
            <div className="max-w-[520px]">
              <h2 className="text-base font-medium text-[#111827]">Thông báo đã đọc tin nhắn</h2>
              <p className="mt-1 text-sm text-gray-500">
                Cho người khác biết tôi đã đọc tin nhắn của họ.{" "}
                <button type="button" className="text-[#111827] transition hover:underline">
                  Tìm hiểu thêm
                </button>
              </p>
            </div>
            <ToggleSwitch
              checked={readReceiptsEnabled}
              onChange={() => setReadReceiptsEnabled((prev) => !prev)}
              label="Thông báo đã đọc tin nhắn"
            />
          </div>
        </section>

        <div className="my-6 border-t border-gray-200" />

        <section>
          <h2 className="text-xl font-semibold text-[#111827]">Bài đăng</h2>
          <div className="mt-2 divide-y divide-gray-200">
            {postSettings.map((item) => (
              <div key={item.key} className="rounded-xl px-3 py-4 transition hover:bg-gray-50">
                <div className="flex items-start justify-between gap-6">
                  <div className="max-w-[520px]">
                    <h3 className="text-base font-medium text-[#111827]">{item.title}</h3>
                    <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                  </div>
                  <ToggleSwitch
                    checked={postPrivacy[item.key]}
                    onChange={() =>
                      setPostPrivacy((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key],
                      }))
                    }
                    label={item.title}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="my-6 border-t border-gray-200" />

        <section>
          <h2 className="text-xl font-semibold text-[#111827]">Quyền riêng tư đối với dữ liệu</h2>
          <div className="mt-2">
            {dataPrivacyRows.map((row) => (
              <button
                key={row}
                type="button"
                className="flex w-full items-center justify-between rounded-xl border-b border-gray-200 px-4 py-4 text-left transition hover:bg-gray-50"
              >
                <span className="text-base font-medium text-[#111827]">{row}</span>
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
                </svg>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              </svg>
            </span>
            <p className="text-sm text-red-700">
              Cảnh báo: đảm bảo quyền riêng tư của bạn bằng cách kiểm tra kỹ các thiết lập trước khi chia sẻ thông tin cá nhân công khai.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

