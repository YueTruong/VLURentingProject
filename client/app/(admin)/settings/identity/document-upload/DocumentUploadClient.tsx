"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { submitIdentityVerification } from "@/app/services/security";

const IDENTITY_IMAGE_KEY = "vlu.identity.document.images";
const VERIFICATION_STORAGE_KEY = "vlu.landlord.verified";
const VERIFICATION_PENDING_KEY = "vlu.landlord.pending";
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

type IdentityDocumentType = "driver-license" | "passport" | "national-id";

type DocumentUploadConfig = {
  title: string;
  description: string;
  requiresBackImage: boolean;
  frontLabel: string;
  backLabel: string;
  previewAltFront: string;
  previewAltBack: string;
};

const documentConfigMap: Record<IdentityDocumentType, DocumentUploadConfig> = {
  "driver-license": {
    title: "Tải lên ảnh giấy phép lái xe của bạn",
    description:
      "Đảm bảo ảnh không bị nhòe, mờ và mặt trước giấy phép lái xe thể hiện rõ khuôn mặt bạn.",
    requiresBackImage: true,
    frontLabel: "Tải lên ảnh mặt trước",
    backLabel: "Tải lên ảnh mặt sau",
    previewAltFront: "Ảnh mặt trước giấy phép lái xe",
    previewAltBack: "Ảnh mặt sau giấy phép lái xe",
  },
  passport: {
    title: "Tải lên ảnh hộ chiếu của bạn",
    description:
      "Đảm bảo ảnh hộ chiếu của bạn không bị nhòe hoặc mờ và ảnh thể hiện rõ khuôn mặt bạn.",
    requiresBackImage: false,
    frontLabel: "Tải lên hộ chiếu",
    backLabel: "",
    previewAltFront: "Ảnh hộ chiếu đã tải lên",
    previewAltBack: "",
  },
  "national-id": {
    title: "Tải lên ảnh giấy tờ tùy thân của bạn",
    description:
      "Đảm bảo ảnh không bị nhòe, mờ và mặt trước giấy tờ tùy thân thể hiện rõ khuôn mặt bạn.",
    requiresBackImage: true,
    frontLabel: "Tải lên ảnh mặt trước",
    backLabel: "Tải lên ảnh mặt sau",
    previewAltFront: "Ảnh mặt trước giấy tờ tùy thân",
    previewAltBack: "Ảnh mặt sau giấy tờ tùy thân",
  },
};

type UploadCardProps = {
  inputId: string;
  label: string;
  file: File | null;
  previewUrl: string;
  previewAlt: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (files: FileList | null) => void;
  onRemove: () => void;
};

function cn(...parts: Array<string | false>) {
  return parts.filter(Boolean).join(" ");
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-[#6b7280]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V5m0 0 4 4m-4-4-4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 15.5v2A2.5 2.5 0 0 0 6.5 20h11A2.5 2.5 0 0 0 20 17.5v-2" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V8a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

function UploadCard({
  inputId,
  label,
  file,
  previewUrl,
  previewAlt,
  inputRef,
  onPick,
  onRemove,
}: UploadCardProps) {
  const hasImage = Boolean(file && previewUrl);

  return (
    <div className="transition-all duration-300">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={(event) => onPick(event.target.files)}
      />

      {!hasImage ? (
        <label
          htmlFor={inputId}
          className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d1d5db] px-5 py-8 text-center transition-colors hover:bg-[#fafafa]"
        >
          <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f4f6]">
            <UploadIcon />
          </span>
          <p className="text-base font-semibold text-[#111827]">{label}</p>
          <p className="mt-1 text-sm text-[#6b7280]">Chỉ định dạng JPEG hoặc PNG</p>
        </label>
      ) : (
        <div className="rounded-xl border border-[#d1d5db] bg-white p-3 transition-all duration-300">
          <div className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f9fafb]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={previewAlt}
              className="h-40 w-full object-cover transition-transform duration-300 hover:scale-[1.01]"
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="line-clamp-1 text-sm font-medium text-[#111827]">{file?.name}</p>
            <div className="flex items-center gap-3 text-xs">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-medium text-[#374151] underline underline-offset-2 hover:text-[#111827]"
              >
                Thay đổi
              </button>
              <button
                type="button"
                onClick={onRemove}
                className="font-medium text-[#6b7280] underline underline-offset-2 hover:text-[#111827]"
              >
                Xóa ảnh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DocumentUploadClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const rawType = searchParams.get("type");
  const documentType: IdentityDocumentType =
    rawType === "driver-license" || rawType === "passport" || rawType === "national-id"
      ? rawType
      : "national-id";
  const config = documentConfigMap[documentType];

  const frontPreviewUrl = useMemo(() => (frontFile ? URL.createObjectURL(frontFile) : ""), [frontFile]);
  const backPreviewUrl = useMemo(() => (backFile ? URL.createObjectURL(backFile) : ""), [backFile]);

  useEffect(() => {
    return () => {
      if (frontPreviewUrl) URL.revokeObjectURL(frontPreviewUrl);
    };
  }, [frontPreviewUrl]);

  useEffect(() => {
    return () => {
      if (backPreviewUrl) URL.revokeObjectURL(backPreviewUrl);
    };
  }, [backPreviewUrl]);

  const canContinue = config.requiresBackImage
    ? Boolean(frontFile && backFile)
    : Boolean(frontFile);
  const accessToken = session?.user?.accessToken;

  function validateAndSetFile(
    files: FileList | null,
    setter: (file: File | null) => void,
  ) {
    const file = files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage("Vui lòng chọn ảnh định dạng JPEG hoặc PNG.");
      return;
    }

    setter(file);
    setErrorMessage("");
  }

  async function handleContinue() {
    if (!canContinue || isSubmitting) return;
    if (!accessToken) {
      setErrorMessage("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        IDENTITY_IMAGE_KEY,
        JSON.stringify({
          frontImageName: frontFile?.name ?? "",
          backImageName: backFile?.name ?? "",
          savedAt: new Date().toISOString(),
        }),
      );

    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await submitIdentityVerification(
        {
          documentType,
          frontImageName: frontFile?.name ?? "",
          backImageName: config.requiresBackImage ? backFile?.name ?? "" : undefined,
        },
        accessToken,
      );

      if (typeof window !== "undefined") {
        window.localStorage.setItem(VERIFICATION_STORAGE_KEY, "true");
        window.localStorage.removeItem(VERIFICATION_PENDING_KEY);
      }

      router.push("/settings/identity");
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        (error as { response?: { data?: { message?: string } } }).response?.data?.message
          ? String((error as { response?: { data?: { message?: string } } }).response?.data?.message)
          : "Không thể gửi xác minh. Vui lòng thử lại.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 bg-white">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold text-[#111827]">{config.title}</h1>
        <p className="text-sm text-[#6b7280]">{config.description}</p>
      </section>

      <section className={cn("grid gap-6", config.requiresBackImage ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
        <UploadCard
          inputId="identity-front-upload"
          label={config.frontLabel}
          file={frontFile}
          previewUrl={frontPreviewUrl}
          previewAlt={config.previewAltFront}
          inputRef={frontInputRef}
          onPick={(files) => validateAndSetFile(files, setFrontFile)}
          onRemove={() => {
            setFrontFile(null);
            if (frontInputRef.current) frontInputRef.current.value = "";
          }}
        />

        {config.requiresBackImage ? (
          <UploadCard
            inputId="identity-back-upload"
            label={config.backLabel}
            file={backFile}
            previewUrl={backPreviewUrl}
            previewAlt={config.previewAltBack}
            inputRef={backInputRef}
            onPick={(files) => validateAndSetFile(files, setBackFile)}
            onRemove={() => {
              setBackFile(null);
              if (backInputRef.current) backInputRef.current.value = "";
            }}
          />
        ) : null}
      </section>

      {errorMessage ? (
        <p className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-4">
        <Link
          href="/settings/identity/document-type"
          className="inline-flex items-center gap-2 -ml-1 text-base font-medium text-[#111827] hover:text-black"
        >
          <span aria-hidden>←</span>
          <span className="underline underline-offset-4 decoration-1">Quay lại</span>
        </Link>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue || isSubmitting}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-base font-semibold transition-colors",
            canContinue && !isSubmitting
              ? "bg-[#111827] text-white hover:bg-black"
              : "cursor-not-allowed bg-[#e5e7eb] text-[#9ca3af]",
          )}
        >
          {!canContinue || isSubmitting ? <LockIcon /> : null}
          {isSubmitting ? "Đang xác minh..." : "Tiếp tục"}
        </button>
      </div>
    </div>
  );
}
