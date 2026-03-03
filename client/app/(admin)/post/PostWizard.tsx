"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { createPost, uploadImages } from "@/app/services/posts";
import {
  getIdentityVerificationOverview,
  readVerificationStatusFromStorage,
  VERIFICATION_STATUS_EVENT,
} from "@/app/services/security";

type ListingType = "PHONG_TRO" | "CAN_HO" | "NHA_NGUYEN_CAN";
type ListingPurpose = "RENT" | "ROOMMATE";
type RoommateLinkType = "LANDLORD_ASSIST" | "TENANT_SELF";
type RoommateApprovalStatus = "pending" | "approved" | "rejected";
type Furnishing = "NONE" | "BASIC" | "FULL";

type Amenities = {
  wifi: boolean;
  aircon: boolean;
  privateWc: boolean;
  mezzanine: boolean;
  parking: boolean;
  freeTime: boolean;
};

type RoommateLifestyle = {
  quiet: boolean;
  clean: boolean;
  noSmoking: boolean;
  noPets: boolean;
  shareUtility: boolean;
};

type ListingDraft = {
  purpose: ListingPurpose;
  title: string;
  type: ListingType;
  priceVnd: string; // giá string để format dễ đọc, backend parse sau
  areaM2: string;
  maxPeople: string;
  campus: "CS1" | "CS2" | "CS3";
  availability: "available" | "rented";
  videoUrl: string;
  roommateMoveInDate: string;
  roommateGender: string;
  roommateOccupation: string;
  roommateContact: string;
  roommateLifestyle: RoommateLifestyle;
  roommateLinkType: RoommateLinkType;
  roommateListingId: string;
  roommateListingTitle: string;
  roommateListingAddress: string;
  roommateLandlordName: string;
  roommateCurrentOccupancy: string;
  roommateMaxOccupancy: string;
  roommateApprovalStatus: RoommateApprovalStatus;
  roommateNotifyLandlord: boolean;
  roommateLandlordConsent: boolean;

  addressText: string;
  district: string;
  ward: string;
  // map placeholder (lat/lng)
  lat?: number;
  lng?: number;

  furnishing: Furnishing;
  amenities: Amenities;

  description: string;
  images: File[]; // FE preview
};

type DraftSnapshot = {
  version: number;
  savedAt: string;
  step: number;
  mapQuery: string;
  postConsents: {
    terms: boolean;
    privacy: boolean;
    policy: boolean;
  };
  draft: Omit<ListingDraft, "images">;
};

const steps = [
  { key: "basic", label: "Cơ bản" },
  { key: "location", label: "Vị trí" },
  { key: "amenities", label: "Tiện ích" },
  { key: "media", label: "Hình ảnh & mô tả" },
  { key: "preview", label: "Xem trước" },
] as const;

const categoryNameMap: Record<ListingType, string> = {
  PHONG_TRO: "Phòng trọ",
  CAN_HO: "Căn hộ",
  NHA_NGUYEN_CAN: "Nhà nguyên căn",
};

const amenityNameMap: Record<keyof Amenities, string> = {
  wifi: "Wifi",
  aircon: "Máy lạnh",
  privateWc: "WC riêng",
  mezzanine: "Gác lửng",
  parking: "Giữ xe",
  freeTime: "Giờ giấc tự do",
};

const roommateLifestyleMap: Record<keyof RoommateLifestyle, string> = {
  quiet: "Yên tĩnh",
  clean: "Gọn gàng",
  noSmoking: "Không hút thuốc",
  noPets: "Không nuôi thú cưng",
  shareUtility: "Chia sẻ tiện ích",
};

const roommateListingCatalog = [
  {
    id: "R-1203",
    title: "Phòng trọ Bình Thạnh - Cổng sau VLU",
    address: "12/3 Nguyễn Gia Trí, P.25, Bình Thạnh",
    landlordName: "Nguyễn Thị Mai",
    currentOccupancy: 2,
    maxOccupancy: 3,
  },
  {
    id: "R-2041",
    title: "Căn hộ mini Q7 - gần trạm xe buýt",
    address: "88 Nguyễn Thị Thập, Q7",
    landlordName: "Lê Văn Hải",
    currentOccupancy: 3,
    maxOccupancy: 4,
  },
  {
    id: "R-3310",
    title: "Phòng trọ Gò Vấp - yên tĩnh",
    address: "15/7 Phan Huy Ích, Gò Vấp",
    landlordName: "Trần Minh Khôi",
    currentOccupancy: 1,
    maxOccupancy: 2,
  },
] as const;

const roommateListingOptions = roommateListingCatalog.map((item) => ({
  value: item.id,
  label: `${item.title} • ${item.currentOccupancy}/${item.maxOccupancy} người`,
}));

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

const DRAFT_STORAGE_KEY = "vlu.post.draft.v1";
const DRAFT_STORAGE_VERSION = 1;
const DRAFT_SAVE_DELAY = 700;
function createEmptyDraft(): ListingDraft {
  return {
    purpose: "RENT",
    title: "",
    type: "PHONG_TRO",
    priceVnd: "",
    areaM2: "",
    maxPeople: "1",
    campus: "CS1",
    availability: "available",
    videoUrl: "",
    roommateMoveInDate: "",
    roommateGender: "Không yêu cầu",
    roommateOccupation: "Sinh viên",
    roommateContact: "",
    roommateLifestyle: {
      quiet: true,
      clean: true,
      noSmoking: false,
      noPets: false,
      shareUtility: true,
    },
    roommateLinkType: "TENANT_SELF",
    roommateListingId: "",
    roommateListingTitle: "",
    roommateListingAddress: "",
    roommateLandlordName: "",
    roommateCurrentOccupancy: "",
    roommateMaxOccupancy: "",
    roommateApprovalStatus: "pending",
    roommateNotifyLandlord: false,
    roommateLandlordConsent: false,

    addressText: "",
    district: "Bình Thạnh",
    ward: "",

    furnishing: "BASIC",
    amenities: {
      wifi: true,
      aircon: false,
      privateWc: true,
      mezzanine: false,
      parking: true,
      freeTime: false,
    },

    description: "",
    images: [],
  };
}

function createDefaultConsents() {
  return {
    terms: false,
    privacy: false,
    policy: false,
  };
}

function cn(...s: Array<string | false | undefined | null>) {
  return s.filter(Boolean).join(" ");
}

function formatVndInput(raw: string) {
  // chỉ cho số
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  // thêm dấu chấm phân tách nghìn (VN)
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function toNumber(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function formatDraftTimestamp(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("vi-VN", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildAddress(draft: ListingDraft) {
  return [draft.addressText, draft.ward, draft.district]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(", ");
}

function collectAmenityNames(amenities: Amenities) {
  return (Object.keys(amenityNameMap) as Array<keyof Amenities>)
    .filter((key) => amenities[key])
    .map((key) => amenityNameMap[key]);
}

function collectRoommateLifestyleLabels(lifestyle: RoommateLifestyle) {
  return (Object.keys(roommateLifestyleMap) as Array<keyof RoommateLifestyle>)
    .filter((key) => lifestyle[key])
    .map((key) => roommateLifestyleMap[key]);
}

function buildRoommateSummary(draft: ListingDraft) {
  const lines: string[] = [];
  if (draft.roommateListingTitle) {
    lines.push(`- Phòng gốc: ${draft.roommateListingTitle}`);
  }
  if (draft.roommateListingAddress) {
    lines.push(`- Địa chỉ phòng gốc: ${draft.roommateListingAddress}`);
  }
  if (draft.roommateLandlordName) {
    lines.push(`- Chủ trọ: ${draft.roommateLandlordName}`);
  }
  if (draft.roommateCurrentOccupancy || draft.roommateMaxOccupancy) {
    lines.push(
      `- Số người hiện tại: ${draft.roommateCurrentOccupancy || "--"}/${draft.roommateMaxOccupancy || "--"}`
    );
  }
  if (draft.roommateMoveInDate) {
    lines.push(`- Ngày vào ở: ${draft.roommateMoveInDate}`);
  }
  if (draft.roommateGender && draft.roommateGender !== "Không yêu cầu") {
    lines.push(`- Giới tính ưu tiên: ${draft.roommateGender}`);
  }
  if (draft.roommateOccupation && draft.roommateOccupation !== "Không yêu cầu") {
    lines.push(`- Nghề nghiệp ưu tiên: ${draft.roommateOccupation}`);
  }
  if (draft.roommateContact) {
    lines.push(`- Liên hệ: ${draft.roommateContact}`);
  }
  const lifestyleLabels = collectRoommateLifestyleLabels(draft.roommateLifestyle);
  if (lifestyleLabels.length > 0) {
    lines.push(`- Phong cách sống: ${lifestyleLabels.join(", ")}`);
  }
  if (draft.roommateApprovalStatus) {
    const statusLabel =
      draft.roommateApprovalStatus === "approved"
        ? "Đã được chủ trọ xác nhận"
        : draft.roommateApprovalStatus === "rejected"
          ? "Chủ trọ từ chối"
          : "Chờ chủ trọ xác nhận";
    lines.push(`- Trạng thái: ${statusLabel}`);
  }
  if (lines.length === 0) return "";
  return `Thông tin ở ghép:\n${lines.join("\n")}`;
}

function buildFinalDescription(draft: ListingDraft) {
  if (draft.purpose !== "ROOMMATE") return draft.description.trim();
  const summary = buildRoommateSummary(draft);
  const base = draft.description.trim();
  if (!summary) return base;
  if (!base) return summary;
  return `${base}\n\n${summary}`;
}

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <div className="text-xl font-semibold text-gray-900">{title}</div>
        {subtitle && <div className="mt-1 text-sm text-gray-500">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-1 text-sm font-medium text-gray-700">{children}</div>;
}

function Input({
  type = "text",
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  type?: React.InputHTMLAttributes<HTMLInputElement>["type"];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-gray-900"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-gray-900"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-gray-900"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
        checked ? "border-gray-900 bg-gray-50" : "border-gray-200 bg-white hover:bg-gray-50"
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex h-5 w-9 items-center rounded-full p-0.5 transition",
          checked ? "bg-gray-900" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "h-4 w-4 rounded-full bg-white transition",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </span>
      <span className="min-w-0">
        <div className="text-sm font-semibold text-gray-900">{label}</div>
        {desc && <div className="mt-0.5 text-xs text-gray-500">{desc}</div>}
      </span>
    </button>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {steps.map((s, idx) => {
          const active = idx === current;
          const done = idx < current;
          return (
            <div
              key={s.key}
              className={cn(
                "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm",
                active
                  ? "bg-gray-900 text-white"
                  : done
                  ? "bg-gray-100 text-gray-900"
                  : "bg-white text-gray-500"
              )}
            >
              <span
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full text-xs font-bold",
                  active ? "bg-white/15" : done ? "bg-white" : "bg-gray-100"
                )}
              >
                {idx + 1}
              </span>
              <span className="font-medium">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PreviewCard({
  data,
  activeImageIdx = 0,
  onPrevImage,
  onNextImage,
}: {
  data: ListingDraft;
  activeImageIdx?: number;
  onPrevImage?: () => void;
  onNextImage?: () => void;
}) {
  const price = toNumber(data.priceVnd);
  const area = toNumber(data.areaM2);
  const maxPeople = toNumber(data.maxPeople);
  const isRoommate = data.purpose === "ROOMMATE";
  const approvalMap: Record<RoommateApprovalStatus, { label: string; tone: string }> = {
    approved: { label: "Chủ trọ đã xác nhận", tone: "bg-green-100 text-green-800" },
    pending: { label: "Chờ chủ trọ xác nhận", tone: "bg-yellow-100 text-yellow-800" },
    rejected: { label: "Bị từ chối", tone: "bg-red-100 text-red-700" },
  };
  const approvalBadge = approvalMap[data.roommateApprovalStatus];
  const totalImages = data.images?.length ?? 0;
  const currentIdx = totalImages > 0 ? Math.min(activeImageIdx, totalImages - 1) : 0;
  const currentImg = totalImages > 0 ? data.images[currentIdx] : undefined;

  const priceText = price ? data.priceVnd + "đ" : "--";
  const areaText = area ? area + "m²" : "--";
  const peopleText = maxPeople
    ? isRoommate
      ? `Cần thêm ${maxPeople} người`
      : `${maxPeople} người`
    : "--";
  const priceSuffix = isRoommate ? "/người/tháng" : "/tháng";

  const badges = [
    data.amenities.wifi && "Wifi",
    data.amenities.aircon && "Máy lạnh",
    data.amenities.privateWc && "WC riêng",
    data.amenities.mezzanine && "Gác lửng",
    data.amenities.parking && "Giữ xe",
    data.amenities.freeTime && "Giờ giấc tự do",
  ].filter(Boolean) as string[];
  const roommateSummary = isRoommate ? buildRoommateSummary(data) : "";
  const previewDescription = roommateSummary
    ? data.description
      ? `${data.description}\n\n${roommateSummary}`
      : roommateSummary
    : data.description;

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="relative aspect-video w-full bg-gray-100">
        {currentImg ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={currentImg.name}
              src={URL.createObjectURL(currentImg)}
              className="h-full w-full object-cover"
            />
            {totalImages > 1 && onPrevImage && onNextImage && (
              <>
                <button
                  type="button"
                  onClick={onPrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-gray-200 bg-white/90 p-2 text-sm font-semibold text-gray-700 shadow hover:bg-white"
                >
                  &lt;
                </button>
                <button
                  type="button"
                  onClick={onNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-gray-200 bg-white/90 p-2 text-sm font-semibold text-gray-700 shadow hover:bg-white"
                >
                  &gt;
                </button>
                <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 shadow">
                  {currentIdx + 1}/{totalImages}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="grid h-full place-items-center text-sm text-gray-500">
            Chưa có ảnh (bạn có thể thêm ở bước 4)
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="truncate text-lg font-semibold text-gray-900">
                {data.title || "Tiêu đề tin..."}
              </div>
              {isRoommate && (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  Ở ghép
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {data.addressText || "Địa chỉ chi tiết"} - {data.ward || "Phường"} - {data.district || "Quận"}
            </div>
            {isRoommate && data.roommateListingTitle && (
              <div className="mt-1 text-xs text-gray-500">
                Phòng gốc: {data.roommateListingTitle}
              </div>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-bold text-gray-900">
              {priceText} <span className="text-sm font-medium text-gray-500">{priceSuffix}</span>
            </div>
            <div className="mt-0.5 text-xs text-gray-500">
              {areaText} - {peopleText}
            </div>
          </div>
        </div>

        {badges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {badges.slice(0, 6).map((b) => (
              <span
                key={b}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
              >
                {b}
              </span>
            ))}
          </div>
        )}

        {isRoommate && approvalBadge && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${approvalBadge.tone}`}>
              {approvalBadge.label}
            </span>
            {(data.roommateCurrentOccupancy || data.roommateMaxOccupancy) && (
              <span className="text-xs text-gray-500">
                Số người: {data.roommateCurrentOccupancy || "--"}/{data.roommateMaxOccupancy || "--"}
              </span>
            )}
          </div>
        )}

        <div className="mt-4 text-sm text-gray-700">
          {previewDescription ? (
            <p className="line-clamp-3 whitespace-pre-line">{previewDescription}</p>
          ) : (
            <p className="text-gray-500">Chưa có mô tả.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PostWizard() {
  const { data: session, status: sessionStatus } = useSession();
  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "verified" | "pending" | "unverified"
  >("loading");
  const [step, setStep] = useState(0);

  const [draft, setDraft] = useState<ListingDraft>(() => createEmptyDraft());
  const [isDragging, setIsDragging] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [postConsents, setPostConsents] = useState(() => createDefaultConsents());
  const [draftReady, setDraftReady] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [showDiscardDraftDialog, setShowDiscardDraftDialog] = useState(false);
  const [draftNotice, setDraftNotice] = useState<string | null>(null);

  const refreshVerificationStatus = useCallback(async () => {
    const syncFromStorage = () => {
      setVerificationStatus(readVerificationStatusFromStorage());
    };

    const accessToken = session?.user?.accessToken;
    if (!accessToken) {
      syncFromStorage();
      return;
    }

    try {
      const data = await getIdentityVerificationOverview(accessToken);
      setVerificationStatus(data.status);
    } catch {
      syncFromStorage();
    }
  }, [session?.user?.accessToken]);

  const hydrateDraft = () => {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<DraftSnapshot>;
      if (parsed.version && parsed.version !== DRAFT_STORAGE_VERSION) {
        return;
      }
      if (!parsed.draft) return;
      const base = createEmptyDraft();
      const nextDraft: ListingDraft = {
        ...base,
        ...parsed.draft,
        roommateLifestyle: {
          ...base.roommateLifestyle,
          ...(parsed.draft.roommateLifestyle ?? {}),
        },
        amenities: {
          ...base.amenities,
          ...(parsed.draft.amenities ?? {}),
        },
        images: [],
      };
      setDraft(nextDraft);
      if (typeof parsed.step === "number" && Number.isFinite(parsed.step)) {
        const safeStep = Math.min(Math.max(parsed.step, 0), steps.length - 1);
        setStep(safeStep);
      }
      if (parsed.postConsents) {
        setPostConsents({ ...createDefaultConsents(), ...parsed.postConsents });
      }
      if (parsed.savedAt) {
        setDraftSavedAt(parsed.savedAt);
      }
    } catch (error) {
      console.error("Draft restore failed.", error);
    }
  };

  const currentAddress = buildAddress(draft);

  const persistDraft = useCallback(() => {
    try {
      const { images, ...rest } = draft;
      void images;
      const payload: DraftSnapshot = {
        version: DRAFT_STORAGE_VERSION,
        savedAt: new Date().toISOString(),
        step,
        mapQuery: currentAddress,
        postConsents,
        draft: rest,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      setDraftSavedAt(payload.savedAt);
    } catch (error) {
      console.error("Draft save failed.", error);
    }
  }, [currentAddress, draft, step, postConsents]);

  const clearDraftStorage = (resetForm: boolean) => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setDraftSavedAt(null);
    if (resetForm) {
      setDraft(createEmptyDraft());
      setStep(0);
      setPostConsents(createDefaultConsents());
      setActiveImageIdx(0);
      setSubmitError(null);
      setSubmitSuccess(null);
    }
  };

  const handleDiscardDraft = () => {
    setShowDiscardDraftDialog(true);
  };

  const confirmDiscardDraft = () => {
    clearDraftStorage(true);
    setShowDiscardDraftDialog(false);
    setDraftNotice("Đã xoá bản nháp. Bạn có thể nhập lại từ đầu.");
  };

  const cancelDiscardDraft = () => {
    setShowDiscardDraftDialog(false);
  };

  useEffect(() => {
    hydrateDraft();
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    void refreshVerificationStatus();
  }, [refreshVerificationStatus, sessionStatus]);

  useEffect(() => {
    const syncVerification = () => {
      void refreshVerificationStatus();
    };

    window.addEventListener("storage", syncVerification);
    window.addEventListener("focus", syncVerification);
    window.addEventListener(VERIFICATION_STATUS_EVENT, syncVerification as EventListener);

    return () => {
      window.removeEventListener("storage", syncVerification);
      window.removeEventListener("focus", syncVerification);
      window.removeEventListener(VERIFICATION_STATUS_EVENT, syncVerification as EventListener);
    };
  }, [refreshVerificationStatus]);

  useEffect(() => {
    if (!draftReady) return;
    const timer = setTimeout(() => {
      persistDraft();
    }, DRAFT_SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [draftReady, persistDraft]);

  useEffect(() => {
    if (!draftNotice) return;
    const timer = setTimeout(() => setDraftNotice(null), 3200);
    return () => clearTimeout(timer);
  }, [draftNotice]);

  const canNext = useMemo(() => {
    if (step === 0) {
      const baseReady =
        draft.title.trim().length >= 8 &&
        toNumber(draft.priceVnd) > 0 &&
        toNumber(draft.areaM2) > 0 &&
        toNumber(draft.maxPeople) > 0;
      if (draft.purpose === "ROOMMATE") {
        const currentOcc = toNumber(draft.roommateCurrentOccupancy);
        const maxOcc = toNumber(draft.roommateMaxOccupancy);
        const requested = toNumber(draft.maxPeople);
        const capacityLeft = Math.max(0, maxOcc - currentOcc);
        const hasCapacity = maxOcc > 0 && currentOcc < maxOcc && requested <= capacityLeft;
        const hasListing = draft.roommateListingId.trim().length > 0;
        const hasContact = draft.roommateContact.trim().length > 0;
        const approvalOk =
          draft.roommateLinkType === "LANDLORD_ASSIST" ||
          (draft.roommateNotifyLandlord &&
            draft.roommateLandlordConsent &&
            draft.roommateApprovalStatus === "approved");
        return baseReady && hasListing && hasContact && hasCapacity && approvalOk;
      }
      return baseReady && verificationStatus === "verified";
    }
    if (step === 1) {
      return draft.addressText.trim().length >= 6 && draft.district.trim().length > 0;
    }
    if (step === 2) return true;
    if (step === 3) {
      return draft.images.length > 0 && draft.description.trim().length >= 20; // tối thiểu mô tả
    }
    return true;
  }, [draft, step, verificationStatus]);

  const canSubmit = useMemo(() => {
    const consentOk = postConsents.terms && postConsents.privacy && postConsents.policy;
    if (!consentOk) return false;
    if (draft.purpose === "RENT") {
      return verificationStatus === "verified";
    }
    const currentOcc = toNumber(draft.roommateCurrentOccupancy);
    const maxOcc = toNumber(draft.roommateMaxOccupancy);
    const requested = toNumber(draft.maxPeople);
    const capacityLeft = Math.max(0, maxOcc - currentOcc);
    const hasCapacity = maxOcc > 0 && currentOcc < maxOcc && requested <= capacityLeft;
    const hasListing = draft.roommateListingId.trim().length > 0;
    const hasContact = draft.roommateContact.trim().length > 0;
    if (!hasListing || !hasContact || !hasCapacity) return false;
    if (draft.roommateLinkType === "TENANT_SELF") {
      return (
        draft.roommateNotifyLandlord &&
        draft.roommateLandlordConsent &&
        draft.roommateApprovalStatus === "approved"
      );
    }
    return true;
  }, [draft, postConsents, verificationStatus]);

  if (verificationStatus === "loading") {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-12">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-lg font-semibold text-gray-900">Đang kiểm tra xác minh...</div>
          <div className="mt-2 text-sm text-gray-500">Vui lòng chờ trong giây lát.</div>
        </div>
      </div>
    );
  }

  const isVerified = verificationStatus === "verified";
  const isPending = verificationStatus === "pending";
  const linkedListing = roommateListingCatalog.find((item) => item.id === draft.roommateListingId) ?? null;
  const roommateApprovalBadge: Record<RoommateApprovalStatus, { label: string; tone: string }> = {
    approved: { label: "Đã được chủ trọ xác nhận", tone: "bg-green-100 text-green-800" },
    pending: { label: "Chờ chủ trọ xác nhận", tone: "bg-yellow-100 text-yellow-800" },
    rejected: { label: "Chủ trọ từ chối", tone: "bg-red-100 text-red-700" },
  };
  const roommateCurrentCount = toNumber(draft.roommateCurrentOccupancy);
  const roommateMaxCount = toNumber(draft.roommateMaxOccupancy);
  const roommateAtCapacity = roommateMaxCount > 0 && roommateCurrentCount >= roommateMaxCount;
  const roommateCapacityLeft = Math.max(0, roommateMaxCount - roommateCurrentCount);
  const roommateRequestedCount = toNumber(draft.maxPeople);
  const roommateOverLimit = roommateMaxCount > 0 && roommateRequestedCount > roommateCapacityLeft;

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }

  function onPickImages(files: FileList | File[] | null) {
    if (!files) return;
    const arr = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 10);
    if (arr.length === 0) return;
    setDraft((d) => ({ ...d, images: arr }));
    setActiveImageIdx(0);
  }

  function prevImage() {
    setActiveImageIdx((idx) => {
      const total = draft.images.length;
      if (total <= 1) return 0;
      return (idx - 1 + total) % total;
    });
  }

  function nextImage() {
    setActiveImageIdx((idx) => {
      const total = draft.images.length;
      if (total <= 1) return 0;
      return (idx + 1) % total;
    });
  }

  function handleDropImages(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    onPickImages(e.dataTransfer?.files || null);
  }

  function handleDragOverImages(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeaveImages(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  async function submit() {
    if (isSubmitting) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    if (!canSubmit) {
      setSubmitError("Vui lòng hoàn tất xác nhận và đồng ý điều khoản trước khi đăng.");
      return;
    }
    setIsSubmitting(true);

    try {
      if (draft.purpose === "ROOMMATE" && draft.roommateLinkType === "LANDLORD_ASSIST") {
        setSubmitSuccess("Đã gửi yêu cầu nhờ chủ trọ hỗ trợ đăng tin ở ghép.");
        clearDraftStorage(false);
        return;
      }
      const categoryName = categoryNameMap[draft.type];
      const amenityNames = collectAmenityNames(draft.amenities);
      const address = currentAddress;
      const maxOccupancy = toNumber(draft.maxPeople);
      const imageUrls = await uploadImages(draft.images.slice(0, 10));

      const payload = {
        title: draft.title.trim(),
        description: buildFinalDescription(draft),
        price: toNumber(draft.priceVnd),
        area: toNumber(draft.areaM2),
        address: address,
        latitude: draft.lat,
        longitude: draft.lng,
        max_occupancy: maxOccupancy > 0 ? maxOccupancy : undefined,
        campus: draft.campus,
        availability: draft.availability,
        videoUrl: draft.videoUrl.trim() || undefined,
        categoryName,
        amenityNames: amenityNames.length > 0 ? amenityNames : undefined,
        imageUrls,
      };

      const result = await createPost(payload);
      const message =
        (result as { message?: string })?.message ||
        (draft.purpose === "ROOMMATE"
          ? "Đăng tin ở ghép thành công. Tin đang chờ chủ trọ xác nhận."
          : "Đăng tin thành công. Tin đang chờ duyệt và sẽ sớm được hiển thị.");
      setSubmitSuccess(message);
      clearDraftStorage(false);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ||
        (err as { message?: string })?.message ||
        "Dang tin that bai.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-none px-4 py-8 sm:px-6 lg:px-12">
      {draftNotice ? (
        <div className="fixed right-4 top-4 z-70 max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-lg">
          {draftNotice}
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-bold text-gray-900">
            {draft.purpose === "ROOMMATE" ? "Đăng tin ở ghép" : "Đăng tin cho thuê"}
          </div>
          <div className="mt-1 text-sm text-gray-500">
            Điền theo từng bước để tin đăng đầy đủ và dễ duyệt.
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Bản nháp tự lưu theo thời gian. Ảnh không được lưu trong bản nháp.
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
          {draftSavedAt ? (
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-600">
              Đã lưu {formatDraftTimestamp(draftSavedAt)}
            </span>
          ) : (
            <span className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-600">
              Chưa có bản nháp
            </span>
          )}
          {draftSavedAt ? (
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Bỏ bản nháp
            </button>
          ) : null}
        </div>
      </div>

      {!isVerified && draft.purpose === "RENT" && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-gray-900">Cần xác minh chủ trọ trước khi đăng tin</div>
              <p className="mt-1 text-sm text-gray-600">
                Hệ thống yêu cầu xác minh để đảm bảo tính minh bạch và hạn chế tranh chấp. Bạn vẫn có thể chọn
                loại tin “Ở ghép” để đăng theo cơ chế xin xác nhận chủ trọ.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isPending ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700"
              }`}
            >
              {isPending ? "Hồ sơ đang duyệt" : "Chưa xác minh"}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={refreshVerificationStatus}
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Kiểm tra lại
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Stepper current={step} />

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Xem trước nhanh</div>
            <div className="mt-1 text-xs text-gray-500">
              Preview thay đổi theo dữ liệu nhập.
            </div>
            <div className="mt-4">
              <PreviewCard
                data={draft}
                activeImageIdx={activeImageIdx}
                onPrevImage={prevImage}
                onNextImage={nextImage}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* STEP 1 */}
          {step === 0 && (
            <StepShell title="Bước 1: Thông tin cơ bản" subtitle="Nhập những thông tin người thuê quan tâm nhất.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FieldLabel>Tiêu đề tin</FieldLabel>
                  <Input
                    value={draft.title}
                    onChange={(v) => setDraft((d) => ({ ...d, title: v }))}
                    placeholder="VD: Phòng trọ mới xây gần VLU, full tiện nghi"
                  />
                  <div className="mt-1 text-xs text-gray-500">Tối thiểu 8 ký tự.</div>
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>Loại tin đăng</FieldLabel>
                  <Select
                    value={draft.purpose}
                    onChange={(v) => setDraft((d) => ({ ...d, purpose: v as ListingPurpose }))}
                    options={[
                      { value: "RENT", label: "Cho thuê phòng" },
                      { value: "ROOMMATE", label: "Tìm người ở ghép" },
                    ]}
                  />
                </div>

                <div>
                  <FieldLabel>Loại bất động sản</FieldLabel>
                  <Select
                    value={draft.type}
                    onChange={(v) => setDraft((d) => ({ ...d, type: v as ListingType }))}
                    options={[
                      { value: "PHONG_TRO", label: "Phòng trọ" },
                      { value: "CAN_HO", label: "Căn hộ" },
                      { value: "NHA_NGUYEN_CAN", label: "Nhà nguyên căn" },
                    ]}
                  />
                </div>

                <div>
                  <FieldLabel>Mức nội thất</FieldLabel>
                  <Select
                    value={draft.furnishing}
                    onChange={(v) => setDraft((d) => ({ ...d, furnishing: v as Furnishing }))}
                    options={[
                      { value: "NONE", label: "Không nội thất" },
                      { value: "BASIC", label: "Cơ bản" },
                      { value: "FULL", label: "Full nội thất" },
                    ]}
                  />
                </div>

                <div>
                  <FieldLabel>
                    {draft.purpose === "ROOMMATE" ? "Ngân sách mỗi người (VND/tháng)" : "Giá thuê (VND/tháng)"}
                  </FieldLabel>
                  <Input
                    value={draft.priceVnd}
                    onChange={(v) => setDraft((d) => ({ ...d, priceVnd: formatVndInput(v) }))}
                    placeholder={draft.purpose === "ROOMMATE" ? "VD: 2.500.000" : "VD: 4.500.000"}
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <FieldLabel>Diện tích (m²)</FieldLabel>
                  <Input
                    value={draft.areaM2}
                    onChange={(v) => setDraft((d) => ({ ...d, areaM2: v.replace(/[^\d]/g, "") }))}
                    placeholder="VD: 25"
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <FieldLabel>{draft.purpose === "ROOMMATE" ? "Cần thêm (người)" : "Số người tối đa"}</FieldLabel>
                  <Input
                    value={draft.maxPeople}
                    onChange={(v) => setDraft((d) => ({ ...d, maxPeople: v.replace(/[^\d]/g, "") }))}
                    placeholder={draft.purpose === "ROOMMATE" ? "VD: 1" : "VD: 2"}
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <FieldLabel>Cơ sở VLU</FieldLabel>
                  <Select
                    value={draft.campus}
                    onChange={(v) => setDraft((d) => ({ ...d, campus: v as "CS1" | "CS2" | "CS3" }))}
                    options={[
                      { value: "CS1", label: "CS1" },
                      { value: "CS2", label: "CS2" },
                      { value: "CS3", label: "CS3" },
                    ]}
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>Video URL (không bắt buộc)</FieldLabel>
                  <Input
                    value={draft.videoUrl}
                    onChange={(v) => setDraft((d) => ({ ...d, videoUrl: v }))}
                    placeholder="VD: https://youtube.com/watch?v=..."
                  />
                </div>
              </div>
              {draft.purpose === "RENT" && !isVerified && (
                <div className="mt-3 text-xs text-red-600">
                  Bạn cần xác minh chủ trọ để đăng tin cho thuê.
                </div>
              )}

              {draft.purpose === "ROOMMATE" && (
                <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-900">Thông tin ở ghép</div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <FieldLabel>Liên kết phòng trọ gốc (đang thuê)</FieldLabel>
                      <Select
                        value={draft.roommateListingId}
                        onChange={(v) => {
                          const picked = roommateListingCatalog.find((item) => item.id === v);
                          setDraft((d) => ({
                            ...d,
                            roommateListingId: v,
                            roommateListingTitle: picked?.title ?? "",
                            roommateListingAddress: picked?.address ?? "",
                            roommateLandlordName: picked?.landlordName ?? "",
                            roommateCurrentOccupancy: picked ? String(picked.currentOccupancy) : "",
                            roommateMaxOccupancy: picked ? String(picked.maxOccupancy) : "",
                          }));
                        }}
                        options={[{ value: "", label: "Chọn phòng đang thuê" }, ...roommateListingOptions]}
                      />
                    </div>
                    <div>
                      <FieldLabel>Số người hiện tại</FieldLabel>
                      <Input
                        value={draft.roommateCurrentOccupancy}
                        onChange={(v) =>
                          setDraft((d) => ({
                            ...d,
                            roommateCurrentOccupancy: v.replace(/[^\d]/g, ""),
                          }))
                        }
                        placeholder="VD: 2"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <FieldLabel>Giới hạn tối đa</FieldLabel>
                      <Input
                        value={draft.roommateMaxOccupancy}
                        onChange={(v) =>
                          setDraft((d) => ({
                            ...d,
                            roommateMaxOccupancy: v.replace(/[^\d]/g, ""),
                          }))
                        }
                        placeholder="VD: 3"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <FieldLabel>Hình thức đăng ở ghép</FieldLabel>
                      <Select
                        value={draft.roommateLinkType}
                        onChange={(v) => setDraft((d) => ({ ...d, roommateLinkType: v as RoommateLinkType }))}
                        options={[
                          { value: "LANDLORD_ASSIST", label: "Nhờ chủ trọ hỗ trợ đăng" },
                          { value: "TENANT_SELF", label: "Người thuê tự đăng (cần xác nhận)" },
                        ]}
                      />
                    </div>
                  </div>

                  {linkedListing ? (
                    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{linkedListing.title}</div>
                          <div className="text-xs text-gray-500">{linkedListing.address}</div>
                        </div>
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                          {draft.roommateCurrentOccupancy || "--"}/{draft.roommateMaxOccupancy || "--"} người
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Chủ trọ: <span className="font-semibold text-gray-700">{linkedListing.landlordName}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-xs text-gray-500">
                      Chọn phòng trọ gốc để liên kết bài đăng ở ghép.
                    </div>
                  )}

                  {roommateAtCapacity && (
                    <div className="mt-3 text-xs text-red-600">
                      Phòng đã đủ số người tối đa, không thể đăng thêm ở ghép.
                    </div>
                  )}
                  {!roommateAtCapacity && roommateOverLimit && (
                    <div className="mt-3 text-xs text-red-600">
                      Số người cần thêm vượt quá chỗ trống còn lại ({roommateCapacityLeft}).
                    </div>
                  )}

                  {draft.roommateLinkType === "TENANT_SELF" ? (
                    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="text-sm font-semibold text-gray-900">Xác nhận chủ trọ</div>
                      <div className="mt-3 space-y-2 text-sm text-gray-600">
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                            checked={draft.roommateNotifyLandlord}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, roommateNotifyLandlord: e.target.checked }))
                            }
                          />
                          <span>Tôi đã thông báo nhu cầu ở ghép cho chủ trọ.</span>
                        </label>
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                            checked={draft.roommateLandlordConsent}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, roommateLandlordConsent: e.target.checked }))
                            }
                          />
                          <span>Tôi đã nhận được sự đồng ý của chủ trọ để đăng bài.</span>
                        </label>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            roommateApprovalBadge[draft.roommateApprovalStatus].tone
                          }`}
                        >
                          {roommateApprovalBadge[draft.roommateApprovalStatus].label}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({ ...d, roommateApprovalStatus: "approved" }))
                          }
                          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Giả lập chủ trọ xác nhận
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({ ...d, roommateApprovalStatus: "rejected" }))
                          }
                          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Giả lập từ chối
                        </button>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Bài đăng chỉ được duyệt khi chủ trọ xác nhận đồng ý.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-700">
                      <div className="text-sm font-semibold text-gray-900">Nhờ chủ trọ hỗ trợ đăng</div>
                      <p className="mt-1 text-xs text-gray-500">
                        Yêu cầu của bạn sẽ được gửi đến chủ trọ. Chủ trọ sẽ đăng bài hoặc phản hồi trực tiếp.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <FieldLabel>Ngày vào ở dự kiến</FieldLabel>
                      <Input
                        type="date"
                        value={draft.roommateMoveInDate}
                        onChange={(v) => setDraft((d) => ({ ...d, roommateMoveInDate: v }))}
                      />
                    </div>
                    <div>
                      <FieldLabel>Giới tính ưu tiên</FieldLabel>
                      <Select
                        value={draft.roommateGender}
                        onChange={(v) => setDraft((d) => ({ ...d, roommateGender: v }))}
                        options={[
                          { value: "Không yêu cầu", label: "Không yêu cầu" },
                          { value: "Nam", label: "Nam" },
                          { value: "Nữ", label: "Nữ" },
                          { value: "Khác", label: "Khác" },
                        ]}
                      />
                    </div>
                    <div>
                      <FieldLabel>Nghề nghiệp ưu tiên</FieldLabel>
                      <Select
                        value={draft.roommateOccupation}
                        onChange={(v) => setDraft((d) => ({ ...d, roommateOccupation: v }))}
                        options={[
                          { value: "Sinh viên", label: "Sinh viên" },
                          { value: "Nhân viên văn phòng", label: "Nhân viên văn phòng" },
                          { value: "Freelancer", label: "Freelancer" },
                          { value: "Không yêu cầu", label: "Không yêu cầu" },
                        ]}
                      />
                    </div>
                    <div>
                      <FieldLabel>Liên hệ (Zalo/SĐT)</FieldLabel>
                      <Input
                        value={draft.roommateContact}
                        onChange={(v) => setDraft((d) => ({ ...d, roommateContact: v }))}
                        placeholder="VD: 09xx xxx xxx"
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Toggle
                      checked={draft.roommateLifestyle.quiet}
                      onChange={(v) =>
                        setDraft((d) => ({ ...d, roommateLifestyle: { ...d.roommateLifestyle, quiet: v } }))
                      }
                      label="Yên tĩnh"
                      desc="Ưu tiên không gian yên tĩnh"
                    />
                    <Toggle
                      checked={draft.roommateLifestyle.clean}
                      onChange={(v) =>
                        setDraft((d) => ({ ...d, roommateLifestyle: { ...d.roommateLifestyle, clean: v } }))
                      }
                      label="Gọn gàng"
                      desc="Giữ phòng sạch sẽ, ngăn nắp"
                    />
                    <Toggle
                      checked={draft.roommateLifestyle.noSmoking}
                      onChange={(v) =>
                        setDraft((d) => ({ ...d, roommateLifestyle: { ...d.roommateLifestyle, noSmoking: v } }))
                      }
                      label="Không hút thuốc"
                      desc="Ưu tiên không hút thuốc trong phòng"
                    />
                    <Toggle
                      checked={draft.roommateLifestyle.noPets}
                      onChange={(v) =>
                        setDraft((d) => ({ ...d, roommateLifestyle: { ...d.roommateLifestyle, noPets: v } }))
                      }
                      label="Không nuôi thú cưng"
                      desc="Không nuôi thú cưng trong phòng"
                    />
                    <Toggle
                      checked={draft.roommateLifestyle.shareUtility}
                      onChange={(v) =>
                        setDraft((d) => ({
                          ...d,
                          roommateLifestyle: { ...d.roommateLifestyle, shareUtility: v },
                        }))
                      }
                      label="Chia sẻ tiện ích"
                      desc="Sẵn sàng chia sẻ tiện ích chung"
                    />
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    Thông tin ở ghép sẽ được gộp vào mô tả khi đăng tin.
                  </div>
                </div>
              )}
            </StepShell>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <StepShell title="Bước 2: Vị trí" subtitle="Địa chỉ rõ ràng giúp người thuê tin tưởng hơn.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FieldLabel>{draft.purpose === "ROOMMATE" ? "Địa chỉ / khu vực" : "Số nhà - Tên đường"}</FieldLabel>
                  <Input
                    value={draft.addressText}
                    onChange={(v) => setDraft((d) => ({ ...d, addressText: v }))}
                    placeholder={
                      draft.purpose === "ROOMMATE"
                        ? "VD: 12/3 Nguyễn Gia Trí hoặc khu vực gần VLU"
                        : "VD: 12/3 Nguyễn Gia Trí"
                    }
                  />
                </div>

                <div>
                  <FieldLabel>Phường</FieldLabel>
                  <Input
                    value={draft.ward}
                    onChange={(v) => setDraft((d) => ({ ...d, ward: v }))}
                    placeholder="VD: Phường 01"
                  />
                </div>

                <div>
                  <FieldLabel>Quận</FieldLabel>
                  <Select
                    value={draft.district}
                    onChange={(v) => setDraft((d) => ({ ...d, district: v }))}
                    options={[
                      { value: "Quận 1", label: "Quận 1" },
                      { value: "Quận 3", label: "Quận 3" },
                      { value: "Quận 4", label: "Quận 4" },
                      { value: "Quận 5", label: "Quận 5" },
                      { value: "Quận 6", label: "Quận 6" },
                      { value: "Quận 7", label: "Quận 7" },
                      { value: "Quận 8", label: "Quận 8" },
                      { value: "Quận 10", label: "Quận 10" },
                      { value: "Quận 11", label: "Quận 11" },
                      { value: "Quận 12", label: "Quận 12" },
                      { value: "Quận Bình Thạnh", label: "Quận Bình Thạnh" },
                      { value: "Quận Gò Vấp", label: "Quận Gò Vấp" },
                      { value: "Quận Phú Nhuận", label: "Quận Phú Nhuận" },
                      { value: "Quận Tân Bình", label: "Quận Tân Bình" },
                      { value: "Quận Tân Phú", label: "Quận Tân Phú" },
                      { value: "Quận Bình Tân", label: "Quận Bình Tân" },
                      { value: "Thành phố Thủ Đức", label: "Thành phố Thủ Đức" },
                      { value: "Huyện Bình Chánh", label: "Huyện Bình Chánh" },
                      { value: "Huyện Cần Giờ", label: "Huyện Cần Giờ" },
                      { value: "Huyện Củ Chi", label: "Huyện Củ Chi" },
                      { value: "Huyện Hóc Môn", label: "Huyện Hóc Môn" },
                      { value: "Huyện Nhà Bè", label: "Huyện Nhà Bè" },
                    ]}
                  />
                </div>

                <div className="md:col-span-2">
                  <FieldLabel>Map</FieldLabel>
                  <div className="space-y-3">
                    <div className="h-136 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                      <MapPicker
                        defaultAddress={currentAddress}
                        value={
                          Number.isFinite(draft.lat) && Number.isFinite(draft.lng)
                            ? { lat: draft.lat as number, lng: draft.lng as number }
                            : null
                        }
                        onChange={(value) => setDraft((d) => ({ ...d, lat: value.lat, lng: value.lng }))}
                      />
                    </div>
                    <div className="text-xs text-gray-500">Bạn có thể lấy tọa độ theo địa chỉ hoặc nhập tay latitude/longitude.</div>
                    {Number.isFinite(draft.lat) && Number.isFinite(draft.lng) && (
                      <div className="text-xs text-gray-600">
                        lat: {draft.lat} - lng: {draft.lng}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </StepShell>
          )}

          {/* STEP 3 */}
          {step === 2 && (
            <StepShell title="Bước 3: Tiện ích" subtitle="Tick những tiện ích có thật để tránh bị report.">
              <div className="grid gap-3 md:grid-cols-2">
                <Toggle
                  checked={draft.amenities.wifi}
                  onChange={(v) => setDraft((d) => ({ ...d, amenities: { ...d.amenities, wifi: v } }))}
                  label="Wifi"
                  desc="Có wifi sử dụng trong phòng/khu trọ"
                />
                <Toggle
                  checked={draft.amenities.aircon}
                  onChange={(v) => setDraft((d) => ({ ...d, amenities: { ...d.amenities, aircon: v } }))}
                  label="Máy lạnh"
                  desc="Có điều hòa hoạt động tốt"
                />
                <Toggle
                  checked={draft.amenities.privateWc}
                  onChange={(v) => setDraft((d) => ({ ...d, amenities: { ...d.amenities, privateWc: v } }))}
                  label="WC riêng"
                  desc="Không dùng chung"
                />
                <Toggle
                  checked={draft.amenities.mezzanine}
                  onChange={(v) => setDraft((d) => ({ ...d, amenities: { ...d.amenities, mezzanine: v } }))}
                  label="Gác lửng"
                  desc="Có gác lửng/giường tầng"
                />
                <Toggle
                  checked={draft.amenities.parking}
                  onChange={(v) => setDraft((d) => ({ ...d, amenities: { ...d.amenities, parking: v } }))}
                  label="Giữ xe"
                  desc="Có chỗ để xe an toàn"
                />
                <Toggle
                  checked={draft.amenities.freeTime}
                  onChange={(v) => setDraft((d) => ({ ...d, amenities: { ...d.amenities, freeTime: v } }))}
                  label="Giờ giấc tự do"
                  desc="Không giới hạn giờ"
                />
              </div>
            </StepShell>
          )}

          {/* STEP 4 */}
          {step === 3 && (
            <StepShell title="Bước 4: Hình ảnh & mô tả" subtitle="Ảnh rõ + mô tả đủ sẽ tăng tỷ lệ được liên hệ.">
              <div className="grid gap-4">
                <div>
                  <FieldLabel>Ảnh (tối đa 10)</FieldLabel>
                  <label
                    htmlFor="media-upload"
                    role="button"
                    onDrop={handleDropImages}
                    onDragOver={handleDragOverImages}
                    onDragEnter={handleDragOverImages}
                    onDragLeave={handleDragLeaveImages}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed bg-white px-4 py-6 text-center transition",
                      isDragging ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="text-sm font-semibold text-gray-900">Kéo thả ảnh vào đây</div>
                    <div className="text-xs text-gray-500">
                      Hoặc bấm chọn từ máy (tối đa 10 ảnh, JPEG/PNG...)
                    </div>
                    <div className="mt-1 rounded-full bg-gray-900 px-4 py-1 text-xs font-semibold text-white">
                      Thêm ảnh
                    </div>
                    <input
                      id="media-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => onPickImages(e.target.files)}
                      className="hidden"
                    />
                  </label>
                  {draft.images.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {(() => {
                        const currentImage = draft.images[activeImageIdx] ?? draft.images[0];
                        return (
                          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt={currentImage?.name ?? "preview"}
                              src={currentImage ? URL.createObjectURL(currentImage) : ""}
                              className="aspect-video w-full object-contain bg-white"
                            />

                            {draft.images.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={prevImage}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-gray-200 bg-white/90 p-2 text-sm font-semibold text-gray-700 shadow hover:bg-white"
                                >
                                  &lt;
                                </button>
                                <button
                                  type="button"
                                  onClick={nextImage}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-gray-200 bg-white/90 p-2 text-sm font-semibold text-gray-700 shadow hover:bg-white"
                                >
                                  &gt;
                                </button>
                                <div className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-700 shadow">
                                  {activeImageIdx + 1}/{draft.images.length}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })()}

                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {draft.images.map((f, idx) => (
                          <button
                            key={f.name + idx}
                            type="button"
                            onClick={() => setActiveImageIdx(idx)}
                            className={cn(
                              "group overflow-hidden rounded-2xl border bg-white text-left transition",
                              idx === activeImageIdx
                                ? "border-gray-900 ring-2 ring-gray-900/15"
                                : "border-gray-200 hover:border-gray-300"
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              alt={f.name}
                              src={URL.createObjectURL(f)}
                              className="aspect-square w-full object-cover transition group-hover:scale-[1.02]"
                            />
                            <div className="p-2 text-xs text-gray-600 line-clamp-1">{f.name}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <FieldLabel>Mô tả chi tiết</FieldLabel>
                  <Textarea
                    value={draft.description}
                    onChange={(v) => setDraft((d) => ({ ...d, description: v }))}
                    placeholder={`Gợi ý nội dung:
                      - Phòng rộng bao nhiêu, có cửa sổ không?
                      - Nội thất gồm gì?
                      - Giờ giấc, an ninh, gửi xe?
                      - Tiền cọc, điện nước theo giá nào?
                      - Ưu tiên sinh viên / đi làm?`}
                    rows={7}
                  />
                  <div className="mt-1 text-xs text-gray-500">Tối thiểu 20 ký tự.</div>
                  {draft.purpose === "ROOMMATE" && (
                    <div className="mt-1 text-xs text-gray-500">
                      Thông tin ở ghép sẽ được tự động chèn vào mô tả khi đăng.
                    </div>
                  )}
                </div>
              </div>
            </StepShell>
          )}

          {/* STEP 5 */}
            {step === 4 && (
              <StepShell title="Bước 5: Xem trước & đăng" subtitle="Kiểm tra lại lần cuối trước khi đăng tin.">
                <PreviewCard
                  data={draft}
                  activeImageIdx={activeImageIdx}
                  onPrevImage={prevImage}
                  onNextImage={nextImage}
                />
                <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-sm font-semibold text-gray-900">Gợi ý nhanh</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                    <li>Tiêu đề nên có vị trí + điểm mạnh (gần trường, full nội thất...).</li>
                    <li>Ảnh nên có: mặt tiền, phòng ngủ, WC, bếp, lối gửi xe.</li>
                    <li>Mô tả nên ghi rõ điện/nước, cọc, số người tối đa.</li>
                  </ul>
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">Xác nhận điều khoản</div>
                  <div className="mt-3 space-y-2 text-sm text-gray-600">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        checked={postConsents.terms}
                        onChange={(e) => setPostConsents((prev) => ({ ...prev, terms: e.target.checked }))}
                      />
                      <span>
                        Tôi đồng ý với{" "}
                        <Link href="/terms" className="font-semibold text-gray-800 hover:text-[#D51F35]">
                          Điều khoản sử dụng
                        </Link>
                        .
                      </span>
                    </label>
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        checked={postConsents.privacy}
                        onChange={(e) => setPostConsents((prev) => ({ ...prev, privacy: e.target.checked }))}
                      />
                      <span>
                        Tôi đồng ý với{" "}
                        <Link href="/privacy" className="font-semibold text-gray-800 hover:text-[#D51F35]">
                          Chính sách bảo mật
                        </Link>
                        .
                      </span>
                    </label>
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                        checked={postConsents.policy}
                        onChange={(e) => setPostConsents((prev) => ({ ...prev, policy: e.target.checked }))}
                      />
                      <span>
                        Tôi đã đọc{" "}
                        <Link href="/user-policy" className="font-semibold text-gray-800 hover:text-[#D51F35]">
                          quy định ở ghép, hợp đồng và tiền cọc
                        </Link>
                        .
                      </span>
                    </label>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    Nền tảng đóng vai trò trung gian; trách nhiệm về tính chính xác thông tin và tranh chấp thuộc
                    về bên cho thuê và người thuê.
                  </div>
                </div>

                {draft.purpose === "ROOMMATE" && (
                  <div className="mt-3 text-xs text-gray-500">
                    Bài đăng ở ghép phải được chủ trọ xác nhận trước khi hiển thị công khai.
                  </div>
                )}
              </StepShell>
            )}

          {/* Footer actions */}
          <div className="sticky bottom-4 z-10">
            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                  className={cn(
                    "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition",
                    step === 0
                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                      : "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                  )}
                >
                  Quay lại
                </button>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <div className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 md:inline-flex">
                    Bước {step + 1}/{steps.length}
                  </div>

                  {step < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={next}
                      disabled={!canNext}
                      className={cn(
                        "inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold transition shadow-sm",
                        canNext
                          ? "bg-gray-900 text-white hover:bg-black"
                          : "cursor-not-allowed bg-gray-100 text-gray-400"
                      )}
                    >
                      Tiếp tục
                    </button>
                    ) : (                    <button
                        type="button"
                        onClick={submit}
                        disabled={isSubmitting || !canSubmit}
                        className={cn(
                          "inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold shadow-sm transition",
                          isSubmitting || !canSubmit
                            ? "cursor-not-allowed bg-gray-200 text-gray-500"
                            : "bg-gray-900 text-white hover:bg-black"
                        )}
                      >
                        {isSubmitting
                          ? "Đang gửi..."
                          : draft.purpose === "ROOMMATE" && draft.roommateLinkType === "LANDLORD_ASSIST"
                          ? "Gửi yêu cầu"
                          : "Đăng tin"}
                      </button>
                    )}
                </div>
              </div>

              {!canNext && step !== 4 && (
                <div className="mt-2 text-xs text-gray-500">
                  Vui lòng điền đủ thông tin bắt buộc để tiếp tục.
                </div>
              )}
              {step === 4 && !canSubmit && (
                <div className="mt-2 text-xs text-gray-500">
                  Vui lòng đồng ý điều khoản và đảm bảo đủ điều kiện xác minh trước khi đăng.
                </div>
              )}

              {submitError && (
                <div className="mt-2 text-xs text-red-600">{submitError}</div>
              )}
              {submitSuccess && (
                <div className="mt-2 text-xs text-green-600">{submitSuccess}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDiscardDraftDialog ? (
        <div
          className="fixed inset-0 z-65 flex items-center justify-center bg-black/50 px-4"
          onClick={cancelDiscardDraft}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-lg font-semibold text-gray-900">Xoá bản nháp?</div>
            <p className="mt-2 text-sm text-gray-600">
              Bản nháp hiện tại sẽ bị xoá và form sẽ được đặt lại từ đầu.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelDiscardDraft}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={confirmDiscardDraft}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Xoá bản nháp
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}