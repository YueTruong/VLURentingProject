"use client";

import axios from "axios";

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

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

export async function getAdminUsers(token: string): Promise<AdminUser[]> {
  const res = await axios.get<AdminUser[]>(`${getBaseUrl()}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data ?? [];
}

export async function updateAdminUserStatus(
  id: number,
  isActive: boolean,
  token: string,
) {
  const res = await axios.patch(
    `${getBaseUrl()}/admin/users/${id}/status`,
    { is_active: isActive },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
}
