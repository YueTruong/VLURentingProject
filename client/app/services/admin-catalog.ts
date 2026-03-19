import axios from "axios";
import { createAuthHeaders, getBackendUrl } from "@/app/lib/backend";

export type CategoryItem = { id: number; name: string; description?: string | null };
export type AmenityItem = { id: number; name: string; icon_url?: string | null };

export async function getAdminCategories(token: string): Promise<CategoryItem[]> {
  const res = await axios.get<CategoryItem[]>(`${getBackendUrl()}/admin/categories`, {
    headers: createAuthHeaders(token),
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function createAdminCategory(token: string, payload: { name: string; description?: string }) {
  const res = await axios.post(`${getBackendUrl()}/admin/categories`, payload, {
    headers: createAuthHeaders(token),
  });
  return res.data;
}

export async function deleteAdminCategory(token: string, id: number) {
  const res = await axios.delete(`${getBackendUrl()}/admin/categories/${id}`, {
    headers: createAuthHeaders(token),
  });
  return res.data;
}

export async function updateAdminCategory(
  token: string,
  id: number,
  payload: { name: string; description?: string },
) {
  const res = await axios.patch(`${getBackendUrl()}/admin/categories/${id}`, payload, {
    headers: createAuthHeaders(token),
  });
  return res.data;
}

export async function getAdminAmenities(token: string): Promise<AmenityItem[]> {
  const res = await axios.get<AmenityItem[]>(`${getBackendUrl()}/admin/amenities`, {
    headers: createAuthHeaders(token),
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function createAdminAmenity(token: string, payload: { name: string; iconUrl?: string }) {
  const res = await axios.post(`${getBackendUrl()}/admin/amenities`, payload, {
    headers: createAuthHeaders(token),
  });
  return res.data;
}

export async function deleteAdminAmenity(token: string, id: number) {
  const res = await axios.delete(`${getBackendUrl()}/admin/amenities/${id}`, {
    headers: createAuthHeaders(token),
  });
  return res.data;
}

export async function updateAdminAmenity(
  token: string,
  id: number,
  payload: { name: string; iconUrl?: string },
) {
  const res = await axios.patch(`${getBackendUrl()}/admin/amenities/${id}`, payload, {
    headers: createAuthHeaders(token),
  });
  return res.data;
}
