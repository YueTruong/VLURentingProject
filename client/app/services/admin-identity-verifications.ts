"use client";

import axios from "axios";
import { createAuthHeaders, getBackendUrl } from "@/app/lib/backend";

export type AdminIdentityVerificationStatus =
  | "pending"
  | "verified"
  | "rejected";

export type AdminIdentityVerificationDocumentType =
  | "driver-license"
  | "passport"
  | "national-id"
  | string;

export type AdminIdentityVerificationUser = {
  id?: number;
  email?: string | null;
  username?: string | null;
  role?: {
    id?: number;
    name?: string | null;
  };
  profile?: {
    full_name?: string | null;
    phone_number?: string | null;
    avatar_url?: string | null;
    address?: string | null;
  } | null;
};

export type AdminIdentityVerificationRecord = {
  userId: number;
  status: AdminIdentityVerificationStatus;
  documentType: AdminIdentityVerificationDocumentType | null;
  frontImageName: string | null;
  backImageName: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  user?: AdminIdentityVerificationUser | null;
};

export async function getAdminIdentityVerifications(
  token: string,
  status?: AdminIdentityVerificationStatus,
): Promise<AdminIdentityVerificationRecord[]> {
  const response = await axios.get<AdminIdentityVerificationRecord[]>(
    `${getBackendUrl()}/admin/identity-verifications`,
    {
      headers: createAuthHeaders(token),
      params: status ? { status } : undefined,
    },
  );

  return response.data ?? [];
}

export async function reviewAdminIdentityVerification(
  userId: number,
  status: AdminIdentityVerificationStatus,
  token: string,
): Promise<AdminIdentityVerificationRecord> {
  const response = await axios.patch<AdminIdentityVerificationRecord>(
    `${getBackendUrl()}/admin/users/${userId}/identity-verification`,
    { status },
    { headers: createAuthHeaders(token) },
  );

  return response.data;
}

export async function getAdminIdentityVerificationDocumentPreview(
  reference: string,
  token: string,
): Promise<Blob> {
  const response = await axios.get<Blob>(
    `${getBackendUrl()}/admin/identity-verifications/file`,
    {
      headers: createAuthHeaders(token),
      params: { reference },
      responseType: "blob",
    },
  );

  return response.data;
}
