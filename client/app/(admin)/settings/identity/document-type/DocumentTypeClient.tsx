"use client";

import type { ReactElement } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type DocumentType = "driver-license" | "passport" | "national-id";

type DocumentOption = {
  key: DocumentType;
  label: string;
  icon: ReactElement;
};

const DOCUMENT_TYPE_KEY = "vlu.identity.document.type";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

// Airbnb-ish icon style: inherit color from parent (no hard-coded #111827)
const IconWrap = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex h-6 w-6 items-center justify-center text-[#111827]">{children}</span>
);

const documentOptions: DocumentOption[] = [
  {
    key: "driver-license",
    label: "Giấy phép lái xe",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13h18l-1.2-5a2 2 0 0 0-1.94-1.54H6.14A2 2 0 0 0 4.2 8L3 13Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13v3a1 1 0 0 0 1 1h1m11-4v3a1 1 0 0 1-1 1h-1" />
        <circle cx="8" cy="16" r="1.6" />
        <circle cx="16" cy="16" r="1.6" />
      </svg>
    ),
  },
  {
    key: "passport",
    label: "Hộ chiếu",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="9" />
        <path
          strokeLinecap="round"
          d="M3.8 9h16.4M3.8 15h16.4M12 3v18M8.2 3.9c1.6 2 2.5 4.9 2.5 8.1s-.9 6.1-2.5 8.1m7.6-16.2c-1.6 2-2.5 4.9-2.5 8.1s.9 6.1 2.5 8.1"
        />
      </svg>
    ),
  },
  {
    key: "national-id",
    label: "Giấy tờ tùy thân",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="5" width="17" height="14" rx="2.2" />
        <circle cx="9" cy="11" r="2.1" />
        <path strokeLinecap="round" d="M6.8 15.2c.9-1.4 2.2-2.2 3.6-2.2s2.7.8 3.6 2.2M14.5 10h4M14.5 13h4" />
      </svg>
    ),
  },
];

export default function DocumentTypeClient() {
  const router = useRouter();
  const [country, setCountry] = useState("Việt Nam");
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const canContinue = Boolean(selectedDocument);

  const nextHref = useMemo(() => {
    return selectedDocument ? `/settings/identity/document-upload?type=${selectedDocument}` : "";
  }, [selectedDocument]);

  function handleContinue() {
    if (!selectedDocument) {
      setErrorMessage("Vui lòng chọn loại giấy tờ trước khi tiếp tục.");
      return;
    }

    setErrorMessage("");

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        DOCUMENT_TYPE_KEY,
        JSON.stringify({
          country,
          documentType: selectedDocument,
          savedAt: new Date().toISOString(),
        })
      );
    }

    router.push(nextHref);
  }

  return (
    // Airbnb-like page: centered narrow content, plenty whitespace
    <div className="min-h-[calc(100vh-96px)] bg-white">
      <main className="mx-auto w-full max-w-[720px] px-4 pb-20 pt-12 sm:px-6">
        {/* Title */}
        <h1 className="text-[32px] font-semibold leading-[1.12] tracking-[-0.01em] text-[#111827] sm:text-[34px]">
          Chọn một loại giấy tờ tùy thân để thêm vào
        </h1>

        {/* Country select */}
        <div className="mt-9">
          <label htmlFor="country" className="mb-3 block text-[15px] font-medium text-[#6b7280]">
            Quốc gia/khu vực cấp
          </label>

          <div className="relative">
            <select
              id="country"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              className={cn(
                "h-14 w-full appearance-none rounded-2xl border bg-white px-5 pr-12 text-[17px] text-[#111827]",
                "border-[#d1d5db] outline-none transition",
                "focus:border-[#111827]"
              )}
            >
              <option value="Việt Nam">Việt Nam</option>
              <option value="United States">United States</option>
              <option value="Japan">Japan</option>
            </select>

            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6b7280]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* Options list (Airbnb style: simple list cards) */}
        <div className="mt-7 space-y-5">
          {documentOptions.map((option) => {
            const isActive = selectedDocument === option.key;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setSelectedDocument(option.key);
                  setErrorMessage("");
                }}
                className={cn(
                  "flex w-full items-center gap-5 rounded-2xl border px-7 py-6 text-left transition-all duration-200 ease-out",
                  isActive
                    ? "border-2 border-[#111827] bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
                    : "border-gray-200 bg-white shadow-none hover:scale-[1.01] hover:border-gray-400 hover:bg-[#fafafa]"
                )}
              >
                <IconWrap>{option.icon}</IconWrap>
                <span className="text-[18px] font-medium text-[#111827]">{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* Privacy note */}
        <p className="mt-7 text-[15px] leading-7 text-[#6b7280]">
          Thông tin giấy tờ tùy thân của bạn sẽ được xử lý theo{" "}
          <Link href="/user-policy" className="underline underline-offset-2 hover:text-[#111827]">
            Chính sách quyền riêng tư
          </Link>{" "}
          của chúng tôi và sẽ không được chia sẻ với chủ trọ hoặc khách thuê của bạn.
        </p>

        {/* Error */}
        {errorMessage ? (
          <div className="mt-5 rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-5 py-4 text-[15px] text-[#b91c1c]">
            {errorMessage}
          </div>
        ) : null}

        {/* Bottom actions (Airbnb-like) */}
        <div className="mt-12 flex items-center justify-between border-t border-[#e5e7eb] pt-7">
          <Link
            href="/settings/identity/capture-method"
            className="inline-flex items-center gap-2 -ml-1 text-[17px] font-medium text-[#111827] hover:text-black"
          >
            <span aria-hidden>←</span>
            <span className="underline underline-offset-4 decoration-1">Quay lại</span>
          </Link>

          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className={cn(
              "inline-flex items-center justify-center rounded-full px-8 py-3.5 text-[17px] font-semibold transition",
              canContinue
                ? "bg-[#111827] text-white hover:bg-black"
                : "cursor-not-allowed bg-[#e5e7eb] text-[#9ca3af]"
            )}
          >
            Tiếp tục
          </button>
        </div>
      </main>
    </div>
  );
}
