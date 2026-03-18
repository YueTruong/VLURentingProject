import axios from "axios";
import { getBackendUrl } from "@/app/lib/backend";

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
  const res = await axios.post(`${getBackendUrl()}/ai/housing-query`, {
    message,
    districtOptions,
  });
  return res.data as {
    criteria?: AiHousingCriteria | null;
    reply?: string;
    provider?: string;
  };
}
