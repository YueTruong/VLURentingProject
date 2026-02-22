"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CaptureMethod = "upload-existing" | "webcam";

type CaptureMethodOption = {
  key: CaptureMethod;
  title: string;
  subtitle?: string;
};

const LOCAL_STORAGE_KEY = "vlu.identity.documents";

const captureMethods: CaptureMethodOption[] = [
  { key: "upload-existing", title: "Tải lên ảnh có sẵn", subtitle: "Được đề xuất" },
  { key: "webcam", title: "Chụp ảnh bằng webcam" },
];

function cn(...parts: Array<string | false>) {
  return parts.filter(Boolean).join(" ");
}

export default function CaptureMethodClient() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<CaptureMethod>("upload-existing");
  const [errorMessage, setErrorMessage] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsReady(true);
    }, 40);
    return () => window.clearTimeout(timer);
  }, []);

  function handleContinue() {
    setErrorMessage("");

    if (selectedMethod === "webcam") {
      setErrorMessage("Phương thức chụp ảnh bằng webcam đang được cập nhật. Vui lòng chọn tải lên ảnh có sẵn.");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          method: selectedMethod,
          savedAt: new Date().toISOString(),
        }),
      );
    }

    setIsNavigating(true);
    router.push("/settings/identity/document-type");
  }

  return (
    <>
      <div className="mt-7 max-w-[620px] space-y-4">
        {captureMethods.map((method, index) => (
          <button
            key={method.key}
            type="button"
            onClick={() => {
              setSelectedMethod(method.key);
              setErrorMessage("");
            }}
            style={{ transitionDelay: `${index * 80}ms` }}
            className={cn(
              "w-full rounded-2xl border px-6 py-5 text-left transition-all duration-300 ease-out",
              "transform-gpu motion-reduce:transform-none motion-reduce:transition-none",
              isReady ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
              selectedMethod === method.key
                ? "border-[#111827] bg-white shadow-[0_10px_24px_rgba(17,24,39,0.12)] scale-[1.01] active:translate-y-1 active:scale-[1.00] active:shadow-sm"
                : "border-[#d1d5db] bg-[#fafafa] hover:-translate-y-0.5 hover:border-[#9ca3af] hover:shadow-sm active:translate-y-1 active:shadow-none",
            )}
          >
            <p className="text-[22px] font-medium text-[#111827]">{method.title}</p>
            {method.subtitle ? <p className="mt-1 text-[15px] text-[#6b7280]">{method.subtitle}</p> : null}
          </button>
        ))}
      </div>

      {errorMessage ? (
        <p className="mt-4 max-w-[620px] rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[14px] text-[#b91c1c] transition-all duration-200">
          {errorMessage}
        </p>
      ) : null}

      <div className="mt-10 flex max-w-[620px] items-center justify-between border-t border-[#d1d5db] pt-4">
        <Link href="/settings/identity" className="text-[18px] font-medium text-[#111827] underline underline-offset-4 transition-colors hover:text-[#000]">
          Quay lại
        </Link>
        <button
          type="button"
          onClick={handleContinue}
          disabled={isNavigating}
          className={cn(
            "rounded-xl px-6 py-3 text-[18px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-1 active:scale-[0.98]",
            isNavigating ? "cursor-not-allowed bg-[#6b7280]" : "bg-[#111827] hover:bg-black",
          )}
        >
          {isNavigating ? "Đang chuyển..." : "Tiếp tục"}
        </button>
      </div>
    </>
  );
}
