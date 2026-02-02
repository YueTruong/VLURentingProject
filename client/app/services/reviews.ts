import api from "./api";

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

export type CreateReviewPayload = {
  postId?: number;
  rating: number;
  comment: string;
};

export async function getLatestReviews(limit = 3): Promise<PublicReview[]> {
  const res = await api.get<PublicReview[]>("/reviews", { params: { limit } });
  return res.data ?? [];
}

export async function createReview(payload: CreateReviewPayload) {
  const res = await api.post("/reviews", payload);
  return res.data;
}
