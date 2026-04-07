"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  getSettingsOverview,
  updateSettingsPreferences,
  type SettingsPreferences,
} from "@/app/services/security";

type FormState = {
  language: string;
  currency: string;
  timezone: string;
};

const LANGUAGE_OPTIONS = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
];

const CURRENCY_OPTIONS = [
  { value: "VND", label: "Việt Nam Đồng (VND)" },
  { value: "USD", label: "US Dollar (USD)" },
];

const TIMEZONE_OPTIONS = [
  { value: "Asia/Ho_Chi_Minh", label: "Asia/Ho_Chi_Minh (GMT+07:00)" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok (GMT+07:00)" },
  { value: "UTC", label: "UTC (GMT+00:00)" },
];

const FEEDBACK_TOAST_ID = "language-currency-settings";

function buildForm(preferences: SettingsPreferences): FormState {
  return {
    language: preferences.language || "vi",
    currency: preferences.currency || "VND",
    timezone: preferences.timezone || "Asia/Ho_Chi_Minh",
  };
}

function getOptionLabel(
  value: string,
  options: Array<{ value: string; label: string }>,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

export default function LanguageCurrencySettingsPanel() {
  const { data: session, status } = useSession();
  const [form, setForm] = useState<FormState>({
    language: "vi",
    currency: "VND",
    timezone: "Asia/Ho_Chi_Minh",
  });
  const [savedForm, setSavedForm] = useState<FormState>({
    language: "vi",
    currency: "VND",
    timezone: "Asia/Ho_Chi_Minh",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const accessToken = session?.user?.accessToken;

  useEffect(() => {
    if (status === "loading") return;

    if (!accessToken) {
      setIsLoading(false);
      toast.error("Không thể tải cài đặt ngôn ngữ do phiên đăng nhập không hợp lệ.", {
        id: FEEDBACK_TOAST_ID,
      });
      return;
    }

    let active = true;
    setIsLoading(true);

    getSettingsOverview(accessToken)
      .then((data) => {
        if (!active) return;
        const nextForm = buildForm(data.preferences);
        setForm(nextForm);
        setSavedForm(nextForm);
      })
      .catch(() => {
        if (!active) return;
        toast.error("Không thể tải cài đặt ngôn ngữ và tiền tệ. Vui lòng thử lại.", {
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

  const isDirty = useMemo(
    () =>
      form.language !== savedForm.language ||
      form.currency !== savedForm.currency ||
      form.timezone !== savedForm.timezone,
    [form, savedForm],
  );

  async function handleSave() {
    if (!accessToken || !isDirty || isSaving) return;

    setIsSaving(true);
    try {
      const preferences = await updateSettingsPreferences(
        {
          language: form.language,
          currency: form.currency,
          timezone: form.timezone,
        },
        accessToken,
      );

      const nextForm = buildForm(preferences);
      setForm(nextForm);
      setSavedForm(nextForm);
      toast.success("Đã cập nhật ngôn ngữ, tiền tệ và múi giờ.", {
        id: FEEDBACK_TOAST_ID,
      });
    } catch {
      toast.error("Không thể lưu thay đổi. Vui lòng thử lại.", {
        id: FEEDBACK_TOAST_ID,
      });
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setForm(savedForm);
  }

  return (
    <div className="w-full max-w-[620px]">
      <header className="pb-2">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Ngôn ngữ và loại tiền tệ
        </h1>
        <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Cập nhật ngôn ngữ hiển thị, loại tiền tệ ưu tiên và múi giờ cho tài khoản của
          bạn.
        </p>
      </header>

      {isLoading ? (
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300">
          Đang tải cài đặt ngôn ngữ và tiền tệ...
        </div>
      ) : null}

      <section className="mt-6 space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Ngôn ngữ ưu tiên
              </span>
              <select
                value={form.language}
                onChange={(event) =>
                  setForm((current) => ({ ...current, language: event.target.value }))
                }
                disabled={isLoading || isSaving}
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Loại tiền tệ ưu tiên
              </span>
              <select
                value={form.currency}
                onChange={(event) =>
                  setForm((current) => ({ ...current, currency: event.target.value }))
                }
                disabled={isLoading || isSaving}
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
              >
                {CURRENCY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Múi giờ</span>
              <select
                value={form.timezone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, timezone: event.target.value }))
                }
                disabled={isLoading || isSaving}
                className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-gray-900 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100"
              >
                {TIMEZONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={!isDirty || isSaving}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              Hoàn tác
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || isSaving}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-300">
          <p>
            Hiện tại: {getOptionLabel(savedForm.language, LANGUAGE_OPTIONS)} •{" "}
            {getOptionLabel(savedForm.currency, CURRENCY_OPTIONS)} •{" "}
            {getOptionLabel(savedForm.timezone, TIMEZONE_OPTIONS)}
          </p>
        </div>
      </section>
    </div>
  );
}
