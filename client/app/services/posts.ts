import axios from 'axios';
import api from './api';

export type CreatePostPayload = {
  title: string;
  description: string;
  price: number;
  area: number;
  address: string;
  latitude?: number | string;
  longitude?: number | string;
  max_occupancy?: number;
  campus?: 'CS1' | 'CS2' | 'CS3';
  availability?: 'available' | 'rented';
  videoUrl?: string;
  categoryId?: number;
  categoryName?: string;
  amenityIds?: number[];
  amenityNames?: string[];
  imageUrls?: string[];
};

export type UpdatePostPayload = {
  title?: string;
  description?: string;
  price?: number;
  area?: number;
  address?: string;
  latitude?: number;
  longitude?: number;
  max_occupancy?: number;
  campus?: 'CS1' | 'CS2' | 'CS3';
  availability?: 'available' | 'rented';
  videoUrl?: string;
  categoryId?: number;
  amenityIds?: number[];
  imageUrls?: string[];
};

export type PostImage = {
  image_url?: string;
};

export type PostAmenity = {
  name?: string;
};

export type PostCategory = {
  name?: string;
};

export type PostUserProfile = {
  full_name?: string;
  phone_number?: string;
  avatar_url?: string;
};

export type PostUser = {
  id?: number;
  email?: string;
  username?: string;
  profile?: PostUserProfile;
};

export type Post = {
  id: number;
  title: string;
  description?: string;
  price: number | string;
  area: number | string;
  address: string;
  latitude?: number;
  longitude?: number;
  max_occupancy?: number;
  campus?: 'CS1' | 'CS2' | 'CS3' | null;
  availability?: 'available' | 'rented';
  videoUrl?: string | null;
  status?: string;
  rejectionReason?: string | null;
  resubmittedAt?: string | null;
  images?: PostImage[];
  amenities?: PostAmenity[];
  category?: PostCategory;
  user?: PostUser;
  createdAt?: string;
  updatedAt?: string;
};

type UploadResult = {
  url?: string;
  public_id?: string;
};

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:3001';

export async function uploadImages(files: File[]): Promise<string[]> {
  if (!files || files.length === 0) return [];

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const res = await api.post<UploadResult[]>('/upload/multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return (res.data || [])
    .map((item) => item.url)
    .filter((url): url is string => Boolean(url));
}

export async function createPost(payload: CreatePostPayload) {
  const res = await api.post('/posts', payload);
  return res.data;
}

export async function getApprovedPosts(): Promise<Post[]> {
  const res = await api.get<Post[]>('/posts');
  return res.data ?? [];
}

export async function getAdminPosts(status: string | undefined, token: string) {
  const res = await axios.get(`${getBaseUrl()}/posts/admin`, {
    params: status ? { status } : undefined,
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data ?? [];
}

export async function updatePostStatus(
  id: number,
  status: string,
  token: string,
  rejectionReason?: string,
) {
  const payload: Record<string, string> = { status };
  if (rejectionReason) payload.rejectionReason = rejectionReason;

  const res = await axios.patch(
    `${getBaseUrl()}/posts/admin/${id}/approve`,
    payload,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
}

export async function getPostById(id: number | string): Promise<Post> {
  const res = await api.get<Post>(`/posts/${id}`);
  return res.data;
}

export async function getMyPosts(token: string): Promise<Post[]> {
  const res = await axios.get<Post[]>(`${getBaseUrl()}/posts/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function getMySavedPostIds(token: string): Promise<number[]> {
  const res = await axios.get<number[]>(`${getBaseUrl()}/posts/saved/ids`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function savePost(postId: number, token: string) {
  const res = await axios.post(
    `${getBaseUrl()}/posts/${postId}/save`,
    undefined,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
}

export async function unsavePost(postId: number, token: string) {
  const res = await axios.delete(`${getBaseUrl()}/posts/${postId}/save`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updatePost(
  id: number,
  payload: UpdatePostPayload,
  token: string,
) {
  const res = await axios.patch(`${getBaseUrl()}/posts/${id}`, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return res.data;
}

export async function deletePost(id: number, token: string) {
  const res = await axios.delete(`${getBaseUrl()}/posts/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
}
