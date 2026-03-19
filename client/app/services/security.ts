import axios from "axios";
import { createAuthHeaders, getBackendUrl } from "@/app/lib/backend";

export type SecurityProvider = "google" | "facebook" | "apple";
export type IdentityVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";
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

export type SettingsPrivacyPostPreferences = {
  searchEngine: boolean;
  hometown: boolean;
  expertType: boolean;
  joinedTime: boolean;
  bookedServices: boolean;
};

export type SettingsPreferences = {
  language: string;
  currency: string;
  timezone: string;
  privacy: {
    readReceiptsEnabled: boolean;
    post: SettingsPrivacyPostPreferences;
  };
};

export type SettingsOverview = {
  preferences: SettingsPreferences;
};

export type UpdateSettingsPreferencesInput = {
  readReceiptsEnabled?: boolean;
  postPrivacySearchEngine?: boolean;
  postPrivacyHometown?: boolean;
  postPrivacyExpertType?: boolean;
  postPrivacyJoinedTime?: boolean;
  postPrivacyBookedServices?: boolean;
};

export const VERIFICATION_STORAGE_KEY = "vlu.landlord.verified";
export const VERIFICATION_PENDING_KEY = "vlu.landlord.pending";
export const VERIFICATION_STATUS_EVENT = "vlu:verification-status-changed";

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
  const res = await axios.get<SecurityOverview>(`${getBackendUrl()}/me/security`, {
    headers: createAuthHeaders(token),
  });
  return res.data;
}

export async function unlinkSecurityProvider(provider: SecurityProvider, token: string) {
  const res = await axios.delete(`${getBackendUrl()}/auth/link/${provider}`, {
    headers: createAuthHeaders(token),
  });
  return res.data;
}

export async function changePassword(input: ChangePasswordInput, token: string) {
  const res = await axios.patch(`${getBackendUrl()}/me/settings/password`, input, {
    headers: createAuthHeaders(token),
  });
  return res.data;
}

export async function getSettingsOverview(token: string): Promise<SettingsOverview> {
  const res = await axios.get<SettingsOverview>(`${getBackendUrl()}/me/settings`, {
    headers: createAuthHeaders(token),
  });
  return res.data;
}

export async function updateSettingsPreferences(
  input: UpdateSettingsPreferencesInput,
  token: string,
): Promise<SettingsPreferences> {
  const res = await axios.patch<{ message: string; preferences: SettingsPreferences }>(
    `${getBackendUrl()}/me/settings/preferences`,
    input,
    {
      headers: createAuthHeaders(token),
    },
  );
  return res.data.preferences;
}

export async function getIdentityVerificationOverview(
  token: string,
): Promise<IdentityVerificationOverview> {
  const res = await axios.get<IdentityVerificationOverview>(
    `${getBackendUrl()}/me/verification`,
    {
      headers: createAuthHeaders(token),
    },
  );
  syncVerificationStorage(res.data.status);
  return res.data;
}

export async function submitIdentityVerification(
  input: SubmitIdentityVerificationInput,
  token: string,
) {
  const res = await axios.patch(`${getBackendUrl()}/me/verification`, input, {
    headers: createAuthHeaders(token),
  });

  const verification = (res.data?.verification ?? res.data) as
    | IdentityVerificationOverview
    | undefined;

  if (verification?.status) {
    syncVerificationStorage(verification.status);
  }

  return res.data;
}
