"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getProviders, signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  getSecurityOverview,
  unlinkSecurityProvider,
  type SecurityOverview,
  type SecurityProvider,
} from "@/app/services/security";

type SecurityTabKey = "login" | "access";

type RowItem = {
  label: string;
  description: string;
  actionLabel: string;
  danger?: boolean;
  disabled?: boolean;
};

type SocialRow = RowItem & {
  provider: SecurityProvider;
  connected: boolean;
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
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
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
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
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
  disabled = false,
  onAction,
}: RowItem & { onAction?: () => void }) {
  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6 sm:py-5">
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-medium",
            danger ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-gray-100",
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "mt-1 text-sm leading-6",
            danger ? "text-red-600/90 dark:text-red-300/90" : "text-gray-500 dark:text-gray-400",
          )}
        >
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onAction}
        disabled={disabled}
        className={cn(
          "shrink-0 self-start text-sm font-medium transition hover:underline disabled:cursor-not-allowed disabled:opacity-60 disabled:no-underline",
          danger ? "text-red-600 dark:text-red-400" : "text-gray-700 dark:text-gray-300",
        )}
      >
        {actionLabel}
      </button>
    </div>
  );
}

const providerLabelMap: Record<SecurityProvider, string> = {
  google: "Google",
  facebook: "Facebook",
  apple: "Apple",
};

const accessRows: RowItem[] = [
  {
    label: "Cộng tác viên quản lý tin đăng",
    description:
      "Chưa có ai được cấp quyền. Bạn có thể mời cộng tác viên quản lý nội dung tin đăng.",
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

  const accessToken = session?.user?.accessToken;

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
    } else if (linkError === "1") {
      setActionError("Không thể kết nối tài khoản. Vui lòng thử lại.");
    }
  }, [searchParams]);

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
    setLoadError(null);

    getSecurityOverview(accessToken)
      .then((data) => {
        if (!active) return;
        setSecurityData(data);
      })
      .catch((error) => {
        if (!active) return;
        const message =
          typeof error === "object" &&
          error !== null &&
          "response" in error &&
          (error as { response?: { data?: { message?: string } } }).response?.data?.message
            ? String((error as { response?: { data?: { message?: string } } }).response?.data?.message)
            : "Không thể tải thông tin bảo mật.";
        setLoadError(message);
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, sessionStatus]);

  const socialRows = useMemo<SocialRow[]>(() => {
    const providerMap = new Map(
      (securityData?.providers ?? []).map((item) => [item.provider, item]),
    );

    return (["google", "facebook", "apple"] as SecurityProvider[]).map((provider) => {
      const item = providerMap.get(provider);
      const connected = Boolean(item?.connected);
      return {
        provider,
        connected,
        label: providerLabelMap[provider],
        description: connected
          ? `${providerLabelMap[provider]}: Đã kết nối.`
          : `${providerLabelMap[provider]}: Chưa kết nối.`,
        actionLabel: connected ? "Ngắt kết nối" : "Kết nối",
      };
    });
  }, [securityData]);

  const passwordRow: RowItem = {
    label: "Mật khẩu",
    description: securityData?.hasPassword
      ? "Bạn đã thiết lập mật khẩu cho tài khoản."
      : "Bạn chưa có mật khẩu. Hãy thiết lập để tăng khả năng khôi phục tài khoản.",
    actionLabel: securityData?.hasPassword ? "Đổi mật khẩu" : "Thiết lập mật khẩu",
  };

  const twoFactorRow: RowItem = {
    label: "Xác minh 2 bước",
    description: "Chưa thiết lập. Thêm lớp bảo mật bổ sung khi đăng nhập.",
    actionLabel: "Thiết lập",
  };

  const deviceRows: RowItem[] =
    securityData?.sessions?.map((sessionItem) => ({
      label: sessionItem.current ? "Phiên hiện tại" : "Phiên đăng nhập",
      description: `${sessionItem.device} • ${sessionItem.ip ?? "Không rõ IP"} • ${new Date(
        sessionItem.lastUsedAt,
      ).toLocaleString("vi-VN")}`,
      actionLabel: sessionItem.current ? "Thiết bị này" : "Đăng xuất",
      disabled: sessionItem.current,
    })) ?? [];

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

    await signIn(provider, {
      callbackUrl: "/settings?tab=login-security",
    });
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
      const refreshed = await getSecurityOverview(accessToken);
      setSecurityData(refreshed);
      setSuccessText(`Đã ngắt kết nối ${providerLabelMap[provider]}.`);
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

      {loadError ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadError}
        </div>
      ) : null}
      {successText ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successText}
        </div>
      ) : null}
      {actionError ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {actionError}
        </div>
      ) : null}

      {activeTab === "login" ? (
        <div>
          <Section title="Đăng nhập">
            <SettingsRow {...passwordRow} />
            <SettingsRow {...twoFactorRow} />
          </Section>

          <Section title="Tài khoản mạng xã hội">
            {socialRows.map((row) => {
              const isActionLoading =
                actionKey === `${row.provider}:connect` || actionKey === `${row.provider}:unlink`;
              return (
                <SettingsRow
                  key={row.provider}
                  label={row.label}
                  description={row.description}
                  actionLabel={
                    isActionLoading
                      ? row.connected
                        ? "Đang ngắt..."
                        : "Đang kết nối..."
                      : row.actionLabel
                  }
                  disabled={isActionLoading || isLoading}
                  onAction={() =>
                    row.connected ? handleUnlink(row.provider) : handleConnect(row.provider)
                  }
                />
              );
            })}
          </Section>

          <Section title="Lịch sử thiết bị">
            {deviceRows.length > 0 ? (
              deviceRows.map((row) => <SettingsRow key={row.description} {...row} />)
            ) : (
              <div className="py-4 text-sm text-gray-500">
                {isLoading ? "Đang tải lịch sử thiết bị..." : "Không có phiên đăng nhập nào."}
              </div>
            )}
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
    </>
  );
}

