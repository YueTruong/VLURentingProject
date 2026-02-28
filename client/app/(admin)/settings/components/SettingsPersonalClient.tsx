"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  getIdentityVerificationOverview,
  type IdentityVerificationStatus,
} from "@/app/services/security";
import LanguageCurrencySettingsPanel from "./LanguageCurrencySettingsPanel";
import LoginSecurityPanel from "./LoginSecurityPanel";
import NotificationsSettingsPanel from "./NotificationsSettingsPanel";
import PrivacySettingsPanel from "./PrivacySettingsPanel";

type Props = {
  legalName: string;
  email: string;
  initialPanel?: "personal" | "login_security" | "privacy" | "notifications" | "language_currency";
};

type MenuItem = {
  label: string;
  icon: ReactNode;
  href?: string;
  active?: boolean;
  panelKey?: SettingsPanelKey;
};

type SettingsPanelKey = "personal" | "login_security" | "privacy" | "notifications" | "language_currency";

type InfoKey =
  | "legal_name"
  | "preferred_name"
  | "email"
  | "phone"
  | "identity"
  | "residence"
  | "mailing"
  | "emergency";

type InfoRow = {
  key: InfoKey;
  title: string;
  value: string;
  action: string;
};

type HelpItem = {
  title: string;
  description: string;
};

const MISSING_VALUE = "Chưa được cung cấp";
const IDENTITY_NAVIGATION_DELAY_MS = 1000;

function MenuIcon({ children }: { children: ReactNode }) {
  return <span className="inline-flex h-5 w-5 items-center justify-center text-gray-500">{children}</span>;
}

function HelpCardItem({ title, description }: HelpItem) {
  return (
    <div className="flex gap-3 border-b border-[#e5e7eb] py-4 last:border-b-0">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#f43f5e] text-[#f43f5e]">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v5m0 3h.01" />
        </svg>
      </span>
      <div>
        <p className="text-[16px] font-semibold text-[#111827]">{title}</p>
        <p className="mt-1 text-[13px] leading-5 text-[#6b7280]">{description}</p>
      </div>
    </div>
  );
}

function RowDisplay({
  title,
  value,
  action,
  onAction,
  disabled = false,
}: {
  title: string;
  value: string;
  action: string;
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-[#e5e7eb] py-5">
      <div className="min-w-0 flex-1 pr-3">
        <p className="text-[17px] font-semibold leading-6 text-[#111827]">{title}</p>
        <p className="mt-1 text-[14px] leading-6 text-[#6b7280]">{value}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className="shrink-0 pt-1 text-[14px] font-semibold text-[#374151] underline underline-offset-4 hover:text-[#111827] disabled:cursor-not-allowed disabled:text-[#9ca3af] disabled:no-underline"
      >
        {action}
      </button>
    </div>
  );
}

export default function SettingsPersonalClient({ legalName, email, initialPanel = "personal" }: Props) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<SettingsPanelKey>(initialPanel);
  const [editingKey, setEditingKey] = useState<InfoKey | null>(null);
  const [preferredName, setPreferredName] = useState("");
  const [editingEmail, setEditingEmail] = useState("");
  const [isIdentityNavigating, setIsIdentityNavigating] = useState(false);
  const [identityStatus, setIdentityStatus] = useState<IdentityVerificationStatus>("unverified");
  const [identityStatusLoading, setIdentityStatusLoading] = useState(true);

  useEffect(() => {
    setActivePanel(initialPanel);
  }, [initialPanel]);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    const accessToken = session?.user?.accessToken;
    if (!accessToken) {
      setIdentityStatus("unverified");
      setIdentityStatusLoading(false);
      return;
    }

    let active = true;
    setIdentityStatusLoading(true);
    getIdentityVerificationOverview(accessToken)
      .then((data) => {
        if (!active) return;
        setIdentityStatus(data.status);
      })
      .catch(() => {
        if (!active) return;
        setIdentityStatus("unverified");
      })
      .finally(() => {
        if (!active) return;
        setIdentityStatusLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session?.user?.accessToken, sessionStatus]);

  const maskedEmail = useMemo(() => {
    if (!email || email === MISSING_VALUE || !email.includes("@")) return email;
    const [localPart, domain] = email.split("@");
    if (!localPart || !domain) return email;
    const first = localPart[0] ?? "";
    return `${first}***@${domain}`;
  }, [email]);

  const [firstName, lastName] = useMemo(() => {
    const cleaned = legalName.trim();
    if (!cleaned || cleaned === MISSING_VALUE) return ["", ""];

    const parts = cleaned.split(/\s+/);
    if (parts.length === 1) return [parts[0], ""];

    return [parts.slice(0, -1).join(" "), parts[parts.length - 1]];
  }, [legalName]);

  const identityRowValue = useMemo(() => {
    if (identityStatusLoading) return "Đang tải trạng thái xác minh";
    if (identityStatus === "verified") return "Đã xác minh";
    if (identityStatus === "pending") return "Đang chờ duyệt";
    return "Chưa bắt đầu";
  }, [identityStatus, identityStatusLoading]);

  const identityActionLabel = identityStatus === "verified" ? "Xem" : "Bắt đầu";

  const menuItems: MenuItem[] = [
    {
      label: "Thông tin cá nhân",
      panelKey: "personal",
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
      panelKey: "login_security",
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
      panelKey: "privacy",
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
      panelKey: "notifications",
      icon: (
        <MenuIcon>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17H5l1.4-1.4A2 2 0 007 14.2V10a5 5 0 1110 0v4.2a2 2 0 00.6 1.4L19 17h-4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19a3 3 0 006 0" />
          </svg>
        </MenuIcon>
      ),
    },
  ];

  const infoRows: InfoRow[] = [
    { key: "legal_name", title: "Tên pháp lý", value: legalName, action: "Chỉnh sửa" },
    { key: "preferred_name", title: "Tên ưa dùng", value: preferredName || MISSING_VALUE, action: "Thêm" },
    { key: "email", title: "Địa chỉ email", value: maskedEmail, action: "Chỉnh sửa" },
    {
      key: "phone",
      title: "Số điện thoại",
      value:
        "Thêm số điện thoại để khách đã xác nhận và Airbnb có thể liên hệ với bạn. Bạn có thể thêm các số điện thoại khác và chọn mục đích sử dụng tương ứng.",
      action: "Thêm",
    },
    { key: "identity", title: "Xác minh danh tính", value: identityRowValue, action: identityActionLabel },
    { key: "residence", title: "Địa chỉ cư trú", value: MISSING_VALUE, action: "Thêm" },
    { key: "mailing", title: "Địa chỉ gửi thư", value: MISSING_VALUE, action: "Thêm" },
    { key: "emergency", title: "Liên hệ trong trường hợp khẩn cấp", value: MISSING_VALUE, action: "Thêm" },
  ];

  const helpItems: HelpItem[] = [
    {
      title: "Tại sao thông tin của tôi không được hiển thị ở đây?",
      description: "Một số thông tin tài khoản được ẩn để bảo vệ danh tính của bạn.",
    },
    {
      title: "Bạn có thể chỉnh sửa những thông tin nào?",
      description:
        "Bạn có thể chỉnh sửa thông tin liên hệ và thông tin cá nhân. Khi dùng để xác minh danh tính, bạn có thể cần xác minh lại.",
    },
    {
      title: "Thông tin nào được chia sẻ với người khác?",
      description: "Một số thông tin liên lạc có thể được chia sẻ cho chủ nhà và khách sau khi đặt chỗ được xác nhận.",
    },
  ];

  const isEditing = editingKey !== null;
  const isLoginSecurityPanel = activePanel === "login_security";

  const renderEditingRow = (row: InfoRow) => {
    if (row.key === "legal_name") {
      return (
        <div className="border-b border-[#e5e7eb] py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[17px] font-semibold text-[#111827]">Tên pháp lý</p>
              <p className="mt-1 text-[14px] text-[#4b5563]">Đảm bảo tên nhập khớp với tên trên giấy tờ tùy thân do chính phủ cấp.</p>
            </div>
            <button
              type="button"
              onClick={() => setEditingKey(null)}
              className="text-[14px] font-semibold underline underline-offset-4"
            >
              Hủy
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="rounded-2xl border border-gray-300 bg-white p-4">
              <span className="text-[12px] text-gray-500">Tên trên giấy tờ tùy thân</span>
              <div className="mt-1 rounded-xl border border-gray-300 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-black/20">
                <input
                  defaultValue={firstName}
                  className="w-full bg-transparent text-gray-900 outline-none"
                />
              </div>
            </label>
            <label className="rounded-2xl border border-gray-300 bg-white p-4">
              <span className="text-[12px] text-gray-500">Họ trên giấy tờ tùy thân</span>
              <div className="mt-1 rounded-xl border border-gray-300 bg-white px-4 py-3 focus-within:ring-2 focus-within:ring-black/20">
                <input
                  defaultValue={lastName}
                  className="w-full bg-transparent text-gray-900 outline-none"
                />
              </div>
            </label>
          </div>
          <button
            type="button"
            onClick={() => setEditingKey(null)}
            className="mt-4 rounded-xl bg-[#111827] px-6 py-3 text-[16px] font-semibold text-white"
          >
            Lưu
          </button>
        </div>
      );
    }

    if (row.key === "preferred_name") {
      return (
        <div className="border-b border-[#e5e7eb] py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[17px] font-semibold text-[#111827]">Tên ưa dùng</p>
              <p className="mt-1 text-[14px] text-[#4b5563]">Tên này sẽ hiển thị cho host và khách.</p>
            </div>
            <button
              type="button"
              onClick={() => setEditingKey(null)}
              className="text-[14px] font-semibold underline underline-offset-4"
            >
              Hủy
            </button>
          </div>
          <input
            value={preferredName}
            onChange={(e) => setPreferredName(e.target.value)}
            placeholder="Tên ưa dùng (không bắt buộc)"
            className="mt-4 w-full rounded-2xl border border-[#9ca3af] px-4 py-3 text-[18px] outline-none"
          />
          <button
            type="button"
            onClick={() => setEditingKey(null)}
            className="mt-4 rounded-xl bg-[#111827] px-6 py-3 text-[16px] font-semibold text-white"
          >
            Lưu
          </button>
        </div>
      );
    }

    if (row.key === "email") {
      return (
        <div className="border-b border-[#e5e7eb] py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[17px] font-semibold text-[#111827]">Địa chỉ email</p>
              <p className="mt-1 text-[14px] text-[#4b5563]">Sử dụng địa chỉ email mà bạn luôn có quyền truy cập.</p>
            </div>
            <button
              type="button"
              onClick={() => setEditingKey(null)}
              className="text-[14px] font-semibold underline underline-offset-4"
            >
              Hủy
            </button>
          </div>
          <input
            value={editingEmail}
            onChange={(e) => setEditingEmail(e.target.value)}
            placeholder="Nhập địa chỉ email mới"
            className="mt-4 w-full rounded-2xl border border-[#9ca3af] px-4 py-3 text-[18px] outline-none"
          />
          <button
            type="button"
            onClick={() => setEditingKey(null)}
            className="mt-4 rounded-xl bg-[#111827] px-6 py-3 text-[16px] font-semibold text-white"
          >
            Lưu
          </button>
        </div>
      );
    }

    if (row.key === "phone") {
      return (
        <div className="border-b border-[#e5e7eb] py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[17px] font-semibold text-[#111827]">Số điện thoại</p>
              <p className="mt-1 text-[14px] leading-6 text-[#4b5563]">
                Thêm số điện thoại để khách đã xác nhận và Airbnb có thể liên hệ với bạn. Bạn có thể thêm các số điện thoại khác và chọn mục đích sử dụng tương ứng.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditingKey(null)}
              className="text-[14px] font-semibold underline underline-offset-4"
            >
              Đóng
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-[20px] font-medium">Nhập số điện thoại mới</p>
            <button
              type="button"
              onClick={() => setEditingKey(null)}
              className="text-[14px] font-semibold underline underline-offset-4"
            >
              Hủy
            </button>
          </div>

          <div className="mt-3 rounded-2xl border border-[#9ca3af] px-4 py-3">
            <p className="text-[12px] text-[#6b7280]">Quốc gia/Khu vực</p>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[18px]">Việt Nam (+84)</span>
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#111827]" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>

          <label className="mt-2 block rounded-2xl border border-[#111827] px-4 py-3">
            <span className="text-[12px] text-[#6b7280]">Số điện thoại</span>
            <input defaultValue="+84" className="mt-1 w-full bg-transparent text-[18px] outline-none" />
          </label>

          <p className="mt-2 text-[14px] leading-6 text-[#4b5563]">Chúng tôi sẽ gửi mã qua để xác minh số điện thoại. Có thể áp dụng cước nhắn tin và dữ liệu.</p>

          <button
            type="button"
            onClick={() => setEditingKey(null)}
            className="mt-4 rounded-xl bg-[#111827] px-6 py-3 text-[16px] font-semibold text-white"
          >
            Xác minh
          </button>
        </div>
      );
    }

    if (row.key === "identity") {
      return (
        <div className="border-b border-[#e5e7eb] py-6">
          <div className="grid gap-6 md:grid-cols-[1fr_300px]">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[30px] font-semibold leading-[1.15] text-[#111827]">Hãy thêm giấy tờ tùy thân do chính phủ cấp</p>
                  <p className="mt-3 text-[14px] leading-7 text-[#4b5563]">
                    Chúng tôi cần bạn bổ sung giấy tờ tùy thân chính thức do chính phủ cấp. Bước này giúp xác minh danh tính của bạn.
                  </p>
                  <p className="mt-3 text-[14px] leading-7 text-[#4b5563]">
                    Bạn có thể thêm bằng lái xe, hộ chiếu hoặc chứng minh nhân dân/thẻ căn cước công dân tùy thuộc vào quốc gia quê quán của mình.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingKey(null)}
                  className="shrink-0 text-[14px] font-semibold underline underline-offset-4"
                >
                  Hủy
                </button>
              </div>

              <div className="mt-8 border-t border-[#d1d5db] pt-4">
                <button
                  type="button"
                  onClick={() => setEditingKey(null)}
                  className="rounded-xl bg-[#111827] px-6 py-3 text-[16px] font-semibold text-white"
                >
                  Thêm giấy tờ tùy thân
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[#d1d5db] px-5 py-5">
              <p className="text-[32px] font-semibold text-[#111827]">Quyền riêng tư của bạn</p>
              <p className="mt-3 text-[14px] leading-7 text-[#4b5563]">
                Chúng tôi muốn đảm bảo sự riêng tư, an toàn và bảo mật cho dữ liệu bạn chia sẻ trong quá trình này. Tìm hiểu thêm trong Chính sách
                quyền riêng tư của chúng tôi.
              </p>
              <button type="button" className="mt-4 text-left text-[16px] font-semibold text-[#111827] underline underline-offset-4">
                Quy trình xác minh danh tính
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (row.key === "residence") {
      return (
        <div className="border-b border-[#e5e7eb] py-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[17px] font-semibold text-[#111827]">Địa chỉ cư trú</p>
            <button
              type="button"
              onClick={() => setEditingKey(null)}
              className="text-[14px] font-semibold underline underline-offset-4"
            >
              Hủy
            </button>
          </div>

          <button type="button" className="mt-4 flex w-full items-center justify-between rounded-2xl border border-[#9ca3af] px-4 py-3 text-left">
            <div>
              <p className="text-[14px] text-[#6b7280]">Quốc gia/khu vực</p>
              <p className="mt-0.5 text-[18px] text-[#111827]">Việt Nam</p>
            </div>
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#111827]" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <div className="mt-4 overflow-hidden rounded-2xl border border-[#9ca3af]">
            <input placeholder="Căn hộ, tầng, v.v. (nếu có)" className="w-full border-b border-[#9ca3af] bg-transparent px-4 py-4 text-[18px] text-[#111827] outline-none placeholder:text-[#4b5563]" />
            <input placeholder="Tên tòa nhà (nếu có)" className="w-full border-b border-[#9ca3af] bg-transparent px-4 py-4 text-[18px] text-[#111827] outline-none placeholder:text-[#4b5563]" />
            <input placeholder="Địa chỉ đường/phố" className="w-full border-b border-[#9ca3af] bg-transparent px-4 py-4 text-[18px] text-[#111827] outline-none placeholder:text-[#4b5563]" />
            <input placeholder="Thành phố/quận/thị xã" className="w-full border-b border-[#9ca3af] bg-transparent px-4 py-4 text-[18px] text-[#111827] outline-none placeholder:text-[#4b5563]" />
            <input placeholder="Đô thị/tỉnh" className="w-full border-b border-[#9ca3af] bg-transparent px-4 py-4 text-[18px] text-[#111827] outline-none placeholder:text-[#4b5563]" />
            <input placeholder="Mã bưu điện (nếu có)" className="w-full bg-transparent px-4 py-4 text-[18px] text-[#111827] outline-none placeholder:text-[#4b5563]" />
          </div>

          <button type="button" disabled className="mt-4 rounded-xl bg-[#d1d5db] px-6 py-3 text-[16px] font-semibold text-white">
            Lưu
          </button>
        </div>
      );
    }

    if (row.key === "mailing") {
      return (
        <div className="border-b border-[#e5e7eb] py-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[17px] font-semibold text-[#111827]">Địa chỉ gửi thư</p>
            <button
              type="button"
              onClick={() => setEditingKey(null)}
              className="text-[14px] font-semibold underline underline-offset-4"
            >
              Hủy
            </button>
          </div>

          <button
            type="button"
            className="mt-4 flex w-full max-w-[340px] items-center justify-between rounded-2xl border border-[#9ca3af] px-4 py-3 text-left"
          >
            <div>
              <p className="text-[14px] text-[#6b7280]">Quốc gia/khu vực</p>
              <p className="mt-0.5 text-[18px] text-[#111827]">Việt Nam</p>
            </div>
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#111827]" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <div className="mt-4 space-y-3">
            <input placeholder="Địa chỉ đường/phố" className="w-full rounded-2xl border border-[#9ca3af] bg-transparent px-4 py-4 text-[18px] text-[#111827] outline-none placeholder:text-[#4b5563]" />
            <input placeholder="Căn hộ, phòng (không bắt buộc)" className="w-full rounded-2xl border border-[#9ca3af] bg-transparent px-4 py-4 text-[18px] text-[#111827] outline-none placeholder:text-[#4b5563]" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input placeholder="Thành phố" className="w-full rounded-2xl border border-[#9ca3af] bg-transparent px-4 py-4 text-[18px] text-[#111827] outline-none placeholder:text-[#4b5563]" />
              <input placeholder="Bang / Tỉnh / Quận / Khu vực" className="w-full rounded-2xl border border-[#9ca3af] bg-transparent px-4 py-4 text-[18px] text-[#111827] outline-none placeholder:text-[#4b5563]" />
            </div>
            <input placeholder="Mã bưu chính" className="w-full max-w-[340px] rounded-2xl border border-[#9ca3af] bg-transparent px-4 py-4 text-[18px] text-[#111827] outline-none placeholder:text-[#4b5563]" />
          </div>

          <button
            type="button"
            onClick={() => setEditingKey(null)}
            className="mt-4 rounded-xl bg-[#111827] px-6 py-3 text-[16px] font-semibold text-white"
          >
            Lưu
          </button>
        </div>
      );
    }

    if (row.key === "emergency") {
      return (
        <div className="border-b border-[#e5e7eb] py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[17px] font-semibold text-[#111827]">Liên hệ trong trường hợp khẩn cấp</p>
              <p className="mt-1 text-[14px] text-[#4b5563]">Một người liên hệ đáng tin cậy mà chúng tôi có thể thông báo trong tình huống khẩn cấp.</p>
            </div>
            <button
              type="button"
              onClick={() => setEditingKey(null)}
              className="text-[14px] font-semibold underline underline-offset-4"
            >
              Hủy
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <input placeholder="Tên" className="w-full rounded-2xl border border-[#9ca3af] bg-transparent px-4 py-4 text-[18px] text-[#111827] outline-none placeholder:text-[#4b5563]" />
            <input placeholder="Mối quan hệ" className="w-full rounded-2xl border border-[#9ca3af] bg-transparent px-4 py-4 text-[18px] text-[#111827] outline-none placeholder:text-[#4b5563]" />

            <button type="button" className="flex w-full items-center justify-between rounded-2xl border border-[#9ca3af] px-4 py-4 text-left">
              <span className="text-[18px] text-[#4b5563]">Ngôn ngữ ưa thích</span>
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#111827]" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <input placeholder="Email" className="w-full rounded-2xl border border-[#9ca3af] bg-transparent px-4 py-4 text-[18px] text-[#111827] outline-none placeholder:text-[#4b5563]" />

            <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
              <button type="button" className="flex w-full items-center justify-between rounded-2xl border border-[#9ca3af] px-4 py-4 text-left">
                <span className="text-[18px] text-[#4b5563]">Mã quốc gia</span>
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#111827]" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <input placeholder="Số điện thoại" className="w-full rounded-2xl border border-[#9ca3af] bg-transparent px-4 py-4 text-[18px] text-[#111827] outline-none placeholder:text-[#4b5563]" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditingKey(null)}
            className="mt-4 rounded-xl bg-[#111827] px-6 py-3 text-[16px] font-semibold text-white"
          >
            Lưu
          </button>
        </div>
      );
    }

    return (
      <div className="border-b border-[#e5e7eb] py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[17px] font-semibold text-[#111827]">{row.title}</p>
            <p className="mt-1 text-[14px] leading-6 text-[#4b5563]">{row.value}</p>
          </div>
          <button
            type="button"
            onClick={() => setEditingKey(null)}
            className="text-[14px] font-semibold underline underline-offset-4"
          >
            Đóng
          </button>
        </div>
        <p className="mt-4 rounded-2xl border border-[#d1d5db] bg-[#f9fafb] px-4 py-3 text-[14px] text-[#4b5563]">
          Đang chỉnh sửa ngay tại mục này. Bạn có thể cập nhật nội dung cho {row.title.toLowerCase()} ở đây.
        </p>
        <button
          type="button"
          onClick={() => setEditingKey(null)}
          className="mt-4 rounded-xl border border-[#111827] px-6 py-3 text-[16px] font-semibold text-[#111827]"
        >
          Hoàn tất
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-[#222222]">
      {isEditing ? (
        <button
          type="button"
          aria-label="Đóng chế độ chỉnh sửa"
          onClick={() => setEditingKey(null)}
          className="fixed inset-0 z-10 cursor-default bg-white/70 backdrop-blur-[1px]"
        />
      ) : null}

      <header className="border-b border-[#e5e7eb]">
        <div className="mx-auto flex h-[88px] w-full items-center justify-between px-6 lg:px-16">
          <Link href="/" className="inline-flex items-center text-[#222222]">
            <Image src="/images/VLU-Renting-Logo.svg" alt="VLU Renting" width={140} height={52} className="object-contain" priority />
          </Link>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full border border-[#e5e7eb] bg-white px-5 py-2 text-[14px] font-semibold text-[#222222] transition hover:bg-[#f7f7f7]"
          >
            Hoàn tất
          </button>
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-88px)] grid-cols-1 lg:grid-cols-[296px_minmax(0,1fr)]">
        <aside className="border-r border-[#e5e7eb] px-6 py-8 lg:px-8">
          <h1 className="text-xl font-semibold leading-tight text-[#111827]">Cài đặt tài khoản</h1>

          <div className="mt-6 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.panelKey) {
                    setEditingKey(null);
                    setIsIdentityNavigating(false);
                    setActivePanel(item.panelKey);
                    const nextUrl =
                      item.panelKey === "login_security"
                        ? "/settings?tab=login-security"
                        : item.panelKey === "privacy"
                          ? "/settings?tab=privacy"
                          : item.panelKey === "notifications"
                            ? "/settings?tab=notifications"
                            : item.panelKey === "language_currency"
                              ? "/settings?tab=language-currency"
                          : "/settings";
                    router.replace(nextUrl);
                    return;
                  }
                  if (item.href) router.push(item.href);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] leading-6 text-[#4b5563] transition ${
                  (item.panelKey ? item.panelKey === activePanel : item.active)
                    ? "bg-gray-100 font-medium text-[#111827]"
                    : "hover:bg-[#f7f7f7]"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <section
          className={`px-6 py-8 lg:px-14 ${isLoginSecurityPanel ? "lg:flex lg:flex-col lg:justify-center" : ""}`}
        >
          <div className={`mx-auto w-full ${isLoginSecurityPanel ? "max-w-[720px]" : "max-w-[680px]"}`}>
            {activePanel === "personal" ? (
              <>
            <h2 className="text-[40px] font-semibold leading-[1.1]">Thông tin cá nhân</h2>

            <div className="mt-3 border-b border-[#e5e7eb]">
              {infoRows.map((row) => {
                const rowIsEditing = editingKey === row.key;

                return (
                  <div key={row.key} className={rowIsEditing ? "relative z-20" : ""}>
                    {rowIsEditing ? (
                      renderEditingRow(row)
                    ) : (
                      <RowDisplay
                        title={row.title}
                        value={row.value}
                        action={row.action}
                        onAction={() => {
                          if (isIdentityNavigating) return;
                          if (row.key === "identity") {
                            setIsIdentityNavigating(true);
                            window.setTimeout(() => {
                              router.push("/settings/identity");
                            }, IDENTITY_NAVIGATION_DELAY_MS);
                            return;
                          }
                          if (row.key === "email") {
                            setEditingEmail("");
                          }
                          setEditingKey(row.key);
                        }}
                        disabled={isIdentityNavigating}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className={`mt-6 rounded-2xl border border-[#d1d5db] px-5 py-2 ${isEditing ? "opacity-40" : ""}`}>
              {helpItems.map((item) => (
                <HelpCardItem key={item.title} {...item} />
              ))}
            </div>
              </>
            ) : activePanel === "login_security" ? (
              <LoginSecurityPanel />
            ) : activePanel === "notifications" ? (
              <NotificationsSettingsPanel />
            ) : activePanel === "language_currency" ? (
              <LanguageCurrencySettingsPanel />
            ) : (
              <PrivacySettingsPanel />
            )}
          </div>
        </section>
      </main>

      {isIdentityNavigating ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-[1px]"
          role="status"
          aria-live="polite"
          aria-label="Đang tải trang xác minh danh tính"
        >
          <div className="flex items-center gap-2" aria-hidden>
            {[0, 120, 240].map((delay) => (
              <span
                key={delay}
                className="h-3 w-3 rounded-full bg-[#111827] animate-bounce"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}



