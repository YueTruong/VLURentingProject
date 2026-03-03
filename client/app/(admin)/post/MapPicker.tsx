"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type LatLng = {
  lat: number;
  lng: number;
};

// Mặc định là Tọa độ của TP.HCM
const DEFAULT_CENTER: LatLng = { lat: 10.762622, lng: 106.660172 };

type GeoError = "missing" | "not_found" | "failed";

type GeocodeCandidate = {
  lat?: string | number;
  lon?: string | number;
  lng?: string | number;
};

export default function MapPicker({
  value,
  onChange,
  defaultAddress = "",
}: {
  value?: LatLng | null;
  onChange: (value: LatLng) => void;
  // onAddressResolved?: (value: { addressText: string; ward: string; district: string }) => void;
  defaultAddress?: string;
}) {
  const safeValue = useMemo(() => value ?? DEFAULT_CENTER, [value]);
  const [addressQuery, setAddressQuery] = useState(defaultAddress);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<GeoError | null>(null);
  const previousDefaultAddressRef = useRef(defaultAddress);
  const isGeocodingRef = useRef(false);

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
    if (isGeocodingRef.current) return;
    const normalizedDefaultAddress = defaultAddress.trim();
    const query = normalizedDefaultAddress || addressQuery.trim();
    if (!query) {
      setGeoError("missing");
      return;
    }

    if (normalizedDefaultAddress && normalizedDefaultAddress !== addressQuery) {
      setAddressQuery(normalizedDefaultAddress);
    }

    setGeoLoading(true);
    isGeocodingRef.current = true;
    setGeoError(null);

    try {
      const queryWithCity = `${query}, Hồ Chí Minh, Việt Nam`;

      const tryFetchJson = async (url: string, headers?: HeadersInit) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        try {
          const res = await fetch(url, {
            headers,
            signal: controller.signal,
          });
          if (!res.ok) return null;
          return await res.json();
        } finally {
          clearTimeout(timeout);
        }
      };

      const toLatLng = (candidate?: GeocodeCandidate | null) => {
        if (!candidate) return null;
        const lat = Number(candidate.lat);
        const lng = Number(candidate.lon ?? candidate.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng };
      };

      const tryNominatim = async (q: string, restrictToVn: boolean) => {
        const countryCode = restrictToVn ? "&countrycodes=vn" : "";
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=vn&q=${encodeURIComponent(q)}`;
        const normalizedUrl = url.replace("&countrycodes=vn", countryCode);
        const json = await tryFetchJson(normalizedUrl, { "Accept-Language": "vi" });
        if (!Array.isArray(json) || json.length === 0) return null;
        return toLatLng(json[0] as GeocodeCandidate);
      };

      const tryPhoton = async (q: string) => {
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=vi`;
        const json = await tryFetchJson(url);
        const features = (json as { features?: Array<{ geometry?: { coordinates?: [number, number] } }> })?.features;
        const coords = features?.[0]?.geometry?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return null;
        const [lng, lat] = coords;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng };
      };

      const attempts = [
        () => tryNominatim(query, true),
        () => tryNominatim(queryWithCity, false),
        () => tryPhoton(queryWithCity),
      ];

      for (const attempt of attempts) {
        const result = await attempt();
        if (result) {
          onChange(result);
          return;
        }
      }

      setGeoError("not_found");
    } catch (error) {
      console.error(error);
      setGeoError("failed");
    } finally {
      setGeoLoading(false);
      isGeocodingRef.current = false;
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
          placeholder="Nhập địa chỉ để lấy tọa độ"
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
