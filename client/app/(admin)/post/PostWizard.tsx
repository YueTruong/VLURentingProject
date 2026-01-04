"use client";

import { useMemo, useState } from "react";

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
  priceVnd: string; // giữ string để format dễ, backend parse sau
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

function PreviewCard({ data }: { data: ListingDraft }) {
  const price = toNumber(data.priceVnd);
  const area = toNumber(data.areaM2);
  const maxPeople = toNumber(data.maxPeople);
  const firstImg = data.images?.[0];

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
      <div className="aspect-video w-full bg-gray-100">
        {firstImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="preview"
            src={URL.createObjectURL(firstImg)}
            className="h-full w-full object-cover"
          />
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
              {data.ward || "Phường"} · {data.district || "Quận"} · {data.addressText || "Địa chỉ chi tiết"}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-bold text-gray-900">
              {price ? `${data.priceVnd}đ` : "—"}{" "}
              <span className="text-sm font-medium text-gray-500">/tháng</span>
            </div>
            <div className="mt-0.5 text-xs text-gray-500">
              {area ? `${area}m²` : "—"} · {maxPeople ? `${maxPeople} người` : "—"}
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
    if (step === 3) return draft.description.trim().length >= 20; // tối thiểu mô tả
    return true;
  }, [draft, step]);

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }

  function onPickImages(files: FileList | null) {
    if (!files) return;
    const arr = Array.from(files).slice(0, 10);
    setDraft((d) => ({ ...d, images: arr }));
  }

  async function submit() {
    // FE demo: bạn sẽ thay bằng gọi API backend sau
    const payload = {
      ...draft,
      priceVnd: toNumber(draft.priceVnd),
      areaM2: toNumber(draft.areaM2),
      maxPeople: toNumber(draft.maxPeople),
      images: draft.images.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    };
    console.log("SUBMIT listing payload:", payload);
    alert("Demo: Đã tạo payload (xem console). Khi có backend, mình sẽ nối API đăng tin.");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
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
              <PreviewCard data={draft} />
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
                  <FieldLabel>Giá thuê (VNĐ/tháng)</FieldLabel>
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
                  <FieldLabel>Google Map</FieldLabel>
                  <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5">
                    <div className="text-sm font-semibold text-gray-900">Map placeholder</div>
                    <div className="mt-1 text-sm text-gray-600">
                      Sau này sẽ nhúng Google Maps để pin vị trí (lat/lng). Hiện tại cứ lưu địa chỉ text trước.
                    </div>
                    <button
                      type="button"
                      className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-black"
                      onClick={() => setDraft((d) => ({ ...d, lat: 10.8, lng: 106.7 }))}
                    >
                      Demo: gán tọa độ mẫu
                    </button>
                    {draft.lat && draft.lng && (
                      <div className="mt-3 text-xs text-gray-500">
                        lat: {draft.lat} · lng: {draft.lng}
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
            <StepShell title="Bước 4: Hình ảnh & mô tả" subtitle="Ảnh rõ + mô tả đủ sẽ tăng tỉ lệ được liên hệ.">
              <div className="grid gap-4">
                <div>
                  <FieldLabel>Ảnh (tối đa 10)</FieldLabel>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => onPickImages(e.target.files)}
                    className="block w-full rounded-xl border border-gray-200 bg-white p-3 text-sm"
                  />
                  {draft.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {draft.images.map((f, idx) => (
                        <div key={f.name + idx} className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            alt={f.name}
                            src={URL.createObjectURL(f)}
                            className="aspect-square w-full object-cover"
                          />
                          <div className="p-2 text-xs text-gray-600 line-clamp-1">{f.name}</div>
                        </div>
                      ))}
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
                      - Giờ giấc, an ninh, giữ xe?
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
              <PreviewCard data={draft} />
              <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">Gợi ý nhanh</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  <li>Tiêu đề nên có vị trí + điểm mạnh (gần trường, full nội thất...).</li>
                  <li>Ảnh nên có: mặt tiền, phòng ngủ, WC, bếp, lối gửi xe.</li>
                  <li>Mô tả nhớ ghi rõ điện/nước, cọc, số người tối đa.</li>
                </ul>
              </div>
            </StepShell>
          )}

          {/* Footer actions */}
          <div className="sticky bottom-4 z-10">
            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={back}
                  disabled={step === 0}
                  className={cn(
                    "h-11 rounded-xl px-4 text-sm font-semibold transition",
                    step === 0
                      ? "cursor-not-allowed bg-gray-100 text-gray-400"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  )}
                >
                  Quay lại
                </button>

                <div className="flex items-center gap-2">
                  <div className="hidden text-sm text-gray-500 md:block">
                    Bước {step + 1}/{steps.length}
                  </div>

                  {step < steps.length - 1 ? (
                    <button
                      type="button"
                      onClick={next}
                      disabled={!canNext}
                      className={cn(
                        "h-11 rounded-xl px-5 text-sm font-semibold transition",
                        canNext
                          ? "bg-gray-900 text-white hover:bg-black"
                          : "cursor-not-allowed bg-gray-100 text-gray-400"
                      )}
                    >
                      Tiếp tục
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={submit}
                      className="h-11 rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-black"
                    >
                      Đăng tin
                    </button>
                  )}
                </div>
              </div>

              {!canNext && step !== 4 && (
                <div className="mt-2 text-xs text-gray-500">
                  Vui lòng điền đủ thông tin bắt buộc để tiếp tục.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
