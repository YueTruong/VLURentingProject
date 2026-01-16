"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

type LatLng = {
  lat: number;
  lng: number;
};

const DEFAULT_CENTER: LatLng = { lat: 10.762622, lng: 106.660172 };
const DEFAULT_ZOOM = 14;

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = markerIcon;

export default function MapPicker({
  value,
  onChange,
}: {
  value?: LatLng | null;
  onChange: (value: LatLng) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter = value ?? DEFAULT_CENTER;
    const map = L.map(containerRef.current, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    map.on("click", (event: L.LeafletMouseEvent) => {
      onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
    });

    mapRef.current = map;

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      map.off();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [value]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const center = value ?? DEFAULT_CENTER;
    map.setView([center.lat, center.lng], map.getZoom(), { animate: false });

    if (value) {
      if (!markerRef.current) {
        markerRef.current = L.marker([value.lat, value.lng]).addTo(map);
      } else {
        markerRef.current.setLatLng([value.lat, value.lng]);
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [value]);

  return <div ref={containerRef} className="h-full w-full" />;
}
