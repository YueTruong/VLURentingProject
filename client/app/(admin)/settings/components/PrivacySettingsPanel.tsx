"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  getSettingsOverview,
  updateSettingsPreferences,
  type SettingsPreferences,
  type UpdateSettingsPreferencesInput,
} from "@/app/services/security";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
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

function ToggleSwitch({
  checked,
  onChange,
  label,
  disabled = false,
}: ToggleSwitchProps) {
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
          ? "border-[#d51f35] bg-[#d51f35] shadow-[0_10px_24px_-16px_rgba(213,31,53,0.8)] dark:border-[#f43f5e] dark:bg-[#f43f5e] dark:shadow-[0_14px_28px_-18px_rgba(244,63,94,0.85)]"
          : "border-gray-300 bg-gray-300/90 dark:border-white/12 dark:bg-slate-700/80",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full shadow-sm ring-1 transition-transform duration-200",
          checked
            ? "translate-x-6 bg-white ring-white/70 dark:bg-slate-50 dark:ring-white/70"
            : "translate-x-0.5 bg-white ring-black/5 dark:bg-slate-200 dark:ring-white/10",
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
        <div className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
          {description}
        </div>
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
    title: "Cho phép bài đăng của tôi xuất hiện trên công cụ tìm kiếm",
    description:
      "Cho phép Google và các nền tảng tìm kiếm khác lập chỉ mục bài đăng phòng trọ công khai của bạn.",
  },
  {
    key: "hometown",
    title: "Hiển thị khu vực học tập hoặc sinh sống của tôi",
    description:
      "Hiển thị quận, thành phố hoặc khu vực bạn thường hoạt động để hồ sơ trên VLURenting minh bạch hơn.",
  },
  {
    key: "expertType",
    title: "Hiển thị vai trò của tôi trên VLURenting",
    description:
      "Cho người khác biết bạn là sinh viên, chủ trọ hoặc người đang tìm bạn ở ghép.",
  },
  {
    key: "joinedTime",
    title: "Hiển thị thời gian hoạt động trên VLURenting",
    description:
      "Cho người khác biết bạn đã tham gia và sử dụng nền tảng trong bao lâu.",
  },
  {
    key: "bookedServices",
    title: "Hiển thị lịch hẹn xem phòng hoặc hợp đồng đã xác nhận",
    description:
      "Hiển thị các mốc tương tác đã hoàn tất để tăng mức độ tin cậy cho hồ sơ của bạn.",
  },
] as const;

type PostSettingKey = (typeof postSettings)[number]["key"];

const DEFAULT_POST_PRIVACY: Record<PostSettingKey, boolean> = {
  searchEngine: true,
  hometown: false,
  expertType: false,
  joinedTime: true,
  bookedServices: false,
};

const POST_PREFERENCE_FIELD_MAP: Record<
  PostSettingKey,
  keyof UpdateSettingsPreferencesInput
> = {
  searchEngine: "postPrivacySearchEngine",
  hometown: "postPrivacyHometown",
  expertType: "postPrivacyExpertType",
  joinedTime: "postPrivacyJoinedTime",
  bookedServices: "postPrivacyBookedServices",
};

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
  "Xóa tài khoản của tôi":
    "Yêu cầu xóa tài khoản và dữ liệu liên quan theo chính sách hiện hành.",
};

const FEEDBACK_TOAST_ID = "privacy-settings-feedback";

export default function PrivacySettingsPanel() {
  const { data: session, status } = useSession();
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const [postPrivacy, setPostPrivacy] = useState<Record<PostSettingKey, boolean>>(
    DEFAULT_POST_PRIVACY,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const accessToken = session?.user?.accessToken;
  const togglesDisabled = isLoading || isSaving || status !== "authenticated";

  function applyPreferences(preferences: SettingsPreferences) {
    setReadReceiptsEnabled(preferences.privacy.readReceiptsEnabled);
    setPostPrivacy({
      searchEngine: preferences.privacy.post.searchEngine,
      hometown: preferences.privacy.post.hometown,
      expertType: preferences.privacy.post.expertType,
      joinedTime: preferences.privacy.post.joinedTime,
      bookedServices: preferences.privacy.post.bookedServices,
    });
  }

  useEffect(() => {
    if (status === "loading") return;

    if (!accessToken) {
      setIsLoading(false);
      toast.error(
        "Không thể tải thiết lập quyền riêng tư do phiên đăng nhập không hợp lệ.",
        { id: FEEDBACK_TOAST_ID },
      );
      return;
    }

    let active = true;
    setIsLoading(true);

    getSettingsOverview(accessToken)
      .then((data) => {
        if (!active) return;
        applyPreferences(data.preferences);
      })
      .catch(() => {
        if (!active) return;
        toast.error("Không thể tải thiết lập quyền riêng tư. Vui lòng thử lại.", {
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

  async function persistPreferences(
    input: UpdateSettingsPreferencesInput,
    rollback: () => void,
  ) {
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
      applyPreferences(preferences);
      toast.success("Đã cập nhật thiết lập quyền riêng tư.", {
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

  function handleReadReceiptsToggle() {
    if (togglesDisabled) return;

    const previousValue = readReceiptsEnabled;
    const nextValue = !previousValue;
    setReadReceiptsEnabled(nextValue);

    void persistPreferences(
      { readReceiptsEnabled: nextValue },
      () => setReadReceiptsEnabled(previousValue),
    );
  }

  function handlePostPrivacyToggle(key: PostSettingKey) {
    if (togglesDisabled) return;

    const previousValue = postPrivacy[key];
    const nextValue = !previousValue;
    const fieldName = POST_PREFERENCE_FIELD_MAP[key];
    const input = { [fieldName]: nextValue } as UpdateSettingsPreferencesInput;

    setPostPrivacy((prev) => ({
      ...prev,
      [key]: nextValue,
    }));

    void persistPreferences(
      input,
      () =>
        setPostPrivacy((prev) => ({
          ...prev,
          [key]: previousValue,
        })),
    );
  }

  return (
    <section className="min-w-0">
      <header className="pb-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Quyền riêng tư
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Quản lý cách hồ sơ và bài đăng của bạn được hiển thị trên VLURenting.
        </p>
      </header>

      {isLoading ? (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300">
          Đang tải thiết lập quyền riêng tư...
        </div>
      ) : null}

      <SettingsSection title="Tin nhắn" first>
        <SettingsRow
          title="Thông báo đã đọc tin nhắn"
          description={
            <>
              Cho chủ trọ hoặc người thuê biết khi bạn đã xem tin nhắn trong phần trò
              chuyện.{" "}
              <button
                type="button"
                className="font-medium text-gray-700 hover:underline dark:text-rose-300 dark:hover:text-rose-200"
              >
                Tìm hiểu thêm
              </button>
            </>
          }
          trailing={
            <ToggleSwitch
              checked={readReceiptsEnabled}
              onChange={handleReadReceiptsToggle}
              label="Thông báo đã đọc tin nhắn"
              disabled={togglesDisabled}
            />
          }
        />
      </SettingsSection>

      <SettingsSection title="Hồ sơ và bài đăng">
        {postSettings.map((item) => (
          <SettingsRow
            key={item.key}
            title={item.title}
            description={item.description}
            trailing={
              <ToggleSwitch
                checked={postPrivacy[item.key]}
                onChange={() => handlePostPrivacyToggle(item.key)}
                label={item.title}
                disabled={togglesDisabled}
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
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V8a4 4 0 118 0v3" />
              </svg>
            </span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Cam kết đảm bảo quyền riêng tư
              </h3>
              <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Hãy kiểm tra kỹ các thiết lập trước khi chia sẻ thông tin công khai để
                đảm bảo quyền riêng tư và mức độ hiển thị phù hợp với bạn.
              </p>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
