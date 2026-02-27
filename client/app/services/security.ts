import axios from "axios";

export type SecurityProvider = "google" | "facebook" | "apple";

export type SecurityProviderItem = {
  provider: SecurityProvider;
  connected: boolean;
  email: string | null;
  linkedAt: string | null;
  lastUsedAt: string | null;
};

export type SecuritySessionItem = {
  id: string;
  device: string;
  ip: string | null;
  lastUsedAt: string;
  current: boolean;
};

export type SecurityOverview = {
  hasPassword: boolean;
  providers: SecurityProviderItem[];
  sessions: SecuritySessionItem[];
};

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

export async function getSecurityOverview(token: string): Promise<SecurityOverview> {
  const res = await axios.get<SecurityOverview>(`${getBaseUrl()}/me/security`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
}

export async function unlinkSecurityProvider(provider: SecurityProvider, token: string) {
  const res = await axios.delete(`${getBaseUrl()}/auth/link/${provider}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
}

