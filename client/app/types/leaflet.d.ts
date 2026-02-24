declare module 'leaflet' {
  export interface LatLng {
    lat: number;
    lng: number;
  }

  export interface LeafletMouseEvent {
    latlng: LatLng;
  }

  export interface Map {
    on(event: string, handler: (event: LeafletMouseEvent) => void): this;
    off(): this;
    remove(): this;
    invalidateSize(): this;
    setView(center: [number, number], zoom: number, options?: { animate?: boolean }): this;
    getZoom(): number;
  }

  export interface Marker {
    setLatLng(latlng: [number, number]): this;
    addTo(map: Map): this;
    remove(): this;
  }

  export namespace Marker {
    const prototype: {
      options: {
        icon?: unknown;
      };
    };
  }

  export function map(
    element: HTMLElement,
    options: {
      center: [number, number];
      zoom: number;
      scrollWheelZoom?: boolean;
    },
  ): Map;

  export function marker(latlng: [number, number]): Marker;

  export function icon(options: {
    iconUrl: string;
    iconRetinaUrl?: string;
    shadowUrl?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
  }): unknown;

  export function tileLayer(
    urlTemplate: string,
    options?: {
      attribution?: string;
    },
  ): {
    addTo(map: Map): void;
  };

  const L: {
    map: typeof map;
    marker: typeof marker;
    icon: typeof icon;
    tileLayer: typeof tileLayer;
    Marker: typeof Marker;
  };

  export default L;
}
