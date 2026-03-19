import { createAuthHeaders, getBackendUrl } from "@/app/lib/backend";
import type { Post } from "@/app/services/posts";

export async function login(username: string, password: string) {
  const res = await fetch(`${getBackendUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    throw new Error("Login failed");
  }

  return res.json();
}


export type MyProfile = {
  userId?: number;
  email?: string;
  role?: string;
  full_name?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
  address?: string | null;
};

export type PublicProfile = {
  userId: number;
  role?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  address?: string | null;
  joinedAt?: string | null;
  listingCount?: number;
  posts?: Post[];
};

export async function getMyProfile(token: string): Promise<MyProfile> {
  const res = await fetch(`${getBackendUrl()}/auth/profile`, {
    headers: createAuthHeaders(token),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Không thể tải hồ sơ');
  }

  return res.json();
}

export async function updateMyProfile(
  token: string,
  payload: {
    fullName?: string;
    phoneNumber?: string;
    avatarUrl?: string;
    address?: string;
  },
): Promise<MyProfile> {
  const res = await fetch(`${getBackendUrl()}/auth/profile`, {
    method: 'PATCH',
    headers: createAuthHeaders(token, {
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || 'Không thể cập nhật hồ sơ');
  }

  return res.json();
}

export async function getPublicProfile(userId: number): Promise<PublicProfile> {
  const res = await fetch(`${getBackendUrl()}/auth/public-profile/${userId}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Không thể tải hồ sơ công khai");
  }

  return res.json();
}
