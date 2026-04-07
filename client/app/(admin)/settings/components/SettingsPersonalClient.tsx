"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import LanguageCurrencySettingsPanel from "./LanguageCurrencySettingsPanel";
import LoginSecurityPanel from "./LoginSecurityPanel";
import NotificationsSettingsPanel from "./NotificationsSettingsPanel";
import PrivacySettingsPanel from "./PrivacySettingsPanel";
import {
  getSettingsOverview,
  updateSettingsPersonal,
  type SettingsOverview,
  type UpdateSettingsPersonalInput,
} from "@/app/services/security";

type Props = {
  initialPanel?: "personal" | "login_security" | "privacy" | "notifications" | "language_currency";
};

type SettingsPanelKey =
  | "personal"
  | "login_security"
  | "privacy"
  | "notifications"
  | "language_currency";

type InfoKey =
  | "legal_name"
  | "preferred_name"
  | "email"
  | "phone"
  | "identity"
  | "residence"
  | "mailing"
  | "emergency";

type PersonalDraft = {
  legalName: string;
  preferredName: string;
  email: string;
  phoneNumber: string;
  residenceAddress: string;
  mailingAddress: string;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyEmail: string;
  emergencyPhone: string;
};

type FeedbackState = {
  tone: "success" | "error";
  text: string;
} | null;

type MenuItem = {
  label: string;
  icon: ReactNode;
  panelKey: SettingsPanelKey;
};

const MISSING_VALUE = "Chưa cập nhật";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function MenuIcon({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center text-gray-500 dark:text-slate-400">
      {children}
    </span>
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
    <div className="flex items-start justify-between gap-5 border-b border-[#e5e7eb] py-5 dark:border-white/12">
      <div className="min-w-0 flex-1 pr-3">
        <p className="text-[17px] font-semibold leading-6 text-[#111827] dark:text-slate-100">
          {title}
        </p>
        <p className="mt-1 text-[14px] leading-6 text-[#6b7280] dark:text-slate-300">{value}</p>
      </div>
      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className="shrink-0 pt-1 text-[14px] font-semibold text-[#374151] underline underline-offset-4 hover:text-[#111827] disabled:cursor-not-allowed disabled:text-[#9ca3af] disabled:no-underline dark:text-slate-200 dark:hover:text-white dark:disabled:text-slate-500"
      >
        {action}
      </button>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-gray-900 dark:border-white/12 dark:bg-slate-950 dark:text-slate-100"
      />
    </label>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-gray-700 dark:text-slate-200">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="min-h-[112px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 dark:border-white/12 dark:bg-slate-950 dark:text-slate-100"
      />
    </label>
  );
}

function extractErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { data?: { message?: string | string[] } } }).response?.data?.message
  ) {
    const message = (error as { response?: { data?: { message?: string | string[] } } }).response
      ?.data?.message;
    return Array.isArray(message) ? message.join(", ") : String(message);
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function maskEmail(email: string) {
  if (!email || !email.includes("@")) return email || MISSING_VALUE;
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return email;
  return `${localPart.slice(0, 2)}***@${domain}`;
}

function formatIdentityStatus(status?: SettingsOverview["identity"]["status"]) {
  if (status === "verified") return "Đã xác minh";
  if (status === "pending") return "Đang chờ duyệt";
  if (status === "rejected") return "Đã bị từ chối, cần bổ sung lại";
  return "Chưa bắt đầu";
}

function buildDraft(settings: SettingsOverview | null): PersonalDraft {
  return {
    legalName: settings?.personal.legalName ?? "",
    preferredName: settings?.personal.preferredName ?? "",
    email: settings?.personal.email ?? "",
    phoneNumber: settings?.personal.phoneNumber ?? "",
    residenceAddress: settings?.personal.residenceAddress ?? "",
    mailingAddress: settings?.personal.mailingAddress ?? "",
    emergencyName: settings?.personal.emergencyContact.name ?? "",
    emergencyRelationship: settings?.personal.emergencyContact.relationship ?? "",
    emergencyEmail: settings?.personal.emergencyContact.email ?? "",
    emergencyPhone: settings?.personal.emergencyContact.phone ?? "",
  };
}

export default function SettingsPersonalClient({
  initialPanel = "personal",
}: Props) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [activePanel, setActivePanel] = useState<SettingsPanelKey>(initialPanel);
  const [settings, setSettings] = useState<SettingsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<InfoKey | null>(null);
  const [draft, setDraft] = useState<PersonalDraft>(buildDraft(null));
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const accessToken = session?.user?.accessToken;

  useEffect(() => {
    setActivePanel(initialPanel);
  }, [initialPanel]);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (!accessToken) {
      setIsLoading(false);
      setFeedback({
        tone: "error",
        text: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để cập nhật cài đặt.",
      });
      return;
    }

    let active = true;
    setIsLoading(true);

    getSettingsOverview(accessToken)
      .then((data) => {
        if (!active) return;
        setSettings(data);
        setDraft(buildDraft(data));
        setFeedback(null);
      })
      .catch((error) => {
        if (!active) return;
        setFeedback({
          tone: "error",
          text: extractErrorMessage(error, "Không thể tải cài đặt tài khoản."),
        });
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, sessionStatus]);

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
    {
      label: "Ngôn ngữ và tiền tệ",
      panelKey: "language_currency",
      icon: (
        <MenuIcon>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16M9 5v2a7 7 0 01-2.1 5L4 15m6-3 6 7m-3-7a26.1 26.1 0 003-7" />
          </svg>
        </MenuIcon>
      ),
    },
  ];

  const personalRows = useMemo(() => {
    const personal = settings?.personal;
    return [
      {
        key: "legal_name" as const,
        title: "Tên pháp lý",
        value: personal?.legalName?.trim() || MISSING_VALUE,
        action: personal?.legalName?.trim() ? "Chỉnh sửa" : "Thêm",
      },
      {
        key: "preferred_name" as const,
        title: "Tên ưa dùng",
        value: personal?.preferredName?.trim() || MISSING_VALUE,
        action: personal?.preferredName?.trim() ? "Chỉnh sửa" : "Thêm",
      },
      {
        key: "email" as const,
        title: "Địa chỉ email",
        value: personal?.email ? maskEmail(personal.email) : MISSING_VALUE,
        action: "Chỉnh sửa",
      },
      {
        key: "phone" as const,
        title: "Số điện thoại",
        value: personal?.phoneNumber?.trim() || MISSING_VALUE,
        action: personal?.phoneNumber?.trim() ? "Chỉnh sửa" : "Thêm",
      },
      {
        key: "identity" as const,
        title: "Xác minh danh tính",
        value: formatIdentityStatus(settings?.identity.status),
        action: settings?.identity.isVerified ? "Xem" : "Bắt đầu",
      },
      {
        key: "residence" as const,
        title: "Địa chỉ cư trú",
        value: personal?.residenceAddress?.trim() || MISSING_VALUE,
        action: personal?.residenceAddress?.trim() ? "Chỉnh sửa" : "Thêm",
      },
      {
        key: "mailing" as const,
        title: "Địa chỉ gửi thư",
        value: personal?.mailingAddress?.trim() || MISSING_VALUE,
        action: personal?.mailingAddress?.trim() ? "Chỉnh sửa" : "Thêm",
      },
      {
        key: "emergency" as const,
        title: "Liên hệ trong trường hợp khẩn cấp",
        value:
          settings?.personal.emergencyContact.name?.trim()
            ? [
                settings.personal.emergencyContact.name.trim(),
                settings.personal.emergencyContact.relationship.trim(),
                settings.personal.emergencyContact.phone.trim(),
              ]
                .filter(Boolean)
                .join(" • ")
            : MISSING_VALUE,
        action: settings?.personal.emergencyContact.name?.trim() ? "Chỉnh sửa" : "Thêm",
      },
    ];
  }, [settings]);

  function openEditor(key: InfoKey) {
    if (key === "identity") {
      router.push("/settings/identity");
      return;
    }

    setFeedback(null);
    setDraft(buildDraft(settings));
    setEditingKey(key);
  }

  function closeEditor() {
    setEditingKey(null);
    setDraft(buildDraft(settings));
  }

  async function handleSave() {
    if (!editingKey || !accessToken || isSaving) return;

    let payload: UpdateSettingsPersonalInput = {};
    if (editingKey === "legal_name") {
      payload = { legalName: draft.legalName };
    } else if (editingKey === "preferred_name") {
      payload = { preferredName: draft.preferredName };
    } else if (editingKey === "email") {
      payload = { email: draft.email };
    } else if (editingKey === "phone") {
      payload = { phoneNumber: draft.phoneNumber };
    } else if (editingKey === "residence") {
      payload = { residenceAddress: draft.residenceAddress };
    } else if (editingKey === "mailing") {
      payload = { mailingAddress: draft.mailingAddress };
    } else if (editingKey === "emergency") {
      payload = {
        emergencyName: draft.emergencyName,
        emergencyRelationship: draft.emergencyRelationship,
        emergencyEmail: draft.emergencyEmail,
        emergencyPhone: draft.emergencyPhone,
      };
    }

    setIsSaving(true);
    try {
      const nextSettings = await updateSettingsPersonal(payload, accessToken);
      setSettings(nextSettings);
      setDraft(buildDraft(nextSettings));
      setEditingKey(null);
      setFeedback({
        tone: "success",
        text: "Đã cập nhật thông tin tài khoản.",
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        text: extractErrorMessage(error, "Không thể lưu thay đổi. Vui lòng thử lại."),
      });
    } finally {
      setIsSaving(false);
    }
  }

  function renderEditor() {
    if (!editingKey) return null;

    return (
      <div className="rounded-2xl border border-[#d1d5db] bg-white p-5 shadow-sm dark:border-white/12 dark:bg-slate-950">
        <div className="grid gap-4">
          {editingKey === "legal_name" ? (
            <InputField
              label="Tên pháp lý"
              value={draft.legalName}
              onChange={(value) => setDraft((current) => ({ ...current, legalName: value }))}
              placeholder="Nhập họ và tên trên giấy tờ"
            />
          ) : null}

          {editingKey === "preferred_name" ? (
            <InputField
              label="Tên ưa dùng"
              value={draft.preferredName}
              onChange={(value) =>
                setDraft((current) => ({ ...current, preferredName: value }))
              }
              placeholder="Tên hiển thị cho người dùng khác"
            />
          ) : null}

          {editingKey === "email" ? (
            <InputField
              label="Địa chỉ email"
              type="email"
              value={draft.email}
              onChange={(value) => setDraft((current) => ({ ...current, email: value }))}
              placeholder="you@example.com"
            />
          ) : null}

          {editingKey === "phone" ? (
            <InputField
              label="Số điện thoại"
              type="tel"
              value={draft.phoneNumber}
              onChange={(value) =>
                setDraft((current) => ({ ...current, phoneNumber: value }))
              }
              placeholder="Nhập số điện thoại"
            />
          ) : null}

          {editingKey === "residence" ? (
            <TextareaField
              label="Địa chỉ cư trú"
              value={draft.residenceAddress}
              onChange={(value) =>
                setDraft((current) => ({ ...current, residenceAddress: value }))
              }
              placeholder="Nhập địa chỉ cư trú hiện tại"
            />
          ) : null}

          {editingKey === "mailing" ? (
            <TextareaField
              label="Địa chỉ gửi thư"
              value={draft.mailingAddress}
              onChange={(value) =>
                setDraft((current) => ({ ...current, mailingAddress: value }))
              }
              placeholder="Nhập địa chỉ nhận thư"
            />
          ) : null}

          {editingKey === "emergency" ? (
            <div className="grid gap-4">
              <InputField
                label="Tên người liên hệ"
                value={draft.emergencyName}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, emergencyName: value }))
                }
              />
              <InputField
                label="Mối quan hệ"
                value={draft.emergencyRelationship}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, emergencyRelationship: value }))
                }
              />
              <InputField
                label="Email"
                type="email"
                value={draft.emergencyEmail}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, emergencyEmail: value }))
                }
              />
              <InputField
                label="Số điện thoại"
                type="tel"
                value={draft.emergencyPhone}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, emergencyPhone: value }))
                }
              />
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={closeEditor}
            disabled={isSaving}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/12 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-xl bg-[#111827] px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    );
  }

  function navigateToPanel(panelKey: SettingsPanelKey) {
    setEditingKey(null);
    setFeedback(null);
    setActivePanel(panelKey);

    const nextUrl =
      panelKey === "login_security"
        ? "/settings?tab=login-security"
        : panelKey === "privacy"
          ? "/settings?tab=privacy"
          : panelKey === "notifications"
            ? "/settings?tab=notifications"
            : panelKey === "language_currency"
              ? "/settings?tab=language-currency"
              : "/settings";

    router.replace(nextUrl);
  }

  return (
    <div className="min-h-screen bg-white text-[#222222] dark:text-slate-100">
      <header className="border-b border-[#e5e7eb] dark:border-white/12">
        <div className="mx-auto flex h-[88px] w-full items-center justify-between px-6 lg:px-16">
          <Link href="/" className="inline-flex items-center text-[#222222] dark:text-slate-100">
            <Image
              src="/images/VLU-Renting-Logo.svg"
              alt="VLU Renting"
              width={140}
              height={52}
              className="object-contain"
              priority
            />
          </Link>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full border border-[#e5e7eb] bg-white px-5 py-2 text-[14px] font-semibold text-[#222222] transition hover:bg-[#f7f7f7] dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            Hoàn tất
          </button>
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-88px)] grid-cols-1 lg:grid-cols-[296px_minmax(0,1fr)]">
        <aside className="border-r border-[#e5e7eb] px-6 py-8 lg:px-8 dark:border-white/12">
          <h1 className="text-xl font-semibold leading-tight text-[#111827] dark:text-slate-50">
            Cài đặt tài khoản
          </h1>

          <div className="mt-6 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigateToPanel(item.panelKey)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] leading-6 text-[#4b5563] transition dark:text-slate-300",
                  item.panelKey === activePanel
                    ? "bg-gray-100 font-medium text-[#111827] dark:bg-white/10 dark:text-white"
                    : "hover:bg-[#f7f7f7] dark:hover:bg-white/5",
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <section
          className={cn(
            "px-6 py-8 lg:px-14",
            activePanel === "login_security" ? "lg:flex lg:flex-col lg:justify-center" : "",
          )}
        >
          <div className={cn("mx-auto w-full", activePanel === "login_security" ? "max-w-[720px]" : "max-w-[680px]")}>
            {activePanel === "personal" ? (
              <>
                <div className="space-y-2">
                  <h2 className="text-[40px] font-semibold leading-[1.1] dark:text-slate-50">
                    Thông tin cá nhân
                  </h2>
                  <p className="text-[15px] leading-7 text-[#6b7280] dark:text-slate-300">
                    Quản lý thông tin liên hệ và dữ liệu cá nhân đang được dùng cho tài khoản
                    của bạn.
                  </p>
                </div>

                {feedback ? (
                  <div
                    className={cn(
                      "mt-5 rounded-xl border px-4 py-3 text-sm",
                      feedback.tone === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-rose-200 bg-rose-50 text-rose-700",
                    )}
                  >
                    {feedback.text}
                  </div>
                ) : null}

                {isLoading ? (
                  <div className="mt-6 rounded-2xl border border-[#d1d5db] bg-[#f9fafb] px-5 py-4 text-sm text-[#4b5563] dark:border-white/12 dark:bg-white/5 dark:text-slate-300">
                    Đang tải thông tin tài khoản...
                  </div>
                ) : (
                  <>
                    <div className="mt-6 border-b border-[#e5e7eb] dark:border-white/12">
                      {personalRows.map((row) => (
                        <div key={row.key}>
                          {editingKey === row.key ? (
                            <div className="py-5">{renderEditor()}</div>
                          ) : (
                            <RowDisplay
                              title={row.title}
                              value={row.value}
                              action={row.action}
                              onAction={() => openEditor(row.key)}
                              disabled={isSaving}
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 rounded-2xl border border-[#d1d5db] px-5 py-4 dark:border-white/12 dark:bg-white/5">
                      <p className="text-sm font-semibold text-[#111827] dark:text-slate-100">
                        Vai trò tài khoản
                      </p>
                      <p className="mt-1 text-sm text-[#6b7280] dark:text-slate-300">
                        {settings?.account.role
                          ? settings.account.role.replace(/^\w/, (char) => char.toUpperCase())
                          : MISSING_VALUE}
                      </p>
                    </div>
                  </>
                )}
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
    </div>
  );
}
