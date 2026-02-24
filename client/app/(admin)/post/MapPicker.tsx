"use client";

import { useMemo } from "react";

type LatLng = {
  lat: number;
  lng: number;
};

const DEFAULT_CENTER: LatLng = { lat: 10.762622, lng: 106.660172 };

export default function MapPicker({
  value,
  onChange,
}: {
  value?: LatLng | null;
  onChange: (value: LatLng) => void;
}) {
  const safeValue = useMemo(() => value ?? DEFAULT_CENTER, [value]);

  return (
    <div className="flex h-full w-full flex-col gap-3 rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-3">
      <div className="rounded-xl border border-dashed border-(--theme-border) bg-(--theme-surface-muted) p-3 text-xs text-(--theme-text-subtle)">
        Bản đồ tương tác tạm thời không khả dụng trong môi trường hiện tại. Bạn vẫn có thể nhập toạ độ chính xác để đăng tin.
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
    </div>
  );
}
