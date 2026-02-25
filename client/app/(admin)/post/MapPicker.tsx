"use client";

import { useEffect, useMemo, useState } from "react";

type LatLng = {
  lat: number;
  lng: number;
};

// Mặc định là Tọa độ của TP.HCM
const DEFAULT_CENTER: LatLng = { lat: 10.762622, lng: 106.660172 };

type GeoError = "missing" | "not_found" | "failed";

// Hàm tạo độ trễ để tránh bị OpenStreetMap chặn vì spam request
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function MapPicker({
  value,
  onChange,
  defaultAddress = "",
}: {
  value?: LatLng | null;
  onChange: (value: LatLng) => void;
  defaultAddress?: string;
}) {
  const safeValue = useMemo(() => value ?? DEFAULT_CENTER, [value]);
  const [addressQuery, setAddressQuery] = useState(defaultAddress);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<GeoError | null>(null);

  useEffect(() => {
    setAddressQuery(defaultAddress);
  }, [defaultAddress]);

  async function geocodeAddress() {
    const query = addressQuery.trim();
    if (!query) {
      setGeoError("missing");
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    try {
      const tryQueries = new Set<string>();
      tryQueries.add(query);

      const segments = query.split(',').map(s => s.trim());
      if (segments.length >= 2) {
        tryQueries.add(segments.slice(1).join(', '));
        if (segments.length >= 3) {
          tryQueries.add(segments.slice(2).join(', '));
        }
      }

      const finalQueries: string[] = [];
      tryQueries.forEach(q => {
        finalQueries.push(q);
        if (!q.toLowerCase().includes('hồ chí minh') && !q.toLowerCase().includes('ho chi minh')) {
          finalQueries.push(`${q}, Hồ Chí Minh`);
        }
      });

      let foundLat = NaN;
      let foundLng = NaN;

      // Lặp qua các query để tìm kiếm
      for (let i = 0; i < finalQueries.length; i++) {
        const q = finalQueries[i];
        if (!q) continue;

        // ✅ Bắt buộc delay 1 giây từ lần gọi thứ 2 trở đi để không bị server chặn (Rate limit 1 req/sec)
        if (i > 0) {
          await sleep(1000);
        }

        // ✅ Thêm tham số &email để khai báo danh tính, OpenStreetMap sẽ không chặn
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}&email=vlu.renting.contact@gmail.com`;
        
        const res = await fetch(url, { 
          headers: { "Accept-Language": "vi" } 
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            foundLat = Number(data[0].lat);
            foundLng = Number(data[0].lon);
            break; // Trúng đích thì thoát vòng lặp ngay
          }
        }
      }

      if (Number.isFinite(foundLat) && Number.isFinite(foundLng)) {
        onChange({ lat: foundLat, lng: foundLng });
        setGeoError(null);
      } else {
        setGeoError("not_found");
      }
    } catch (error) {
      console.error("Geocode Error:", error);
      setGeoError("failed");
    } finally {
      setGeoLoading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
      
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
        <input
          type="text"
          value={addressQuery}
          onChange={(event) => {
            setAddressQuery(event.target.value);
            setGeoError(null);
          }}
          placeholder="Nhập địa chỉ để định vị..."
          className="h-12 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-[#d51f35] focus:ring-1 focus:ring-[#d51f35] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-[#d51f35]"
        />
        <button
          type="button"
          onClick={geocodeAddress}
          disabled={geoLoading}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-[#d51f35] px-6 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#b01628] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {geoLoading ? "Đang dò tìm..." : "Định vị bản đồ"}
        </button>
      </div>

      {geoError ? (
        <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
          {geoError === "missing"
            ? "⚠️ Vui lòng nhập địa chỉ trước khi tìm."
            : geoError === "not_found"
              ? "❌ Bản đồ không tìm thấy điểm này. Hãy thử xóa bớt số hẻm (VD: 12/3) hoặc tự lấy tọa độ chép vào bên dưới."
              : "❌ Lỗi kết nối tới máy chủ bản đồ."}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-inner dark:border-gray-700 dark:bg-gray-800">
        <iframe
          title="Map preview"
          src={`https://maps.google.com/maps?q=${safeValue.lat},${safeValue.lng}&hl=vi&z=16&output=embed`}
          className="h-[450px] min-h-[450px] w-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Vĩ độ (Latitude)
          <input
            type="number"
            step="any"
            value={safeValue.lat}
            onChange={(event) => {
              const lat = Number(event.target.value);
              if (!Number.isFinite(lat)) return;
              onChange({ lat, lng: safeValue.lng });
            }}
            className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-[#d51f35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
          Kinh độ (Longitude)
          <input
            type="number"
            step="any"
            value={safeValue.lng}
            onChange={(event) => {
              const lng = Number(event.target.value);
              if (!Number.isFinite(lng)) return;
              onChange({ lat: safeValue.lat, lng });
            }}
            className="h-11 rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-[#d51f35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </label>
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-xs leading-relaxed text-gray-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-400">
        💡 <b>Mẹo tìm kiếm:</b> Bản đồ đã được nâng cấp với tính năng tự động tìm kiếm khu vực bao quát nếu địa chỉ cụ thể không có trên hệ thống.<br/>
        Nếu tọa độ vẫn chưa chính xác, bạn có thể tự tra cứu Vĩ độ/Kinh độ trên Google Maps và dán thủ công vào 2 ô phía trên.
      </div>
    </div>
  );
}