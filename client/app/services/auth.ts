const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

export async function login(username: string, password: string) {
  const res = await fetch(`${getBaseUrl()}/auth/login`, {
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

export async function getMyProfile(token: string): Promise<MyProfile> {
  const res = await fetch(`${getBaseUrl()}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
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
  const res = await fetch(`${getBaseUrl()}/auth/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.message || 'Không thể cập nhật hồ sơ');
  }

  return res.json();
}
