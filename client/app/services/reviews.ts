import api from "./api";
import axios from "axios";

export type PublicReview = {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  user?: {
    id?: number;
    username?: string;
    email?: string;
    profile?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
};

export type ReviewPostSummary = {
  id: number;
  title?: string;
  address?: string;
  status?: string;
  category?: {
    id: number;
    name?: string;
  };
};

export type MyReviewItem = {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  post?: ReviewPostSummary;
};

export type CreateReviewPayload = {
  postId?: number;
  rating: number;
  comment: string;
};

export type UpdateReviewPayload = {
  rating?: number;
  comment?: string;
};


export type AdminReviewItem = {
  id: number;
  rating: number;
  comment?: string | null;
  createdAt?: string;
  user?: {
    id?: number;
    username?: string;
    email?: string;
    profile?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  post?: {
    id?: number;
    title?: string;
    address?: string;
    status?: string;
    category?: {
      id?: number;
      name?: string;
    };
  };
};

export type PostReviewsResponse = {
  postId: number;
  averageRating: number;
  totalReviews: number;
  reviews: PublicReview[];
};

export async function getLatestReviews(limit = 3): Promise<PublicReview[]> {
  const res = await api.get<PublicReview[]>("/reviews", { params: { limit } });
  return res.data ?? [];
}

export async function getMyReviews(limit = 20): Promise<MyReviewItem[]> {
  const res = await api.get<MyReviewItem[]>("/reviews/me", { params: { limit } });
  return Array.isArray(res.data) ? res.data : [];
}

export async function createReview(payload: CreateReviewPayload) {
  const res = await api.post("/reviews", payload);
  return res.data;
}

export async function updateReview(reviewId: number, payload: UpdateReviewPayload) {
  const res = await api.patch(`/reviews/${reviewId}`, payload);
  return res.data;
}

export async function getPostReviews(postId: number, limit = 10): Promise<PostReviewsResponse> {
  const res = await api.get<PostReviewsResponse>(`/reviews/post/${postId}`, {
    params: { limit },
  });

  return (
    res.data ?? {
      postId,
      averageRating: 0,
      totalReviews: 0,
      reviews: [],
    }
  );
}


const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";


export async function getAdminReviews(token: string, limit = 100, q = "") {
  const res = await axios.get<AdminReviewItem[]>(`${getBaseUrl()}/reviews/admin`, {
    params: { limit, q },
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function deleteAdminReview(reviewId: number, token: string) {
  const res = await axios.delete(`${getBaseUrl()}/reviews/admin/${reviewId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
