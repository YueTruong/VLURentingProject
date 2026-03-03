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
  privateWc?: boolean;
  mezzanine?: boolean;
  aircon?: boolean;
  security?: boolean;
  freeTime?: boolean;
  rating: number;
  reviews: number;
  updatedAt: number;
  updatedLabel: string;
  tags: string[];
  availability?: 'available' | 'rented';
  videoUrl?: string | null;
};

export const formatPrice = (price: number) => {
  const formatted = price.toLocaleString("vi-VN", {
    minimumFractionDigits: Number.isInteger(price) ? 0 : 1,
    maximumFractionDigits: 1,
  });
  return `${formatted} triệu`;
};

export const formatArea = (area: number) => `${area} m2`;