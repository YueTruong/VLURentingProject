"use client";

import axios from "axios";
import { createAuthHeaders, getBackendUrl } from "@/app/lib/backend";

export type TenantDirectoryStudent = {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  address?: string | null;
};

export async function getStudentDirectory(token: string): Promise<TenantDirectoryStudent[]> {
  const res = await axios.get<TenantDirectoryStudent[]>(`${getBackendUrl()}/users/students`, {
    headers: createAuthHeaders(token),
  });

  return res.data ?? [];
}
