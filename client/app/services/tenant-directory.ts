"use client";

import axios from "axios";

export type TenantDirectoryStudent = {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  address?: string | null;
};

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

export async function getStudentDirectory(token: string): Promise<TenantDirectoryStudent[]> {
  const res = await axios.get<TenantDirectoryStudent[]>(`${getBaseUrl()}/users/students`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data ?? [];
}
