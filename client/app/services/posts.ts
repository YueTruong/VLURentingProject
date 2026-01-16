import api from "./api";

export type CreatePostPayload = {
  title: string;
  description: string;
  price: number;
  area: number;
  address: string;
  latitude?: number | string;
  longitude?: number | string;
  max_occupancy?: number;
  categoryId?: number;
  categoryName?: string;
  amenityIds?: number[];
  amenityNames?: string[];
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
  status?: string;
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

export async function uploadImages(files: File[]): Promise<string[]> {
  if (!files || files.length === 0) return [];

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const res = await api.post<UploadResult[]>("/upload/multiple", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return (res.data || [])
    .map((item) => item.url)
    .filter((url): url is string => Boolean(url));
}

export async function createPost(payload: CreatePostPayload) {
  const res = await api.post("/posts", payload);
  return res.data;
}

export async function getApprovedPosts(): Promise<Post[]> {
  const res = await api.get<Post[]>("/posts");
  return res.data ?? [];
}

export async function getAdminPosts(status?: string): Promise<Post[]> {
  const res = await api.get<Post[]>(
    "/admin/posts",
    status ? { params: { status } } : undefined,
  );
  return res.data ?? [];
}

export async function updatePostStatus(id: number, status: string) {
  const res = await api.patch(`/admin/posts/${id}/status`, { status });
  return res.data;
}

export async function getPostById(id: number | string): Promise<Post> {
  const res = await api.get<Post>(`/posts/${id}`);
  return res.data;
}
