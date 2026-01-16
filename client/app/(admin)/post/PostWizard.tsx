"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { createPost, uploadImages } from "@/app/services/posts";

type ListingType = "PHONG_TRO" | "CAN_HO" | "NHA_NGUYEN_CAN";
type Furnishing = "NONE" | "BASIC" | "FULL";

type Amenities = {
  wifi: boolean;
  aircon: boolean;
  privateWc: boolean;
  mezzanine: boolean;
  parking: boolean;
  freeTime: boolean;
};

type ListingDraft = {
  title: string;
  type: ListingType;
  priceVnd: string; // giá string để format dễ đọc, backend parse sau
  areaM2: string;
  maxPeople: string;

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

const steps = [
  { key: "basic", label: "Cơ bản" },
  { key: "location", label: "Vị trí" },
  { key: "amenities", label: "Tiện ích" },
  { key: "media", label: "Hình ảnh & mô tả" },
  { key: "preview", label: "Xem trước" },
] as const;

const categoryNameMap: Record<ListingType, string> = {
  PHONG_TRO: "Phong tro",
  CAN_HO: "Can ho",
  NHA_NGUYEN_CAN: "Nha nguyen can",
};

const amenityNameMap: Record<keyof Amenities, string> = {
  wifi: "Wifi",
  aircon: "May lanh",
  privateWc: "WC rieng",
  mezzanine: "Gac lung",
  parking: "Giu xe",
  freeTime: "Gio giac tu do",
};

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false });

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
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
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
  const totalImages = data.images?.length ?? 0;
  const currentIdx = totalImages > 0 ? Math.min(activeImageIdx, totalImages - 1) : 0;
  const currentImg = totalImages > 0 ? data.images[currentIdx] : undefined;

  const priceText = price ? data.priceVnd + "đ" : "--";
  const areaText = area ? area + "m²" : "--";
  const peopleText = maxPeople ? maxPeople + " người" : "--";

  const badges = [
    data.amenities.wifi && "Wifi",
    data.amenities.aircon && "Máy lạnh",
    data.amenities.privateWc && "WC riêng",
    data.amenities.mezzanine && "Gác lửng",
    data.amenities.parking && "Giữ xe",
    data.amenities.freeTime && "Giờ giấc tự do",
  ].filter(Boolean) as string[];

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
            <div className="truncate text-lg font-semibold text-gray-900">{data.title || "Tiêu đề tin..."}</div>
            <div className="mt-1 text-sm text-gray-500">
              {data.ward || "Phường"} - {data.district || "Quận"} - {data.addressText || "Địa chỉ chi tiết"}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-bold text-gray-900">
              {priceText} <span className="text-sm font-medium text-gray-500">/tháng</span>
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

        <div className="mt-4 text-sm text-gray-700">
          {data.description ? (
            <p className="line-clamp-3">{data.description}</p>
          ) : (
            <p className="text-gray-500">Chưa có mô tả.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PostWizard() {
  const [step, setStep] = useState(0);

  const [draft, setDraft] = useState<ListingDraft>({
    title: "",
    type: "PHONG_TRO",
    priceVnd: "",
    areaM2: "",
    maxPeople: "1",

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
  });
  const [isDragging, setIsDragging] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [mapQuery, setMapQuery] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const canNext = useMemo(() => {
    if (step === 0) {
      return (
        draft.title.trim().length >= 8 &&
        toNumber(draft.priceVnd) > 0 &&
        toNumber(draft.areaM2) > 0 &&
        toNumber(draft.maxPeople) > 0
      );
    }
    if (step === 1) {
      return draft.addressText.trim().length >= 6 && draft.district.trim().length > 0;
    }
    if (step === 2) return true;
    if (step === 3) {
      return draft.images.length > 0 && draft.description.trim().length >= 20; // tối thiểu mô tả
    }
    return true;
  }, [draft, step]);

  async function geocodeAddress() {
    const query = mapQuery.trim() || buildAddress(draft);
    if (!query) {
      setGeoError("missing");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
      const res = await fetch(url);
      if (!res.ok) {
        setGeoError("failed");
        return;
      }
      const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
      const first = data?.[0];
      const lat = first?.lat ? Number(first.lat) : NaN;
      const lng = first?.lon ? Number(first.lon) : NaN;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setDraft((d) => ({ ...d, lat, lng }));
        return;
      }
      setGeoError("not_found");
    } catch (error) {
      console.error(error);
      setGeoError("failed");
    } finally {
      setGeoLoading(false);
    }
  }

  function useAddressAsQuery() {
    setMapQuery(buildAddress(draft));
  }

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
    setIsSubmitting(true);

    try {
      const categoryName = categoryNameMap[draft.type];
      const amenityNames = collectAmenityNames(draft.amenities);
      const address = buildAddress(draft);
      const maxOccupancy = toNumber(draft.maxPeople);
      const imageUrls = await uploadImages(draft.images.slice(0, 10));

      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        price: toNumber(draft.priceVnd),
        area: toNumber(draft.areaM2),
        address: address,
        latitude: draft.lat,
        longitude: draft.lng,
        max_occupancy: maxOccupancy > 0 ? maxOccupancy : undefined,
        categoryName,
        amenityNames: amenityNames.length > 0 ? amenityNames : undefined,
        imageUrls,
      };

      const result = await createPost(payload);
      const message =
        (result as { message?: string })?.message ||
        "Dang tin thanh cong. Tin dang cho duyet.";
      setSubmitSuccess(message);
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
      <div className="mb-6">
        <div className="text-2xl font-bold text-gray-900">Đăng tin cho thuê</div>
        <div className="mt-1 text-sm text-gray-500">
          Điền theo từng bước để tin đăng đầy đủ và dễ duyệt.
        </div>
      </div>

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
                  <FieldLabel>Giá thuê (VND/tháng)</FieldLabel>
                  <Input
                    value={draft.priceVnd}
                    onChange={(v) => setDraft((d) => ({ ...d, priceVnd: formatVndInput(v) }))}
                    placeholder="VD: 4.500.000"
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
                  <FieldLabel>Số người tối đa</FieldLabel>
                  <Input
                    value={draft.maxPeople}
                    onChange={(v) => setDraft((d) => ({ ...d, maxPeople: v.replace(/[^\d]/g, "") }))}
                    placeholder="VD: 2"
                    inputMode="numeric"
                  />
                </div>
              </div>
            </StepShell>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <StepShell title="Bước 2: Vị trí" subtitle="Địa chỉ rõ ràng giúp người thuê tin tưởng hơn.">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <FieldLabel>Địa chỉ chi tiết</FieldLabel>
                  <Input
                    value={draft.addressText}
                    onChange={(v) => setDraft((d) => ({ ...d, addressText: v }))}
                    placeholder="VD: 12/3 Nguyễn Gia Trí, P.25"
                  />
                </div>

                <div>
                  <FieldLabel>Quận</FieldLabel>
                  <Select
                    value={draft.district}
                    onChange={(v) => setDraft((d) => ({ ...d, district: v }))}
                    options={[
                      { value: "Bình Thạnh", label: "Bình Thạnh" },
                      { value: "Gò Vấp", label: "Gò Vấp" },
                      { value: "Thủ Đức", label: "Thủ Đức" },
                      { value: "Quận 1", label: "Quận 1" },
                      { value: "Quận 7", label: "Quận 7" },
                    ]}
                  />
                </div>

                <div>
                  <FieldLabel>Phường</FieldLabel>
                  <Input
                    value={draft.ward}
                    onChange={(v) => setDraft((d) => ({ ...d, ward: v }))}
                    placeholder="VD: Phường 25"
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Map</FieldLabel>
                  <div className="space-y-3">
                    <Input
                      value={mapQuery}
                      onChange={(v) => {
                        setMapQuery(v);
                        setGeoError(null);
                      }}
                      placeholder="Search address (optional)"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={useAddressAsQuery}
                        className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Use address
                      </button>
                      <button
                        type="button"
                        onClick={geocodeAddress}
                        disabled={geoLoading}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
                      >
                        {geoLoading ? "Searching..." : "Search on map"}
                      </button>
                    </div>
                    {geoError ? (
                      <div className="text-xs text-red-600">
                        {geoError === "missing"
                          ? "Enter an address first."
                          : geoError === "not_found"
                            ? "No result found."
                            : "Search failed."}
                      </div>
                    ) : null}
                    <div className="h-72 overflow-hidden rounded-2xl border border-gray-200 bg-white">
                      <MapPicker
                        value={draft.lat && draft.lng ? { lat: draft.lat, lng: draft.lng } : null}
                        onChange={(value) => setDraft((d) => ({ ...d, lat: value.lat, lng: value.lng }))}
                      />
                    </div>
                    <div className="text-xs text-gray-500">Click on the map to set the location.</div>
                    {draft.lat && draft.lng && (
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
                      disabled={isSubmitting}
                      className={cn(
                        "inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold shadow-sm transition",
                        isSubmitting
                          ? "cursor-not-allowed bg-gray-200 text-gray-500"
                          : "bg-gray-900 text-white hover:bg-black"
                      )}
                    >
                      {isSubmitting ? "Đang gửi..." : "Đăng tin"}
                    </button>
                  )}
                </div>
              </div>

              {!canNext && step !== 4 && (
                <div className="mt-2 text-xs text-gray-500">
                  Vui lòng điền đủ thông tin bắt buộc để tiếp tục.
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
    </div>
  );
}










