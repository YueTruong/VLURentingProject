"use client";

import { useState, type ReactNode } from "react";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: () => void;
  label: string;
};

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
  first?: boolean;
};

type SettingsRowProps = {
  title: string;
  description: ReactNode;
  trailing: ReactNode;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ToggleSwitch({ checked, onChange, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200",
        checked ? "bg-gray-900 dark:bg-gray-100" : "bg-gray-300 dark:bg-gray-700"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 dark:bg-gray-900",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function SettingsRow({ title, description, trailing }: SettingsRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
        <div className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">{description}</div>
      </div>
      <div className="shrink-0 self-center">{trailing}</div>
    </div>
  );
}

function SettingsSection({ title, children, first = false }: SettingsSectionProps) {
  return (
    <section className={cn(!first && "mt-10 border-t border-gray-200 pt-8 dark:border-gray-800")}>
      <div className="border-b border-gray-200 pb-3 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-800">{children}</div>
    </section>
  );
}

function SettingsArrowRow({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-start justify-between gap-4 py-5 text-left transition hover:bg-gray-50/70 dark:hover:bg-gray-900/40"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</p>
        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
      </svg>
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
] as const;

const dataPrivacyDescriptions: Record<(typeof dataPrivacyRows)[number], string> = {
  "Yêu cầu cho biết dữ liệu cá nhân của tôi":
    "Xem và yêu cầu bản sao dữ liệu cá nhân mà hệ thống đang lưu trữ.",
  "Giúp cải thiện các tính năng được hỗ trợ bởi AI":
    "Quản lý việc sử dụng dữ liệu để cải thiện trải nghiệm và tính năng AI.",
  "Xóa tài khoản của tôi": "Yêu cầu xóa tài khoản và dữ liệu liên quan theo chính sách hiện hành.",
};

export default function PrivacySettingsPanel() {
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const [postPrivacy, setPostPrivacy] = useState<Record<(typeof postSettings)[number]["key"], boolean>>({
    searchEngine: true,
    hometown: false,
    expertType: false,
    joinedTime: true,
    bookedServices: false,
  });

  return (
    <section className="min-w-0">
      <header className="pb-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Quyền riêng tư</h1>
      </header>

      <SettingsSection title="Tin nhắn" first>
        <SettingsRow
          title="Thông báo đã đọc tin nhắn"
          description={
            <>
              Cho người khác biết tôi đã đọc tin nhắn của họ.{" "}
              <button type="button" className="font-medium text-gray-700 hover:underline dark:text-gray-300">
                Tìm hiểu thêm
              </button>
            </>
          }
          trailing={
            <ToggleSwitch
              checked={readReceiptsEnabled}
              onChange={() => setReadReceiptsEnabled((prev) => !prev)}
              label="Thông báo đã đọc tin nhắn"
            />
          }
        />
      </SettingsSection>

      <SettingsSection title="Bài đăng">
        {postSettings.map((item) => (
          <SettingsRow
            key={item.key}
            title={item.title}
            description={item.description}
            trailing={
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
            }
          />
        ))}
      </SettingsSection>

      <SettingsSection title="Quyền riêng tư dữ liệu">
        {dataPrivacyRows.map((row) => (
          <SettingsArrowRow key={row} title={row} description={dataPrivacyDescriptions[row]} />
        ))}
      </SettingsSection>

      <section className="mt-10 border-t border-gray-200 pt-8 dark:border-gray-800">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-gray-900/60">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 dark:border-red-900/50 dark:bg-gray-950 dark:text-red-400">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V8a4 4 0 118 0v3" />
              </svg>
            </span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Cam kết đảm bảo quyền riêng tư
              </h3>
              <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Hãy kiểm tra kỹ các thiết lập trước khi chia sẻ thông tin công khai để đảm bảo quyền riêng tư và mức độ
                hiển thị phù hợp với bạn.
              </p>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
