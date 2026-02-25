import axios from "axios";

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

export type CategoryItem = { id: number; name: string; description?: string | null };
export type AmenityItem = { id: number; name: string; icon_url?: string | null };

export async function getAdminCategories(token: string): Promise<CategoryItem[]> {
  const res = await axios.get<CategoryItem[]>(`${getBaseUrl()}/admin/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function createAdminCategory(token: string, payload: { name: string; description?: string }) {
  const res = await axios.post(`${getBaseUrl()}/admin/categories`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function deleteAdminCategory(token: string, id: number) {
  const res = await axios.delete(`${getBaseUrl()}/admin/categories/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateAdminCategory(
  token: string,
  id: number,
  payload: { name: string; description?: string },
) {
  const res = await axios.patch(`${getBaseUrl()}/admin/categories/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getAdminAmenities(token: string): Promise<AmenityItem[]> {
  const res = await axios.get<AmenityItem[]>(`${getBaseUrl()}/admin/amenities`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function createAdminAmenity(token: string, payload: { name: string; iconUrl?: string }) {
  const res = await axios.post(`${getBaseUrl()}/admin/amenities`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function deleteAdminAmenity(token: string, id: number) {
  const res = await axios.delete(`${getBaseUrl()}/admin/amenities/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateAdminAmenity(
  token: string,
  id: number,
  payload: { name: string; iconUrl?: string },
) {
  const res = await axios.patch(`${getBaseUrl()}/admin/amenities/${id}`, payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
