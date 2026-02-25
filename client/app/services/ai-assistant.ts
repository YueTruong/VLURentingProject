import axios from "axios";

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

export type AiHousingCriteria = {
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  bedsMin?: number;
  wifi?: boolean;
  parking?: boolean;
  furnished?: boolean;
  campus?: "CS1" | "CS2" | "CS3";
  district?: string;
  type?: string;
  availability?: "available" | "rented";
  query?: string;
  tags?: string[];
};

export async function askHousingAssistant(message: string, districtOptions: string[]) {
  const res = await axios.post(`${getBaseUrl()}/ai/housing-query`, {
    message,
    districtOptions,
  });
  return res.data as {
    criteria?: AiHousingCriteria | null;
    reply?: string;
    provider?: string;
  };
}
