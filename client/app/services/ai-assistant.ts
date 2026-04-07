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

export type AiAssistantStatus = {
  cloudAvailable: boolean;
  provider: "openai" | "dialogflow" | "ollama" | "fallback";
  openaiConfigured: boolean;
  dialogflowConfigured: boolean;
  ollamaConfigured: boolean;
  message: string;
};

export async function getHousingAssistantStatus() {
  const res = await axios.get(`${getBackendUrl()}/ai/status`);
  return res.data as AiAssistantStatus;
}

export async function askHousingAssistant(message: string, districtOptions: string[]) {
  const res = await axios.post(`${getBackendUrl()}/ai/housing-query`, {
    message,
    districtOptions,
  });
  return res.data as {
    criteria?: AiHousingCriteria | null;
    reply?: string;
    provider?: string;
    mode?: "cloud" | "fallback";
    cloudAvailable?: boolean;
  };
}
