"use client";

import { useState, type ReactNode } from "react";

type SecurityTabKey = "login" | "access";

type RowItem = {
  label: string;
  description: string;
  actionLabel: string;
  danger?: boolean;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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

function Section({ title, children }: { title: string; children: ReactNode }) {
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

export default function LoginSecurityPanel() {
  const [activeTab, setActiveTab] = useState<SecurityTabKey>("login");
  const [showDisableModal, setShowDisableModal] = useState(false);

  return (
    <>
      <header>
        <h2 className="text-[40px] font-semibold leading-[1.1] text-[#111827] dark:text-gray-100">
          Đăng nhập và bảo mật
        </h2>
        <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Quản lý mật khẩu, tài khoản liên kết và thiết bị đăng nhập.
        </p>
      </header>

      <Tabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "login" ? (
        <div>
          <Section title="Đăng nhập">
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

      <ConfirmModal
        open={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onConfirm={() => setShowDisableModal(false)}
      />
    </>
  );
}
