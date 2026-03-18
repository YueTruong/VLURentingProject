export type Listing = {
  id: number;
  title: string;
  image: string;
  location: string;
  district: string;
  campus: string;
  type: string;
  beds: number;
  baths: number;
  wifi: boolean;
  area: number;
  price: number;
  latitude?: number;
  longitude?: number;
  furnished: boolean;
  parking: boolean;
  privateWc: boolean;
  mezzanine: boolean;
  aircon: boolean;
  security: boolean;
  freeTime: boolean;
  rating: number;
  reviews: number;
  updatedAt: number;
  updatedLabel: string;
  tags: string[];
  availability: "available" | "rented";
  videoUrl?: string | null;
};

const toNumberValue = (value: number | string | undefined | null) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toPriceMillionValue = (value: number | string | undefined | null) => {
  const raw = toNumberValue(value);
  return raw >= 100000 ? raw / 1_000_000 : raw;
};

export const formatPrice = (value: number | string | undefined | null) => {
  const price = toPriceMillionValue(value);
  if (!price) return "0 triệu";
  const trimmed = Number.isInteger(price) ? price.toFixed(0) : price.toFixed(1);
  return `${trimmed} triệu`;
};

export const formatArea = (value: number | string | undefined | null) => {
  const area = toNumberValue(value);
  if (!area) return "0 m²";
  const trimmed = Number.isInteger(area) ? area.toFixed(0) : area.toFixed(1);
  return `${trimmed} m²`;
};
