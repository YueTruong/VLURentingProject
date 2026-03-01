import axios from "axios";

export type SecurityProvider = "google" | "facebook" | "apple";
export type IdentityVerificationStatus = "unverified" | "pending" | "verified";
export type IdentityDocumentType = "driver-license" | "passport" | "national-id";

export type SecurityProviderItem = {
  provider: SecurityProvider;
  connected: boolean;
  email: string | null;
  linkedAt: string | null;
  lastUsedAt: string | null;
};

export type LinkedSecurityProviderItem = {
  provider: SecurityProvider;
  email: string | null;
  linkedAt: string | null;
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
  linkedProviders?: LinkedSecurityProviderItem[];
  sessions: SecuritySessionItem[];
};

export type IdentityVerificationOverview = {
  status: IdentityVerificationStatus;
  isVerified: boolean;
  documentType: IdentityDocumentType | null;
  frontImageName: string | null;
  backImageName: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
};

export type ChangePasswordInput = {
  currentPassword?: string;
  newPassword: string;
};

export type SubmitIdentityVerificationInput = {
  documentType: IdentityDocumentType;
  frontImageName: string;
  backImageName?: string;
};

export const VERIFICATION_STORAGE_KEY = "vlu.landlord.verified";
export const VERIFICATION_PENDING_KEY = "vlu.landlord.pending";
export const VERIFICATION_STATUS_EVENT = "vlu:verification-status-changed";

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export function readVerificationStatusFromStorage(): IdentityVerificationStatus {
  if (typeof window === "undefined") {
    return "unverified";
  }

  if (window.localStorage.getItem(VERIFICATION_STORAGE_KEY) === "true") {
    return "verified";
  }
  if (window.localStorage.getItem(VERIFICATION_PENDING_KEY) === "true") {
    return "pending";
  }
  return "unverified";
}

export function syncVerificationStorage(status: IdentityVerificationStatus) {
  if (typeof window === "undefined") {
    return;
  }

  if (status === "verified") {
    window.localStorage.setItem(VERIFICATION_STORAGE_KEY, "true");
    window.localStorage.removeItem(VERIFICATION_PENDING_KEY);
  } else if (status === "pending") {
    window.localStorage.removeItem(VERIFICATION_STORAGE_KEY);
    window.localStorage.setItem(VERIFICATION_PENDING_KEY, "true");
  } else {
    window.localStorage.removeItem(VERIFICATION_STORAGE_KEY);
    window.localStorage.removeItem(VERIFICATION_PENDING_KEY);
  }

  window.dispatchEvent(new Event(VERIFICATION_STATUS_EVENT));
}

export async function getSecurityOverview(token: string): Promise<SecurityOverview> {
  const res = await axios.get<SecurityOverview>(`${getBaseUrl()}/me/security`, {
    headers: getAuthHeaders(token),
  });
  return res.data;
}

export async function unlinkSecurityProvider(provider: SecurityProvider, token: string) {
  const res = await axios.delete(`${getBaseUrl()}/auth/link/${provider}`, {
    headers: getAuthHeaders(token),
  });
  return res.data;
}

export async function changePassword(input: ChangePasswordInput, token: string) {
  const res = await axios.patch(`${getBaseUrl()}/me/settings/password`, input, {
    headers: getAuthHeaders(token),
  });
  return res.data;
}

export async function getIdentityVerificationOverview(
  token: string,
): Promise<IdentityVerificationOverview> {
  const res = await axios.get<IdentityVerificationOverview>(
    `${getBaseUrl()}/me/verification`,
    {
      headers: getAuthHeaders(token),
    },
  );
  syncVerificationStorage(res.data.status);
  return res.data;
}

export async function submitIdentityVerification(
  input: SubmitIdentityVerificationInput,
  token: string,
) {
  const res = await axios.patch(`${getBaseUrl()}/me/verification`, input, {
    headers: getAuthHeaders(token),
  });

  const verification = (res.data?.verification ?? res.data) as
    | IdentityVerificationOverview
    | undefined;

  if (verification?.status) {
    syncVerificationStorage(verification.status);
  }

  return res.data;
}
