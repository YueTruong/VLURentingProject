declare module "leaflet" {
  export interface LatLng {
    lat: number;
    lng: number;
  }

  export type LatLngTuple = [number, number];

  export interface LeafletMouseEvent {
    latlng: LatLng;
  }

  export interface DragEndEvent {
    target: Marker;
  }

  export interface MapOptions {
    center: LatLngTuple;
    zoom: number;
    scrollWheelZoom?: boolean;
    zoomControl?: boolean;
  }

  export interface SetViewOptions {
    animate?: boolean;
  }

  export interface MarkerOptions {
    draggable?: boolean;
    icon?: unknown;
  }

  export interface DivIconOptions {
    className?: string;
    html?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
  }

  export interface TileLayerOptions {
    attribution?: string;
    maxZoom?: number;
  }

  export interface Map {
    on(event: "click", handler: (event: LeafletMouseEvent) => void): this;
    off(): this;
    remove(): this;
    invalidateSize(): this;
    setView(center: LatLngTuple, zoom: number, options?: SetViewOptions): this;
    getZoom(): number;
  }

  export interface Marker {
    setLatLng(latlng: LatLngTuple): this;
    getLatLng(): LatLng;
    addTo(map: Map): this;
    on(event: "dragend", handler: (event: DragEndEvent) => void): this;
    off(): this;
    remove(): this;
  }

  export interface TileLayer {
    addTo(map: Map): this;
  }

  export function map(element: HTMLElement, options: MapOptions): Map;

  export function marker(latlng: LatLngTuple, options?: MarkerOptions): Marker;

  export function tileLayer(urlTemplate: string, options?: TileLayerOptions): TileLayer;

  export function divIcon(options?: DivIconOptions): unknown;

  const L: {
    map: typeof map;
    marker: typeof marker;
    tileLayer: typeof tileLayer;
    divIcon: typeof divIcon;
  };

  export default L;
}
