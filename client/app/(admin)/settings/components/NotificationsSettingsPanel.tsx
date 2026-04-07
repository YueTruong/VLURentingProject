"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  getSettingsOverview,
  updateSettingsPreferences,
  type SettingsNotificationPreferences,
  type SettingsOverview,
  type UpdateSettingsPreferencesInput,
} from "@/app/services/security";

type NotificationTabKey = "offers" | "account";

type OfferKey =
  | "hostRecognition"
  | "tripOffers"
  | "priceSuggestions"
  | "hostPerks"
  | "newsAndPrograms"
  | "localRegulations"
  | "inspirationAndDeals"
  | "tripPlanning";

type AccountKey =
  | "newDeviceLogin"
  | "securityUpdates"
  | "paymentActivity"
  | "profileReminders"
  | "verificationReminders"
  | "supportTips";

type NotificationItem<Key extends string> = {
  key: Key;
  title: string;
  helper?: string;
};

type NotificationState = {
  stopAllMarketingEmails: boolean;
  offers: Record<OfferKey, boolean>;
  account: Record<AccountKey, boolean>;
};

const FEEDBACK_TOAST_ID = "notifications-settings-feedback";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-all duration-200",
        checked
          ? "border-[#d51f35] bg-[#d51f35]"
          : "border-gray-300 bg-gray-300/90 dark:border-white/12 dark:bg-slate-700/80",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-1 transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

const offersItems: NotificationItem<OfferKey>[] = [
  { key: "hostRecognition", title: "Sự công nhận và thành tích" },
  { key: "tripOffers", title: "Thông tin chuyến đi và ưu đãi" },
  { key: "priceSuggestions", title: "Xu hướng và đề xuất về giá" },
  { key: "hostPerks", title: "Ưu đãi đặc biệt cho chủ trọ" },
  { key: "newsAndPrograms", title: "Tin tức và chương trình" },
  { key: "localRegulations", title: "Luật và quy định địa phương" },
  { key: "inspirationAndDeals", title: "Cảm hứng và ưu đãi" },
  { key: "tripPlanning", title: "Lập kế hoạch chuyến đi" },
];

const accountItems: NotificationItem<AccountKey>[] = [
  {
    key: "newDeviceLogin",
    title: "Đăng nhập từ thiết bị mới",
    helper: "Thông báo khi tài khoản được truy cập từ thiết bị hoặc vị trí lạ.",
  },
  {
    key: "securityUpdates",
    title: "Cập nhật bảo mật",
    helper: "Thông tin về thay đổi mật khẩu, xác minh và các cảnh báo quan trọng.",
  },
  {
    key: "paymentActivity",
    title: "Hoạt động thanh toán",
    helper: "Nhận thông báo về giao dịch, hóa đơn và trạng thái thanh toán.",
  },
  {
    key: "profileReminders",
    title: "Nhắc hoàn tất hồ sơ",
  },
  {
    key: "verificationReminders",
    title: "Nhắc xác minh thông tin",
  },
  {
    key: "supportTips",
    title: "Hỗ trợ và mẹo sử dụng",
  },
];

function buildNotificationState(settings: SettingsOverview): NotificationState {
  const notifications = settings.preferences.notifications;
  return {
    stopAllMarketingEmails: notifications.stopAllMarketingEmails,
    offers: { ...notifications.offers },
    account: { ...notifications.account },
  };
}

function mapOfferKeyToPayload(key: OfferKey, value: boolean): UpdateSettingsPreferencesInput {
  switch (key) {
    case "hostRecognition":
      return { notifyOfferHostRecognition: value };
    case "tripOffers":
      return { notifyOfferTripOffers: value };
    case "priceSuggestions":
      return { notifyOfferPriceSuggestions: value };
    case "hostPerks":
      return { notifyOfferHostPerks: value };
    case "newsAndPrograms":
      return { notifyOfferNewsAndPrograms: value };
    case "localRegulations":
      return { notifyOfferLocalRegulations: value };
    case "inspirationAndDeals":
      return { notifyOfferInspirationAndDeals: value };
    case "tripPlanning":
      return { notifyOfferTripPlanning: value };
  }
}

function mapAccountKeyToPayload(
  key: AccountKey,
  value: boolean,
): UpdateSettingsPreferencesInput {
  switch (key) {
    case "newDeviceLogin":
      return { notifyAccountNewDeviceLogin: value };
    case "securityUpdates":
      return { notifyAccountSecurityUpdates: value };
    case "paymentActivity":
      return { notifyAccountPaymentActivity: value };
    case "profileReminders":
      return { notifyAccountProfileReminders: value };
    case "verificationReminders":
      return { notifyAccountVerificationReminders: value };
    case "supportTips":
      return { notifyAccountSupportTips: value };
  }
}

function buildStateFromPreferences(preferences: SettingsNotificationPreferences): NotificationState {
  return {
    stopAllMarketingEmails: preferences.stopAllMarketingEmails,
    offers: { ...preferences.offers },
    account: { ...preferences.account },
  };
}

export default function NotificationsSettingsPanel() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<NotificationTabKey>("offers");
  const [notificationState, setNotificationState] = useState<NotificationState>({
    stopAllMarketingEmails: false,
    offers: {
      hostRecognition: false,
      tripOffers: false,
      priceSuggestions: false,
      hostPerks: false,
      newsAndPrograms: false,
      localRegulations: false,
      inspirationAndDeals: false,
      tripPlanning: false,
    },
    account: {
      newDeviceLogin: false,
      securityUpdates: false,
      paymentActivity: false,
      profileReminders: false,
      verificationReminders: false,
      supportTips: false,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const accessToken = session?.user?.accessToken;

  useEffect(() => {
    if (status === "loading") return;

    if (!accessToken) {
      setIsLoading(false);
      toast.error("Không thể tải cài đặt thông báo do phiên đăng nhập không hợp lệ.", {
        id: FEEDBACK_TOAST_ID,
      });
      return;
    }

    let active = true;
    setIsLoading(true);

    getSettingsOverview(accessToken)
      .then((data) => {
        if (!active) return;
        setNotificationState(buildNotificationState(data));
      })
      .catch(() => {
        if (!active) return;
        toast.error("Không thể tải cài đặt thông báo. Vui lòng thử lại.", {
          id: FEEDBACK_TOAST_ID,
        });
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, status]);

  const togglesDisabled = isLoading || isSaving || status !== "authenticated";

  async function persistPreference(input: UpdateSettingsPreferencesInput, rollback: () => void) {
    if (!accessToken) {
      rollback();
      toast.error("Không thể lưu thay đổi vì bạn chưa đăng nhập.", {
        id: FEEDBACK_TOAST_ID,
      });
      return;
    }

    setIsSaving(true);
    try {
      const preferences = await updateSettingsPreferences(input, accessToken);
      setNotificationState(buildStateFromPreferences(preferences.notifications));
      toast.success("Đã cập nhật cài đặt thông báo.", {
        id: FEEDBACK_TOAST_ID,
      });
    } catch {
      rollback();
      toast.error("Không thể lưu thay đổi. Vui lòng thử lại.", {
        id: FEEDBACK_TOAST_ID,
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleOfferToggle(key: OfferKey) {
    if (togglesDisabled) return;

    const previousState = notificationState;
    const nextValue = !previousState.offers[key];
    const nextState: NotificationState = {
      ...previousState,
      offers: {
        ...previousState.offers,
        [key]: nextValue,
      },
    };

    setNotificationState(nextState);
    void persistPreference(mapOfferKeyToPayload(key, nextValue), () =>
      setNotificationState(previousState),
    );
  }

  function handleAccountToggle(key: AccountKey) {
    if (togglesDisabled) return;

    const previousState = notificationState;
    const nextValue = !previousState.account[key];
    const nextState: NotificationState = {
      ...previousState,
      account: {
        ...previousState.account,
        [key]: nextValue,
      },
    };

    setNotificationState(nextState);
    void persistPreference(mapAccountKeyToPayload(key, nextValue), () =>
      setNotificationState(previousState),
    );
  }

  function handleStopAllMarketingEmailsToggle() {
    if (togglesDisabled) return;

    const previousState = notificationState;
    const nextValue = !previousState.stopAllMarketingEmails;
    const nextState: NotificationState = {
      ...previousState,
      stopAllMarketingEmails: nextValue,
    };

    setNotificationState(nextState);
    void persistPreference({ stopAllMarketingEmails: nextValue }, () =>
      setNotificationState(previousState),
    );
  }

  const sections = useMemo(
    () => (activeTab === "offers" ? offersItems : accountItems),
    [activeTab],
  );

  return (
    <div className="w-full max-w-[620px]">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Thông báo</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Chọn loại email và thông báo tài khoản mà bạn muốn nhận từ hệ thống.
        </p>
      </header>

      {isLoading ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300">
          Đang tải cài đặt thông báo...
        </div>
      ) : null}

      <div className="mt-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-end gap-6">
          <button
            type="button"
            onClick={() => setActiveTab("offers")}
            className={cn(
              "border-b-2 pb-3 text-sm font-medium transition",
              activeTab === "offers"
                ? "border-gray-900 text-gray-900 dark:border-gray-100 dark:text-gray-100"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
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
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            )}
          >
            Tài khoản
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {sections.map((item) => {
          const checked =
            activeTab === "offers"
              ? notificationState.offers[item.key as OfferKey]
              : notificationState.account[item.key as AccountKey];

          return (
            <div
              key={item.key}
              className="flex items-start justify-between gap-4 py-5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.title}
                </p>
                {item.helper ? (
                  <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    {item.helper}
                  </p>
                ) : null}
              </div>

              <ToggleSwitch
                checked={checked}
                onChange={() =>
                  activeTab === "offers"
                    ? handleOfferToggle(item.key as OfferKey)
                    : handleAccountToggle(item.key as AccountKey)
                }
                label={item.title}
                disabled={togglesDisabled}
              />
            </div>
          );
        })}
      </div>

      <section className="mt-10 border-t border-gray-200 pt-8 dark:border-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Ngừng nhận tất cả các email tiếp thị
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
              Tắt toàn bộ email marketing nhưng vẫn giữ lại các thông báo quan trọng về tài
              khoản và bảo mật.
            </p>
          </div>

          <ToggleSwitch
            checked={notificationState.stopAllMarketingEmails}
            onChange={handleStopAllMarketingEmailsToggle}
            label="Ngừng nhận tất cả email tiếp thị"
            disabled={togglesDisabled}
          />
        </div>
      </section>
    </div>
  );
}
