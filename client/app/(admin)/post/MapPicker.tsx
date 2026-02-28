"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type LatLng = {
  lat: number;
  lng: number;
};

type AddressParts = {
  street?: string;
  ward?: string;
  district?: string;
};

const DEFAULT_CENTER: LatLng = { lat: 10.762622, lng: 106.660172 };

type GeoError = "missing" | "not_found" | "failed";

export default function MapPicker({
  value,
  onChange,
  defaultAddress = "",
  onAddressResolved,
}: {
  value?: LatLng | null;
  onChange: (value: LatLng) => void;
  defaultAddress?: string;
  onAddressResolved?: (parts: AddressParts) => void;
}) {
  const safeValue = useMemo(() => value ?? DEFAULT_CENTER, [value]);
  const [addressQuery, setAddressQuery] = useState(defaultAddress);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<GeoError | null>(null);
  const previousDefaultAddressRef = useRef(defaultAddress);

  useEffect(() => {
    const prev = previousDefaultAddressRef.current;
    const next = defaultAddress;
    const shouldSync = addressQuery.trim().length === 0 || addressQuery === prev;

    if (shouldSync && addressQuery !== next) {
      setAddressQuery(next);
    }

    previousDefaultAddressRef.current = next;
  }, [defaultAddress, addressQuery]);

  async function geocodeAddress() {
    const query = addressQuery.trim();
    if (!query) {
      setGeoError("missing");
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: {
          "Accept-Language": "vi",
        },
      });

      if (!res.ok) {
        setGeoError("failed");
        return;
      }

      const data = (await res.json()) as Array<{
        lat?: string;
        lon?: string;
        address?: {
          house_number?: string;
          road?: string;
          suburb?: string;
          neighbourhood?: string;
          quarter?: string;
          city_district?: string;
          district?: string;
          county?: string;
        };
      }>;
      const first = data?.[0];
      const lat = first?.lat ? Number(first.lat) : NaN;
      const lng = first?.lon ? Number(first.lon) : NaN;

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        onChange({ lat, lng });

        const address = first?.address;
        if (onAddressResolved && address) {
          const houseNumber = address.house_number?.trim();
          const road = address.road?.trim();
          const street = [houseNumber, road].filter(Boolean).join(" ") || road || undefined;

          const rawWard =
            address.suburb?.trim() ||
            address.neighbourhood?.trim() ||
            address.quarter?.trim() ||
            undefined;
          const ward = rawWard && /^phường/i.test(rawWard) ? rawWard : rawWard ? `Phường ${rawWard}` : undefined;

          const rawDistrict =
            address.city_district?.trim() ||
            address.district?.trim() ||
            address.county?.trim() ||
            undefined;
          const district =
            rawDistrict && /^(quận|huyện|thành phố)/i.test(rawDistrict)
              ? rawDistrict
              : rawDistrict
                ? `Quận ${rawDistrict}`
                : undefined;

          onAddressResolved({ street, ward, district });
        }
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

  return (
    <div className="flex h-full w-full flex-col gap-3 rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <input
          type="text"
          value={addressQuery}
          onChange={(event) => {
            setAddressQuery(event.target.value);
            setGeoError(null);
          }}
          placeholder="VD: 478 Nơ Trang Long, Phường 13, Quận Bình Thạnh"
          className="rounded-lg border border-(--theme-border) bg-(--theme-surface) px-3 py-2 text-sm text-(--theme-text) outline-none focus:border-(--brand-primary)"
        />
        <button
          type="button"
          onClick={geocodeAddress}
          disabled={geoLoading}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-(--brand-primary) px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {geoLoading ? "Đang tìm..." : "Lấy theo địa chỉ"}
        </button>
      </div>

      {geoError ? (
        <div className="text-xs text-red-600">
          {geoError === "missing"
            ? "Vui lòng nhập địa chỉ trước khi tìm."
            : geoError === "not_found"
              ? "Không tìm thấy kết quả phù hợp."
              : "Không thể lấy tọa độ từ địa chỉ, vui lòng thử lại."}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-(--theme-border)">
        <iframe
          title="Map preview"
          src={`https://maps.google.com/maps?q=${safeValue.lat},${safeValue.lng}&z=15&output=embed`}
          className="h-72 w-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-(--theme-text-muted)">Vĩ độ (Latitude)</span>
          <input
            type="number"
            step="any"
            value={safeValue.lat}
            onChange={(event) => {
              const lat = Number(event.target.value);
              if (!Number.isFinite(lat)) return;
              onChange({ lat, lng: safeValue.lng });
            }}
            className="rounded-lg border border-(--theme-border) bg-(--theme-surface) px-3 py-2 text-(--theme-text) outline-none focus:border-(--brand-primary)"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-(--theme-text-muted)">Kinh độ (Longitude)</span>
          <input
            type="number"
            step="any"
            value={safeValue.lng}
            onChange={(event) => {
              const lng = Number(event.target.value);
              if (!Number.isFinite(lng)) return;
              onChange({ lat: safeValue.lat, lng });
            }}
            className="rounded-lg border border-(--theme-border) bg-(--theme-surface) px-3 py-2 text-(--theme-text) outline-none focus:border-(--brand-primary)"
          />
        </label>
      </div>

      <div className="rounded-xl border border-dashed border-(--theme-border) bg-(--theme-surface-muted) p-3 text-xs text-(--theme-text-subtle)">
        Nếu không tìm được địa chỉ chính xác, bạn có thể nhập tay tọa độ để định vị bài đăng.
      </div>
    </div>
  );
}
