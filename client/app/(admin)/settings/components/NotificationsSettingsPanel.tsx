"use client";

import { useState } from "react";

type NotificationTabKey = "offers" | "account";

type NotificationItem = {
  title: string;
  helper?: string;
};

type NotificationSection = {
  title: string;
  description: string;
  items: NotificationItem[];
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function NotificationSectionBlock({ section }: { section: NotificationSection }) {
  return (
    <section className="pt-8">
      <div className="border-b border-gray-200 pb-3 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{section.title}</h2>
        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">{section.description}</p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {section.items.map((item) => (
          <div key={item.title} className="flex items-start justify-between gap-4 py-5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</p>
              {item.helper ? (
                <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">{item.helper}</p>
              ) : null}
            </div>

            <button
              type="button"
              className="shrink-0 text-sm font-medium text-gray-700 transition hover:underline dark:text-gray-300"
            >
              Chỉnh sửa
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

const offersSections: NotificationSection[] = [
  {
    title: "Thông tin chi tiết và phần thưởng cho Chủ nhà",
    description: "Quản lý email về thành tích, gợi ý giá và các ưu đãi dành cho hoạt động đón tiếp khách.",
    items: [
      { title: "Sự công nhận và thành tích" },
      { title: "Thông tin chuyến đi và ưu đãi" },
      { title: "Xu hướng và đề xuất về giá" },
      { title: "Ưu đãi đặc biệt cho Chủ nhà" },
    ],
  },
  {
    title: "Cập nhật về hoạt động đón tiếp khách",
    description: "Nhận các thông tin quan trọng liên quan đến vận hành chỗ ở và thay đổi trong khu vực.",
    items: [
      { title: "Tin tức và cập nhật" },
      { title: "Luật và quy định địa phương" },
    ],
  },
  {
    title: "Mẹo cho hành trình và ưu đãi",
    description: "Chọn các nội dung truyền cảm hứng và ưu đãi để hỗ trợ lên kế hoạch cho chuyến đi.",
    items: [
      { title: "Cảm hứng và ưu đãi" },
      { title: "Lập kế hoạch chuyến đi" },
    ],
  },
  {
    title: "Thông tin cập nhật từ Airbnb",
    description: "Các email về chương trình, phản hồi và cập nhật chính sách đi lại từ nền tảng.",
    items: [
      { title: "Tin tức và chương trình" },
      { title: "Phản hồi" },
      { title: "Quy định đi lại" },
    ],
  },
];

const accountSections: NotificationSection[] = [
  {
    title: "Thông báo tài khoản",
    description: "Cập nhật liên quan đến bảo mật, đăng nhập và thay đổi cài đặt tài khoản của bạn.",
    items: [
      { title: "Đăng nhập từ thiết bị mới", helper: "Thông báo khi tài khoản được truy cập từ thiết bị hoặc vị trí lạ." },
      { title: "Cập nhật bảo mật", helper: "Thông tin về thay đổi mật khẩu, xác minh và các cảnh báo quan trọng." },
      { title: "Hoạt động thanh toán", helper: "Nhận thông báo về giao dịch, hóa đơn và trạng thái thanh toán." },
    ],
  },
  {
    title: "Nhắc nhở và hỗ trợ",
    description: "Chọn những nhắc nhở cần thiết để quản lý tài khoản thuận tiện hơn.",
    items: [
      { title: "Nhắc hoàn tất hồ sơ" },
      { title: "Nhắc xác minh thông tin" },
      { title: "Hỗ trợ và mẹo sử dụng" },
    ],
  },
];

export default function NotificationsSettingsPanel() {
  const [activeTab, setActiveTab] = useState<NotificationTabKey>("offers");
  const [stopAllMarketingEmails, setStopAllMarketingEmails] = useState(false);

  const sections = activeTab === "offers" ? offersSections : accountSections;

  return (
    <div className="w-full max-w-[620px]">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Thông báo</h1>
      </header>

      <div className="mt-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-end gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("offers")}
            className={cn(
              "border-b-2 pb-3 text-sm font-medium transition",
              activeTab === "offers"
                ? "border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            Ưu đãi và cập nhật
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={cn(
              "border-b-2 pb-3 text-sm font-medium transition",
              activeTab === "account"
                ? "border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            Tài khoản
          </button>
        </div>
      </div>

      <div className="divide-y-0">
        {sections.map((section, index) => (
          <div key={section.title} className={index === 0 ? "" : "border-t border-gray-200 dark:border-gray-800"}>
            <NotificationSectionBlock section={section} />
          </div>
        ))}
      </div>

      <section className="mt-10 border-t border-gray-200 pt-8 dark:border-gray-800">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={stopAllMarketingEmails}
            onChange={(event) => setStopAllMarketingEmails(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Ngừng nhận tất cả các email tiếp thị
          </span>
        </label>
      </section>
    </div>
  );
}
