"use client";

import axios from "axios";
import { createAuthHeaders, getBackendUrl } from "@/app/lib/backend";

export type AdminUserRole = {
  id?: number;
  name?: string;
};

export type AdminUserProfile = {
  full_name?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  address?: string | null;
};

export type AdminUser = {
  id: number;
  email?: string | null;
  username?: string | null;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  role?: AdminUserRole;
  profile?: AdminUserProfile;
};

export async function getAdminUsers(token: string): Promise<AdminUser[]> {
  const res = await axios.get<AdminUser[]>(`${getBackendUrl()}/admin/users`, {
    headers: createAuthHeaders(token),
  });
  return res.data ?? [];
}

export async function updateAdminUserStatus(
  id: number,
  isActive: boolean,
  token: string,
) {
  const res = await axios.patch(
    `${getBackendUrl()}/admin/users/${id}/status`,
    { is_active: isActive },
    { headers: createAuthHeaders(token) },
  );
  return res.data;
}
