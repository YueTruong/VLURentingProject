"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import MapPickerSurface, {
  MapInlineNotice,
  type MapNoticeTone,
  type MapSurfaceState,
} from "./MapPickerSurface";
import {
  DEFAULT_HCMC_LOCATION,
  LocationLookupError,
  buildLocationQuery,
  geocodeAddress,
  getLocationLookupMessage,
  isSameLocation,
  isValidLocation,
  reverseGeocodeLocation,
  type LatLng,
  type LocationAddressFields,
} from "./location-utils";

type LeafletRuntime = Pick<typeof Leaflet, "map" | "marker" | "tileLayer" | "divIcon">;

type UpdateSource =
  | "address-submit"
  | "map-click"
  | "marker-drag"
  | "manual-coordinates"
  | "clear";

type StatusNotice = {
  tone: MapNoticeTone;
  title: string;
  description: string;
};

type MapInitIssue = {
  title: string;
  description: string;
  checklist: string[];
  technicalMessage?: string | null;
};

const DEFAULT_ZOOM = 13;
const FOCUSED_ZOOM = 16;
const MANUAL_ZOOM = 16;
const REVERSE_LOOKUP_DELAY_MS = 450;

const MAP_TEXT = {
  sectionTitle: "Địa chỉ và vị trí trên bản đồ",
  sectionDescription:
    "Bản đồ hiện dùng OpenStreetMap miễn phí. Bạn có thể tìm theo địa chỉ, bấm lên bản đồ hoặc kéo marker để chốt vị trí.",
  searchPlaceholder:
    "Nhập địa chỉ cần tìm, ví dụ: 69/68 Đặng Thùy Trâm, Phường 13, Bình Thạnh",
  searchButton: "Lấy theo địa chỉ",
  searchLoading: "Đang tìm...",
  clearAddress: "Xóa địa chỉ",
  mapCardTitle: "Bản đồ vị trí",
  mapCardDescription:
    "Marker sẽ tự cập nhật theo địa chỉ, tọa độ và thao tác bạn vừa chọn trên bản đồ.",
  mapLoadingBadge: "Đang tải",
  mapReadyBadge: "Sẵn sàng",
  mapLoadingDescription: "OpenStreetMap đang được khởi tạo. Vui lòng chờ trong giây lát.",
  mapErrorBadge: "Không khả dụng",
  markerHint: "Bấm lên bản đồ hoặc kéo marker để chỉnh lại vị trí.",
  reverseLoading: "Đang cập nhật địa chỉ gần đúng...",
} as const;

const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function debugMap(event: string, payload?: unknown) {
  if (process.env.NODE_ENV === "production") return;
  if (payload === undefined) {
    console.debug(`[MapPicker] ${event}`);
    return;
  }
  console.debug(`[MapPicker] ${event}`, payload);
}

function toLatLngKey(location?: LatLng | null) {
  if (!isValidLocation(location)) return "";
  return `${location.lat.toFixed(6)}:${location.lng.toFixed(6)}`;
}

function createLocationNotice(error: unknown, context: "forward" | "reverse"): StatusNotice {
  const description = getLocationLookupMessage(error, context);
  const issue =
    error instanceof LocationLookupError
      ? error.issue
      : typeof error === "object" &&
          error &&
          "issue" in error &&
          typeof (error as { issue?: unknown }).issue === "string"
        ? ((error as { issue: string }).issue as LocationLookupError["issue"])
        : null;

  if (issue === "missing" || issue === "not_found") {
    return {
      tone: "warning",
      title:
        context === "forward"
          ? "Không tìm thấy địa chỉ phù hợp"
          : "Chưa nhận diện được địa chỉ gần đúng",
      description,
    };
  }

  if (issue === "rate_limited" || issue === "service_unavailable") {
    return {
      tone: "warning",
      title: "Dịch vụ bản đồ đang bận",
      description,
    };
  }

  return {
    tone: "error",
    title: "Không thể xử lý yêu cầu bản đồ",
    description,
  };
}

function createMapInitIssue(error: unknown): MapInitIssue {
  const technicalMessage = error instanceof Error ? error.message : String(error);
  return {
    title: "Không thể khởi tạo bản đồ",
    description:
      "OpenStreetMap chưa thể hiển thị trên trình duyệt hiện tại. Bạn vẫn có thể nhập tọa độ thủ công nếu cần.",
    checklist: [
      "Kiểm tra kết nối mạng và thử tải lại trang.",
      "Đảm bảo trình duyệt không chặn tài nguyên từ OpenStreetMap.",
      "Mở Console để xem chi tiết lỗi khởi tạo Leaflet nếu cần debug thêm.",
    ],
    technicalMessage,
  };
}

function createLeafletIcon(leaflet: LeafletRuntime) {
  return leaflet.divIcon({
    className: "vlu-map-pin-wrapper",
    html: '<span class="vlu-map-pin"></span>',
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
}

function MapPickerComponent({
  value,
  onChange,
  addressFields,
  mapAddress = "",
  onMapAddressChange,
  onClearAddress,
  isActive = true,
}: {
  value?: LatLng | null;
  onChange: (value: LatLng | null) => void;
  addressFields?: LocationAddressFields;
  mapAddress?: string;
  onMapAddressChange?: (value: string) => void;
  onClearAddress?: () => void;
  isActive?: boolean;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletRef = useRef<LeafletRuntime | null>(null);
  const markerIconRef = useRef<unknown>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markerRef = useRef<Leaflet.Marker | null>(null);
  const reverseTimerRef = useRef<number | null>(null);
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);
  const lastRenderedLocationRef = useRef<LatLng | null>(null);
  const lastEmittedLocationRef = useRef<LatLng | null>(isValidLocation(value) ? value : null);
  const lastReverseLookupKeyRef = useRef("");
  const lastCommittedAddressRef = useRef(mapAddress.trim());
  const latestValueRef = useRef<LatLng | null>(isValidLocation(value) ? value : null);
  const onChangeRef = useRef(onChange);
  const onMapAddressChangeRef = useRef(onMapAddressChange);
  const runReverseLookupRef = useRef<((location: LatLng) => Promise<void>) | null>(null);
  const addressDirtyRef = useRef(false);

  const [mapReady, setMapReady] = useState(false);
  const [mapInitIssue, setMapInitIssue] = useState<MapInitIssue | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<StatusNotice | null>(null);
  const [addressInput, setAddressInput] = useState(() => {
    const external = mapAddress.trim();
    return external || buildLocationQuery(addressFields, { includeCity: false, includeCountry: false });
  });

  const derivedAddress = useMemo(
    () => buildLocationQuery(addressFields, { includeCity: false, includeCountry: false }),
    [addressFields]
  );
  const canClear =
    Boolean(addressInput.trim()) || Boolean(derivedAddress.trim()) || Boolean(mapAddress.trim()) || isValidLocation(value);
  const isBusy = geoLoading || reverseLoading;

  const surfaceState = useMemo<MapSurfaceState>(() => {
    if (mapInitIssue) {
      return {
        kind: "error",
        badgeLabel: MAP_TEXT.mapErrorBadge,
        title: mapInitIssue.title,
        description: mapInitIssue.description,
        checklist: mapInitIssue.checklist,
        technicalMessage: mapInitIssue.technicalMessage,
      };
    }

    if (!mapReady) {
      return {
        kind: "loading",
        badgeLabel: MAP_TEXT.mapLoadingBadge,
        title: MAP_TEXT.mapCardTitle,
        description: MAP_TEXT.mapLoadingDescription,
      };
    }

    return {
      kind: "ready",
      badgeLabel: MAP_TEXT.mapReadyBadge,
      title: MAP_TEXT.mapCardTitle,
      description: MAP_TEXT.mapCardDescription,
    };
  }, [mapInitIssue, mapReady]);

  useEffect(() => void (onChangeRef.current = onChange), [onChange]);
  useEffect(() => void (onMapAddressChangeRef.current = onMapAddressChange), [onMapAddressChange]);
  useEffect(() => void (latestValueRef.current = isValidLocation(value) ? value : null), [value]);

  const clearTimer = useCallback((ref: { current: number | null }) => {
    if (ref.current) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  }, []);

  const cancelRequest = useCallback((ref: { current: AbortController | null }) => {
    ref.current?.abort();
    ref.current = null;
  }, []);

  const commitMapAddress = useCallback((next: string) => {
    setAddressInput((current) => (current === next ? current : next));
    const normalized = next.trim();
    if (normalized === lastCommittedAddressRef.current) return;
    lastCommittedAddressRef.current = normalized;
    onMapAddressChangeRef.current?.(next);
  }, []);

  const emitLocationChange = useCallback((next: LatLng | null, source: UpdateSource) => {
    if (next === null) {
      if (lastEmittedLocationRef.current === null) return;
      lastEmittedLocationRef.current = null;
      debugMap("clear location", { source });
      onChangeRef.current(null);
      return;
    }

    if (isSameLocation(next, lastEmittedLocationRef.current)) return;
    lastEmittedLocationRef.current = next;
    debugMap("location updated", { source, location: next });
    onChangeRef.current(next);
  }, []);

  const removeMarker = useCallback(() => {
    markerRef.current?.off();
    markerRef.current?.remove();
    markerRef.current = null;
    lastRenderedLocationRef.current = null;
  }, []);

  const syncMapToLocation = useCallback(
    (location: LatLng, zoom = MANUAL_ZOOM) => {
      const map = mapRef.current;
      const leaflet = leafletRef.current;
      if (!map || !leaflet) return;

      if (!markerRef.current) {
        markerRef.current = leaflet
          .marker([location.lat, location.lng], {
            draggable: true,
            icon: markerIconRef.current ?? createLeafletIcon(leaflet),
          })
          .addTo(map);
        markerRef.current.on("dragend", () => {
          const position = markerRef.current?.getLatLng();
          const nextLocation = position
            ? { lat: Number(position.lat), lng: Number(position.lng) }
            : null;
          if (!isValidLocation(nextLocation)) return;

          debugMap("marker dragged", nextLocation);
          setStatusNotice(null);
          emitLocationChange(nextLocation, "marker-drag");
          lastRenderedLocationRef.current = nextLocation;
          lastReverseLookupKeyRef.current = "";
          clearTimer(reverseTimerRef);
          reverseTimerRef.current = window.setTimeout(() => {
            void runReverseLookupRef.current?.(nextLocation);
          }, REVERSE_LOOKUP_DELAY_MS);
          map.setView([nextLocation.lat, nextLocation.lng], Math.max(map.getZoom(), MANUAL_ZOOM), {
            animate: true,
          });
        });
      }

      markerRef.current.setLatLng([location.lat, location.lng]);
      map.setView([location.lat, location.lng], zoom, { animate: true });
      lastRenderedLocationRef.current = location;
    },
    [clearTimer, emitLocationChange]
  );

  const runReverseLookup = useCallback(
    async (location: LatLng) => {
      if (!isValidLocation(location) || !isActive) return;

      const locationKey = toLatLngKey(location);
      if (locationKey && locationKey === lastReverseLookupKeyRef.current) return;

      cancelRequest(reverseAbortRef);
      const controller = new AbortController();
      reverseAbortRef.current = controller;
      setReverseLoading(true);
      debugMap("reverse lookup request", location);

      try {
        const response = await reverseGeocodeLocation(location, controller.signal);
        if (controller.signal.aborted) return;

        debugMap("reverse lookup response", response);
        lastReverseLookupKeyRef.current = locationKey;
        addressDirtyRef.current = false;
        commitMapAddress(response.label);
        setStatusNotice(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn("[MapPicker] Reverse geocode failed", error);
        setStatusNotice(createLocationNotice(error, "reverse"));
      } finally {
        if (reverseAbortRef.current === controller) reverseAbortRef.current = null;
        setReverseLoading(false);
      }
    },
    [cancelRequest, commitMapAddress, isActive]
  );

  useEffect(() => {
    runReverseLookupRef.current = runReverseLookup;
  }, [runReverseLookup]);

  const handleForwardLookup = useCallback(async () => {
    clearTimer(reverseTimerRef);
    cancelRequest(geocodeAbortRef);

    const primaryAddress = addressInput.trim() || addressFields?.primaryAddress || "";
    if (!primaryAddress.trim()) {
      setStatusNotice(createLocationNotice(new LocationLookupError("missing"), "forward"));
      return;
    }

    const controller = new AbortController();
    geocodeAbortRef.current = controller;
    setGeoLoading(true);
    setStatusNotice(null);

    try {
      const response = await geocodeAddress(
        {
          primaryAddress,
          ward: addressFields?.ward,
          district: addressFields?.district,
          city: addressFields?.city,
          country: addressFields?.country,
        },
        controller.signal
      );
      if (controller.signal.aborted) return;

      debugMap("forward lookup response", response);
      syncMapToLocation(response.location, FOCUSED_ZOOM);
      emitLocationChange(response.location, "address-submit");
      addressDirtyRef.current = false;
      commitMapAddress(response.label);
      setStatusNotice(null);
    } catch (error) {
      if (controller.signal.aborted) return;
      console.warn("[MapPicker] Forward geocode failed", error);
      setStatusNotice(createLocationNotice(error, "forward"));
    } finally {
      if (geocodeAbortRef.current === controller) geocodeAbortRef.current = null;
      setGeoLoading(false);
    }
  }, [addressFields, addressInput, cancelRequest, clearTimer, commitMapAddress, emitLocationChange, syncMapToLocation]);

  const handleClearAddress = useCallback(() => {
    clearTimer(reverseTimerRef);
    cancelRequest(geocodeAbortRef);
    cancelRequest(reverseAbortRef);
    setGeoLoading(false);
    setReverseLoading(false);
    setStatusNotice(null);
    addressDirtyRef.current = false;
    lastReverseLookupKeyRef.current = "";
    lastCommittedAddressRef.current = "";
    setAddressInput("");
    onMapAddressChangeRef.current?.("");
    onClearAddress?.();
    emitLocationChange(null, "clear");
    removeMarker();
    mapRef.current?.setView([DEFAULT_HCMC_LOCATION.lat, DEFAULT_HCMC_LOCATION.lng], DEFAULT_ZOOM, {
      animate: true,
    });
  }, [cancelRequest, clearTimer, emitLocationChange, onClearAddress, removeMarker]);

  useEffect(() => {
    const external = mapAddress.trim();
    if (external) {
      lastCommittedAddressRef.current = external;
      addressDirtyRef.current = false;
      setAddressInput((current) => (current === mapAddress ? current : mapAddress));
    } else if (!addressDirtyRef.current) {
      setAddressInput((current) => (current === derivedAddress ? current : derivedAddress));
    }
  }, [derivedAddress, mapAddress]);

  useEffect(() => {
    if (!isActive) return;

    let disposed = false;
    void (async () => {
      if (!mapContainerRef.current || mapRef.current) return;

      try {
        const leafletModule = await import("leaflet");
        if (disposed || !mapContainerRef.current || mapRef.current) return;

        const leaflet = (leafletModule.default ?? leafletModule) as unknown as LeafletRuntime;
        leafletRef.current = leaflet;
        markerIconRef.current = createLeafletIcon(leaflet);

        const initial = latestValueRef.current && isValidLocation(latestValueRef.current)
          ? latestValueRef.current
          : DEFAULT_HCMC_LOCATION;

        const map = leaflet.map(mapContainerRef.current, {
          center: [initial.lat, initial.lng],
          zoom: isValidLocation(latestValueRef.current) ? MANUAL_ZOOM : DEFAULT_ZOOM,
          scrollWheelZoom: true,
          zoomControl: true,
        });

        leaflet
          .tileLayer(OSM_TILE_URL, {
            attribution: OSM_ATTRIBUTION,
            maxZoom: 19,
          })
          .addTo(map);

        map.on("click", (event) => {
          const nextLocation = {
            lat: Number(event.latlng.lat),
            lng: Number(event.latlng.lng),
          };
          if (!isValidLocation(nextLocation)) return;

          debugMap("map clicked", nextLocation);
          syncMapToLocation(nextLocation, FOCUSED_ZOOM);
          setStatusNotice(null);
          emitLocationChange(nextLocation, "map-click");
          clearTimer(reverseTimerRef);
          reverseTimerRef.current = window.setTimeout(() => {
            void runReverseLookupRef.current?.(nextLocation);
          }, REVERSE_LOOKUP_DELAY_MS);
        });

        mapRef.current = map;
        setMapReady(true);
        setMapInitIssue(null);

        window.setTimeout(() => map.invalidateSize(), 0);
        if (latestValueRef.current) {
          syncMapToLocation(latestValueRef.current, MANUAL_ZOOM);
        }
      } catch (error) {
        if (disposed) return;
        console.error("[MapPicker] Failed to initialize Leaflet", error);
        setMapReady(false);
        setMapInitIssue(createMapInitIssue(error));
      }
    })();

    return () => {
      disposed = true;
      clearTimer(reverseTimerRef);
      cancelRequest(geocodeAbortRef);
      cancelRequest(reverseAbortRef);
      removeMarker();
      mapRef.current?.off();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [cancelRequest, clearTimer, emitLocationChange, isActive, removeMarker, syncMapToLocation]);

  useEffect(() => {
    if (!isActive) return;
    if (!isValidLocation(value)) {
      removeMarker();
      return;
    }

    if (isSameLocation(value, lastRenderedLocationRef.current)) {
      return;
    }

    if (mapReady) {
      syncMapToLocation(value, Math.max(mapRef.current?.getZoom() ?? DEFAULT_ZOOM, MANUAL_ZOOM));
    }
  }, [isActive, mapReady, removeMarker, syncMapToLocation, value]);

  useEffect(() => {
    if (!isActive || !mapReady) return;
    window.setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 0);
  }, [isActive, mapReady]);

  return (
    <div className="flex w-full flex-col gap-4 rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-4 shadow-sm md:p-5">
      <div className="space-y-1">
        <div className="text-sm font-semibold text-(--theme-text)">{MAP_TEXT.sectionTitle}</div>
        <p className="text-xs leading-5 text-(--theme-text-subtle)">{MAP_TEXT.sectionDescription}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
        <input
          type="text"
          value={addressInput}
          onChange={(event) => {
            addressDirtyRef.current = true;
            setStatusNotice(null);
            setAddressInput(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleForwardLookup();
            }
          }}
          onBlur={() => {
            if (!addressDirtyRef.current) return;
            addressDirtyRef.current = false;
            commitMapAddress(addressInput);
          }}
          placeholder={MAP_TEXT.searchPlaceholder}
          className="h-11 rounded-xl border border-(--theme-border) bg-(--theme-surface) px-4 text-sm text-(--theme-text) outline-none transition focus:border-(--brand-primary)"
        />

        <button
          type="button"
          onClick={() => void handleForwardLookup()}
          disabled={geoLoading}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-(--brand-primary) px-4 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {geoLoading ? MAP_TEXT.searchLoading : MAP_TEXT.searchButton}
        </button>

        <button
          type="button"
          onClick={handleClearAddress}
          disabled={isBusy || !canClear}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-(--theme-border) bg-(--theme-surface) px-4 text-sm font-semibold text-(--theme-text) transition hover:bg-(--theme-surface-muted) disabled:cursor-not-allowed disabled:opacity-60"
        >
          {MAP_TEXT.clearAddress}
        </button>
      </div>

      {statusNotice ? (
        <MapInlineNotice
          tone={statusNotice.tone}
          title={statusNotice.title}
          description={statusNotice.description}
        />
      ) : null}

      <div className="vlu-map-surface">
        <MapPickerSurface
          containerRef={mapContainerRef}
          state={surfaceState}
          activityLabel={reverseLoading ? MAP_TEXT.reverseLoading : null}
          helperLabel={mapReady ? MAP_TEXT.markerHint : null}
        />
      </div>
    </div>
  );
}

const MapPicker = memo(MapPickerComponent);

export default MapPicker;
