"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getProviders, signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  changePassword,
  getSecurityOverview,
  type ChangePasswordInput,
  unlinkSecurityProvider,
  type LinkedSecurityProviderItem,
  type SecurityOverview,
  type SecurityProvider,
} from "@/app/services/security";

type SecurityTabKey = "login" | "access";

type RowItem = {
  label: string;
  description: string;
  actionLabel: string;
  disabled?: boolean;
  actionTone?: "default" | "danger";
  leadingIcon?: ReactNode;
  badgeLabel?: string;
};

type SocialRow = RowItem & {
  provider: SecurityProvider;
};

type DeviceRow = RowItem & {
  rowKey: string;
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function createEmptyPasswordForm(): PasswordFormState {
  return {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  };
}

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
    <div className="mb-6 border-b border-gray-200">
      <div className="flex items-end gap-6">
        <button
          type="button"
          onClick={() => onChange("login")}
          className={cn(
            "border-b-2 pb-3 text-sm font-medium transition",
            activeTab === "login"
              ? "border-black text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700",
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
              ? "border-black text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700",
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
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-8", className)}>
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function DeviceDesktopIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="4.5" width="17" height="11" rx="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19.5h6M12 15.5v4" />
    </svg>
  );
}

function DevicePhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="7.5" y="2.5" width="9" height="19" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.5h2M11 18.5h2" />
    </svg>
  );
}

function SettingsRow({
  label,
  description,
  actionLabel,
  disabled = false,
  actionTone = "default",
  leadingIcon,
  badgeLabel,
  onAction,
}: RowItem & { onAction?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-gray-200 py-5">
      <div className="flex min-w-0 items-start gap-3">
        {leadingIcon ? (
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-gray-500">
            {leadingIcon}
          </span>
        ) : null}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-medium text-gray-900">{label}</p>
            {badgeLabel ? (
              <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                {badgeLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className={cn(
          "shrink-0 self-start pt-0.5 text-sm transition hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline",
          actionTone === "danger"
            ? "text-red-500 hover:text-red-600"
            : "text-gray-700 hover:text-gray-900",
        )}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function PasswordEditor({
  hasPassword,
  form,
  error,
  isSaving,
  onChange,
  onCancel,
  onSubmit,
}: {
  hasPassword: boolean;
  form: PasswordFormState;
  error: string | null;
  isSaving: boolean;
  onChange: (field: keyof PasswordFormState, value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="grid gap-3">
        {hasPassword ? (
          <label className="grid gap-1 text-sm text-gray-600">
            <span>Mật khẩu hiện tại</span>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(event) => onChange("currentPassword", event.target.value)}
              className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-gray-900"
            />
          </label>
        ) : null}

        <label className="grid gap-1 text-sm text-gray-600">
          <span>{hasPassword ? "Mật khẩu mới" : "Mật khẩu"}</span>
          <input
            type="password"
            value={form.newPassword}
            onChange={(event) => onChange("newPassword", event.target.value)}
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-gray-900"
          />
        </label>

        <label className="grid gap-1 text-sm text-gray-600">
          <span>Xác nhận mật khẩu mới</span>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(event) => onChange("confirmPassword", event.target.value)}
            className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-gray-900"
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-gray-500">Mật khẩu phải có ít nhất 8 ký tự.</p>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Huy
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSaving}
          className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Đang lưu..." : hasPassword ? "Cập nhật mật khẩu" : "Tạo mật khẩu"}
        </button>
      </div>
    </div>
  );
}

const providerLabelMap: Record<SecurityProvider, string> = {
  google: "Google",
  facebook: "Facebook",
  apple: "Apple",
};

const allProviders: SecurityProvider[] = ["google", "facebook", "apple"];

const accessRows: RowItem[] = [
  {
    label: "Cộng tác viên quản lý tin đăng",
    description: "Chưa có ai được cấp quyền.",
    actionLabel: "Mời người dùng",
  },
  {
    label: "Quyền hiện tại",
    description: "Bạn đang là chủ sở hữu tài khoản với toàn quyền quản trị.",
    actionLabel: "Xem quyền",
  },
  {
    label: "Nhật ký chia sẻ",
    description: "Chưa có hoạt động.",
    actionLabel: "Làm mới",
  },
];

export default function LoginSecurityPanel() {
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<SecurityTabKey>("login");
  const [securityData, setSecurityData] = useState<SecurityOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);
  const [availableProviders, setAvailableProviders] = useState<Record<string, boolean>>({});
  const [showConnectProviders, setShowConnectProviders] = useState(false);
  const [showPasswordEditor, setShowPasswordEditor] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(createEmptyPasswordForm);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const accessToken = session?.user?.accessToken;
  const loadSecurityOverview = useCallback(async (token: string) => {
    try {
      const data = await getSecurityOverview(token);
      setSecurityData(data);
      setLoadError(null);
      return true;
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? String((error as { response?: { data?: { message?: string } } }).response?.data?.message)
          : "Không thể tải thông tin bảo mật.";
      setLoadError(message);
      return false;
    }
  }, []);

  useEffect(() => {
    getProviders()
      .then((providers) => {
        const map: Record<string, boolean> = {};
        Object.keys(providers ?? {}).forEach((provider) => {
          map[provider] = true;
        });
        setAvailableProviders(map);
      })
      .catch(() => {
        setAvailableProviders({});
      });
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.cookie = "oauth_link_mode=; Max-Age=0; Path=/; SameSite=Lax";
    document.cookie = "oauth_link_token=; Max-Age=0; Path=/; SameSite=Lax";
  }, []);

  useEffect(() => {
    const linked = searchParams.get("linked");
    const linkError = searchParams.get("linkError");
    if (linked === "1") {
      setSuccessText("Đã kết nối tài khoản thành công.");
      setActionError(null);
      setActionKey(null);
      setShowConnectProviders(false);
      if (accessToken) {
        setIsLoading(true);
        loadSecurityOverview(accessToken).finally(() => {
          setIsLoading(false);
        });
      }
    } else if (linkError === "1") {
      setActionError("Không thể kết nối tài khoản. Vui lòng thử lại.");
      setActionKey(null);
    } else {
      setActionKey(null);
    }
  }, [searchParams, accessToken, loadSecurityOverview]);

  useEffect(() => {
    if (activeTab !== "login") {
      setShowConnectProviders(false);
      setShowPasswordEditor(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!showPasswordEditor) {
      setPasswordForm(createEmptyPasswordForm());
      setPasswordError(null);
    }
  }, [showPasswordEditor]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setLoadError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      setIsLoading(false);
      setSecurityData(null);
      return;
    }

    let active = true;
    setIsLoading(true);
    loadSecurityOverview(accessToken).finally(() => {
      if (!active) return;
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [accessToken, sessionStatus, loadSecurityOverview]);

  const refreshSecurityOverview = useCallback(async () => {
    if (!accessToken) return false;
    setIsLoading(true);
    const ok = await loadSecurityOverview(accessToken);
    setIsLoading(false);
    return ok;
  }, [accessToken, loadSecurityOverview]);

  const linkedProviders = useMemo<LinkedSecurityProviderItem[]>(() => {
    if (securityData?.linkedProviders?.length) {
      return securityData.linkedProviders;
    }

    return (securityData?.providers ?? [])
      .filter((providerItem) => providerItem.connected)
      .map((providerItem) => ({
        provider: providerItem.provider,
        email: providerItem.email,
        linkedAt: providerItem.linkedAt,
      }));
  }, [securityData]);

  const socialRows = useMemo<SocialRow[]>(
    () =>
      linkedProviders.map((providerItem) => ({
        provider: providerItem.provider,
        label: providerLabelMap[providerItem.provider],
        description: "Đã kết nối",
        actionLabel: "Ngắt kết nối",
      })),
    [linkedProviders],
  );

  const unlinkedProviders = useMemo<SecurityProvider[]>(
    () =>
      allProviders.filter(
        (provider) => !linkedProviders.some((linkedProvider) => linkedProvider.provider === provider),
      ),
    [linkedProviders],
  );

  useEffect(() => {
    if (unlinkedProviders.length === 0) {
      setShowConnectProviders(false);
    }
  }, [unlinkedProviders]);

  const passwordRow: RowItem = {
    label: "Mật khẩu",
    description: securityData?.hasPassword ? "Đã tạo" : "Chưa tạo",
    actionLabel: securityData?.hasPassword ? "Đổi" : "Tạo",
  };

  const twoFactorRow: RowItem = {
    label: "Xác minh 2 bước",
    description: "Chưa bật",
    actionLabel: "Thiết lập",
  };

  const deviceRows = useMemo<DeviceRow[]>(() => {
    return (
      securityData?.sessions?.map((sessionItem, index) => {
        const deviceName = sessionItem.device || "Thiết bị không xác định";
        const isMobile = /(iphone|android|mobile|phone|ipad)/i.test(deviceName);
        const timeText = new Date(sessionItem.lastUsedAt).toLocaleString("vi-VN");
        const ipText = sessionItem.ip ? ` · IP ${sessionItem.ip}` : "";

        return {
          rowKey: `${deviceName}-${sessionItem.lastUsedAt}-${sessionItem.ip ?? "na"}-${index}`,
          label: deviceName,
          description: `Đăng nhập: ${timeText}${ipText}`,
          actionLabel: sessionItem.current ? "Thiết bị này" : "Đăng xuất",
          disabled: sessionItem.current,
          badgeLabel: sessionItem.current ? "Phiên hiện tại" : undefined,
          leadingIcon: isMobile ? <DevicePhoneIcon /> : <DeviceDesktopIcon />,
        };
      }) ?? []
    );
  }, [securityData]);

  const disableAccountRow: RowItem = {
    label: "Vô hiệu hóa tài khoản",
    description: "Tạm dừng tài khoản và giới hạn quyền truy cập cho đến khi bạn kích hoạt lại.",
    actionLabel: "Vô hiệu hóa",
    actionTone: "danger",
  };

  const handleConnect = async (provider: SecurityProvider) => {
    if (!accessToken) {
      setActionError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      return;
    }
    if (!availableProviders[provider]) {
      setActionError(`${providerLabelMap[provider]} chưa được cấu hình OAuth.`);
      return;
    }

    setActionError(null);
    setSuccessText(null);
    setActionKey(`${provider}:connect`);

    document.cookie = `oauth_link_mode=${provider}; Max-Age=600; Path=/; SameSite=Lax`;
    document.cookie = `oauth_link_token=${encodeURIComponent(
      accessToken,
    )}; Max-Age=600; Path=/; SameSite=Lax`;

    try {
      const result = await signIn(provider, {
        callbackUrl: "/settings?tab=login-security",
      });

      if (result && typeof result === "object" && "error" in result && result.error) {
        setActionError("Không thể kết nối tài khoản. Vui lòng thử lại.");
      }
    } catch {
      setActionError("Không thể kết nối tài khoản. Vui lòng thử lại.");
    } finally {
      setActionKey(null);
    }
  };

  const handleUnlink = async (provider: SecurityProvider) => {
    if (!accessToken) {
      setActionError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    setActionError(null);
    setSuccessText(null);
    setActionKey(`${provider}:unlink`);
    try {
      await unlinkSecurityProvider(provider, accessToken);
      await refreshSecurityOverview();
      setSuccessText(`Đã ngắt kết nối ${providerLabelMap[provider]}.`);
      setShowConnectProviders(false);
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? String((error as { response?: { data?: { message?: string } } }).response?.data?.message)
          : `Không thể ngắt kết nối ${providerLabelMap[provider]}.`;
      setActionError(message);
    } finally {
      setActionKey(null);
    }
  };

  const updatePasswordField = (field: keyof PasswordFormState, value: string) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handlePasswordRowAction = () => {
    setSuccessText(null);
    setActionError(null);
    setPasswordError(null);
    setShowPasswordEditor((current) => !current);
  };

  const handleChangePassword = async () => {
    if (!accessToken) {
      setPasswordError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    const hasPassword = Boolean(securityData?.hasPassword);
    const payload: ChangePasswordInput = {
      newPassword: passwordForm.newPassword,
    };

    if (hasPassword) {
      payload.currentPassword = passwordForm.currentPassword;
    }

    if (hasPassword && !passwordForm.currentPassword.trim()) {
      setPasswordError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (passwordForm.newPassword.trim().length < 8) {
      setPasswordError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Xác nhận mật khẩu không khớp.");
      return;
    }

    setPasswordError(null);
    setActionError(null);
    setSuccessText(null);
    setIsChangingPassword(true);

    try {
      const response = await changePassword(payload, accessToken);
      await refreshSecurityOverview();
      setSuccessText(
        typeof response?.message === "string"
          ? response.message
          : hasPassword
            ? "Đã cập nhật mật khẩu."
            : "Đã tạo mật khẩu.",
      );
      setShowPasswordEditor(false);
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? String((error as { response?: { data?: { message?: string } } }).response?.data?.message)
          : "Không thể cập nhật mật khẩu.";
      setPasswordError(message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <>
      <header className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Đăng nhập và bảo mật</h2>
      </header>

      <Tabs activeTab={activeTab} onChange={setActiveTab} />

      {loadError ? (
        <p className="mb-3 border-l border-red-300 pl-3 text-sm text-red-600">{loadError}</p>
      ) : null}
      {successText ? (
        <p className="mb-3 border-l border-gray-300 pl-3 text-sm text-gray-600">{successText}</p>
      ) : null}
      {actionError ? (
        <p className="mb-3 border-l border-red-300 pl-3 text-sm text-red-600">{actionError}</p>
      ) : null}

      {activeTab === "login" ? (
        <div>
          <Section title="Đăng nhập" className="mt-0">
            <SettingsRow {...passwordRow} onAction={handlePasswordRowAction} />
            {showPasswordEditor ? (
              <div className="border-b border-gray-200 pb-5">
                <PasswordEditor
                  hasPassword={Boolean(securityData?.hasPassword)}
                  form={passwordForm}
                  error={passwordError}
                  isSaving={isChangingPassword}
                  onChange={updatePasswordField}
                  onCancel={() => setShowPasswordEditor(false)}
                  onSubmit={handleChangePassword}
                />
              </div>
            ) : null}
            <SettingsRow {...twoFactorRow} />
          </Section>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Tài khoản mạng xã hội</h2>
              {unlinkedProviders.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setShowConnectProviders((current) => !current)}
                  className="text-sm text-gray-700 transition hover:underline"
                >
                  {showConnectProviders ? "Thu gọn" : "Kết nối thêm"}
                </button>
              ) : null}
            </div>

            {socialRows.length > 0 ? (
              <div>
                {socialRows.map((row) => {
                  const isActionLoading = actionKey === `${row.provider}:unlink`;
                  return (
                    <SettingsRow
                      key={row.provider}
                      label={row.label}
                      description={row.description}
                      actionLabel={isActionLoading ? "Đang ngắt..." : row.actionLabel}
                      disabled={isActionLoading || isLoading}
                      onAction={() => handleUnlink(row.provider)}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="border-b border-gray-200 py-5">
                <p className="text-sm font-medium text-gray-900">
                  Bạn chưa kết nối tài khoản mạng xã hội nào.
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Kết nối để đăng nhập nhanh và khôi phục tài khoản.
                </p>
                {unlinkedProviders.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowConnectProviders(true)}
                    className="mt-3 text-sm text-gray-700 transition hover:underline"
                  >
                    Kết nối tài khoản
                  </button>
                ) : null}
              </div>
            )}

            {showConnectProviders && unlinkedProviders.length > 0 ? (
              <div className="mt-3">
                {unlinkedProviders.map((provider) => {
                  const isProviderConfigured = Boolean(availableProviders[provider]);
                  const isActionLoading = actionKey === `${provider}:connect`;
                  return (
                    <SettingsRow
                      key={`connect-${provider}`}
                      label={providerLabelMap[provider]}
                      description={
                        isProviderConfigured
                          ? "Chưa kết nối"
                          : "Nhà cung cấp này chưa được cấu hình."
                      }
                      actionLabel={
                        isProviderConfigured
                          ? isActionLoading
                            ? "Đang kết nối..."
                            : "Kết nối"
                          : "Không khả dụng"
                      }
                      disabled={!isProviderConfigured || isActionLoading || isLoading}
                      onAction={isProviderConfigured ? () => handleConnect(provider) : undefined}
                    />
                  );
                })}
              </div>
            ) : null}
          </section>

          <Section title="Lịch sử thiết bị">
            {deviceRows.length > 0 ? (
              deviceRows.map((row) => <SettingsRow key={row.rowKey} {...row} />)
            ) : (
              <p className="border-b border-gray-200 py-5 text-sm text-gray-500">
                {isLoading ? "Đang tải lịch sử thiết bị..." : "Không có phiên đăng nhập nào."}
              </p>
            )}
          </Section>

          <Section title="Tài khoản">
            <SettingsRow {...disableAccountRow} />
          </Section>
        </div>
      ) : (
        <div>
          <Section title="Chia sẻ quyền truy cập" className="mt-0">
            {accessRows.map((row) => (
              <SettingsRow key={row.label} {...row} />
            ))}
          </Section>
        </div>
      )}
    </>
  );
}
