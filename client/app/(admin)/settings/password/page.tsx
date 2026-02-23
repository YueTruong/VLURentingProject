"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

type SecurityTabKey = "login" | "access";

type RowItem = {
  label: string;
  description: string;
  actionLabel: string;
  danger?: boolean;
};

type SidebarItem = {
  label: string;
  href?: string;
  icon: ReactNode;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function MenuIcon({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-gray-700 dark:text-gray-300">
      {children}
    </span>
  );
}

function SettingsSidebar() {
  const pathname = usePathname();

  const items: SidebarItem[] = [
    {
      label: "Thông tin cá nhân",
      href: "/settings",
      icon: (
        <MenuIcon>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 00-16 0" />
            <circle cx="12" cy="8" r="4" />
          </svg>
        </MenuIcon>
      ),
    },
    {
      label: "Đăng nhập và bảo mật",
      href: "/settings/password",
      icon: (
        <MenuIcon>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 4v6c0 4.4-3 7-7 8-4-1-7-3.6-7-8V7l7-4z" />
          </svg>
        </MenuIcon>
      ),
    },
    {
      label: "Quyền riêng tư",
      icon: (
        <MenuIcon>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M2 12h20" />
            <circle cx="12" cy="12" r="9" />
          </svg>
        </MenuIcon>
      ),
    },
    {
      label: "Thông báo",
      icon: (
        <MenuIcon>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17H5l1.4-1.4A2 2 0 007 14.2V10a5 5 0 1110 0v4.2a2 2 0 00.6 1.4L19 17h-4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19a3 3 0 006 0" />
          </svg>
        </MenuIcon>
      ),
    },
    {
      label: "Thuế",
      href: "/settings/tax",
      icon: (
        <MenuIcon>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 8h8M8 12h8M8 16h6" />
          </svg>
        </MenuIcon>
      ),
    },
    {
      label: "Thanh toán",
      icon: (
        <MenuIcon>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18" />
          </svg>
        </MenuIcon>
      ),
    },
    {
      label: "Ngôn ngữ và loại tiền tệ",
      icon: (
        <MenuIcon>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
          </svg>
        </MenuIcon>
      ),
    },
    {
      label: "Đi công tác",
      icon: (
        <MenuIcon>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h10" />
          </svg>
        </MenuIcon>
      ),
    },
  ];

  return (
    <aside className="lg:sticky lg:top-6">
      <div className="border-b border-gray-200 pb-6 dark:border-gray-800">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Cài đặt tài khoản
        </h2>
      </div>

      <nav className="pt-6">
        <ul className="space-y-1.5">
          {items.map((item) => {
            const isActive = item.href ? pathname === item.href : false;
            const baseClass = cn(
              "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition",
              isActive
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                : "text-gray-800 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800/70"
            );

            const content = (
              <>
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
              </>
            );

            return (
              <li key={item.label}>
                {item.href ? (
                  <Link href={item.href} className={baseClass}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" className={baseClass}>
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-800">
        <button
          type="button"
          className="flex w-full items-start gap-3 rounded-xl px-1 py-2 text-left text-sm font-medium text-gray-800 transition hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100"
        >
          <MenuIcon>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h10" />
            </svg>
          </MenuIcon>
          <span className="leading-6">Công cụ đón tiếp khách chuyên nghiệp</span>
        </button>
      </div>
    </aside>
  );
}

function Tabs({
  activeTab,
  onChange,
}: {
  activeTab: SecurityTabKey;
  onChange: (tab: SecurityTabKey) => void;
}) {
  return (
    <div className="mt-6 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-end gap-6">
        <button
          type="button"
          onClick={() => onChange("login")}
          className={cn(
            "border-b-2 pb-3 text-sm font-medium transition",
            activeTab === "login"
              ? "border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          )}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => onChange("access")}
          className={cn(
            "border-b-2 pb-3 text-sm font-medium transition",
            activeTab === "access"
              ? "border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          )}
        >
          Chia sẻ quyền truy cập
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="pt-8">
      <div className="border-b border-gray-200 pb-3 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-800">{children}</div>
    </section>
  );
}

function SettingsRow({
  label,
  description,
  actionLabel,
  danger = false,
  onAction,
}: RowItem & { onAction?: () => void }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:py-5">
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-medium",
            danger ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-gray-100"
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "mt-1 text-sm leading-6",
            danger ? "text-red-600/90 dark:text-red-300/90" : "text-gray-500 dark:text-gray-400"
          )}
        >
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onAction}
        className={cn(
          "shrink-0 self-start text-sm font-medium transition hover:underline",
          danger ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300"
        )}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function ConfirmModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-md border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Xác nhận vô hiệu hóa tài khoản
        </h3>
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Hành động này có thể làm gián đoạn đăng nhập và truy cập các tính năng. Bạn có chắc chắn muốn tiếp tục?
        </p>

        <div className="mt-6 flex items-center justify-end gap-5">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-gray-700 hover:underline dark:text-gray-300"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="text-sm font-medium text-red-600 hover:underline dark:text-red-400"
          >
            Vô hiệu hóa
          </button>
        </div>
      </div>
    </div>
  );
}

const loginPasswordRows: RowItem[] = [
  {
    label: "Mật khẩu",
    description: "Lần cập nhật gần nhất: 30 ngày trước. Sử dụng mật khẩu mạnh để bảo vệ tài khoản.",
    actionLabel: "Đổi mật khẩu",
  },
  {
    label: "Xác minh 2 bước",
    description: "Chưa tạo. Thêm lớp bảo vệ bổ sung khi đăng nhập từ thiết bị hoặc vị trí lạ.",
    actionLabel: "Tạo",
  },
];

const socialRows: RowItem[] = [
  {
    label: "Google",
    description: "Đã kết nối. Dùng để đăng nhập nhanh và khôi phục tài khoản.",
    actionLabel: "Ngắt kết nối",
  },
  {
    label: "Facebook",
    description: "Chưa kết nối. Bạn có thể dùng Facebook để đăng nhập.",
    actionLabel: "Kết nối",
  },
  {
    label: "Apple",
    description: "Chưa kết nối. Kết nối để đăng nhập thuận tiện trên thiết bị Apple.",
    actionLabel: "Kết nối",
  },
];

const deviceRows: RowItem[] = [
  {
    label: "Phiên hiện tại",
    description: "Windows • Chrome • TP.HCM • 09:42 hôm nay",
    actionLabel: "Thiết bị này",
  },
  {
    label: "Phiên iPhone",
    description: "iPhone • Safari • TP.HCM • 21:18 hôm qua",
    actionLabel: "Đăng xuất",
  },
  {
    label: "Phiên macOS",
    description: "macOS • Chrome • Bình Dương • 3 ngày trước",
    actionLabel: "Đăng xuất",
  },
];

const accessRows: RowItem[] = [
  {
    label: "Cộng tác viên quản lý tin đăng",
    description: "Chưa có ai được cấp quyền. Bạn có thể mời cộng tác viên quản lý nội dung tin đăng.",
    actionLabel: "Mời người dùng",
  },
  {
    label: "Quyền hiện tại",
    description: "Bạn đang là chủ sở hữu tài khoản với toàn quyền quản trị và bảo mật.",
    actionLabel: "Xem quyền",
  },
  {
    label: "Nhật ký chia sẻ",
    description: "Chưa có hoạt động. Các thay đổi cấp quyền/gỡ quyền sẽ được hiển thị tại đây.",
    actionLabel: "Làm mới",
  },
];

export default function SettingsPasswordPage() {
  const [activeTab, setActiveTab] = useState<SecurityTabKey>("login");
  const [showDisableModal, setShowDisableModal] = useState(false);

  return (
    <>
      <div className="mx-auto w-full max-w-[1180px] px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-[340px_minmax(0,720px)]">
          <SettingsSidebar />

          <main className="min-w-0">
            <header>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Đăng nhập & Bảo mật
              </h1>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Quản lý mật khẩu, tài khoản liên kết và thiết bị đăng nhập.
              </p>
            </header>

            <Tabs activeTab={activeTab} onChange={setActiveTab} />

            {activeTab === "login" ? (
              <div>
                <Section title="Mật khẩu">
                  {loginPasswordRows.map((row) => (
                    <SettingsRow key={row.label} {...row} />
                  ))}
                </Section>

                <Section title="Tài khoản mạng xã hội">
                  {socialRows.map((row) => (
                    <SettingsRow key={row.label} {...row} />
                  ))}
                </Section>

                <Section title="Lịch sử thiết bị">
                  {deviceRows.map((row) => (
                    <SettingsRow key={row.label} {...row} />
                  ))}
                </Section>

                <Section title="Tài khoản">
                  <SettingsRow
                    label="Vô hiệu hóa tài khoản"
                    description="Tạm khóa khả năng đăng nhập và sử dụng tài khoản cho đến khi bạn kích hoạt lại."
                    actionLabel="Vô hiệu hóa"
                    danger
                    onAction={() => setShowDisableModal(true)}
                  />
                </Section>
              </div>
            ) : (
              <div>
                <Section title="Chia sẻ quyền truy cập">
                  {accessRows.map((row) => (
                    <SettingsRow key={row.label} {...row} />
                  ))}
                </Section>
              </div>
            )}
          </main>
        </div>
      </div>

      <ConfirmModal
        open={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onConfirm={() => setShowDisableModal(false)}
      />
    </>
  );
}
