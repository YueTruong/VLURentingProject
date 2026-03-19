"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createReview,
  getLatestReviews,
  type CreateReviewPayload,
  type PublicReview,
} from "@/app/services/reviews";

type Review = {
  id: string;
  name: string;
  role?: string;
  rating: number;
  content: string;
  date: string;
};

const formatMonthYear = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = parsed.getFullYear();
  return `${month}/${year}`;
};

const mapApiReview = (review: PublicReview): Review => {
  const name =
    review.user?.profile?.full_name ||
    review.user?.username ||
    review.user?.email ||
    "Người dùng";
  const rating = Number.isFinite(review.rating) ? review.rating : 0;
  const content = (review.comment ?? "").trim() || "Chưa có nội dung đánh giá.";

  return {
    id: String(review.id ?? `${name}-${review.createdAt ?? "0"}`),
    name,
    rating,
    content,
    date: formatMonthYear(review.createdAt),
  };
};

function Stars({ rating }: { rating: number }) {
  const safeRating = Number.isFinite(rating) ? rating : 0;
  const full = Math.max(0, Math.min(5, Math.floor(safeRating)));

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < full ? "text-yellow-500" : "text-[color:var(--theme-border-strong)]"}>
          ★
        </span>
      ))}
      <span className="ml-2 text-sm text-(--theme-text-muted)">{safeRating.toFixed(1)}</span>
    </div>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    getLatestReviews(3)
      .then((data) => {
        if (!active) return;
        setReviews(data.map(mapApiReview));
      })
      .catch(() => {
        if (!active) return;
        setLoadError(true);
      })
      .finally(() => {
        if (!active) return;
        setReviewsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const avg = useMemo(
    () => reviews.reduce((sum, review) => sum + review.rating, 0) / Math.max(1, reviews.length),
    [reviews],
  );

  const handleOpenForm = () => {
    setShowForm(true);
    setFormSuccess(false);
    setFormError("");
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormSuccess(false);
    setFormError("");
  };

  const getSubmitErrorMessage = (error: unknown) => {
    const anyError = error as { response?: { data?: { message?: string | string[] } } };
    const message = anyError?.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string" && message.trim()) return message;
    return "Không thể gửi đánh giá. Vui lòng đăng nhập và thử lại.";
  };

  const handleSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setFormSuccess(false);

    if (!Number.isFinite(formRating) || formRating < 1 || formRating > 5) {
      setFormError("Vui lòng chọn số sao từ 1 đến 5.");
      return;
    }

    if (!formComment.trim()) {
      setFormError("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    const payload: CreateReviewPayload = {
      rating: formRating,
      comment: formComment.trim(),
    };

    setSubmitting(true);
    try {
      await createReview(payload);
      setFormSuccess(true);
      setFormComment("");
      setFormRating(5);

      const latest = await getLatestReviews(3);
      if (latest.length > 0) {
        setReviews(latest.map(mapApiReview));
      }

      setTimeout(() => handleCloseForm(), 1000);
    } catch (error) {
      setFormError(getSubmitErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="w-full bg-transparent py-10 transition-colors">
      <div className="w-full px-4 md:px-6">
        <div className="rounded-3xl border border-(--theme-border) bg-(--theme-surface) p-6 shadow-sm transition-colors">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-(--theme-text)">Đánh giá nổi bật về website</h2>
              <p className="mt-1 text-(--theme-text-muted)">
                Tổng hợp trải nghiệm của người dùng về hệ thống VLU Renting.
              </p>
              {loadError ? (
                <p className="mt-2 text-xs text-(--brand-accent)">
                  Không thể tải đánh giá mới nhất.
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface-muted) px-4 py-3 transition-colors">
              <div className="text-sm text-(--theme-text-muted)">Điểm trung bình</div>
              <div className="mt-1 flex items-center gap-3">
                <div className="text-3xl font-extrabold text-(--theme-text)">{avg.toFixed(1)}</div>
                <Stars rating={avg} />
              </div>
              <div className="mt-1 text-xs text-(--theme-text-subtle)">Dựa trên {reviews.length} đánh giá</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-5 transition-all hover:border-(--theme-border-strong) hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-(--theme-text)">{review.name}</div>
                    <div className="text-sm text-(--theme-text-muted)">
                      {review.role ? review.role : "Người dùng"} - {review.date}
                    </div>
                  </div>
                  <Stars rating={review.rating} />
                </div>

                <p className="mt-4 text-sm leading-6 text-(--theme-text-muted)">{review.content}</p>
              </article>
            ))}

            {!reviewsLoading && reviews.length === 0 && !loadError ? (
              <div className="rounded-2xl border border-dashed border-(--theme-border-strong) p-6 text-center text-sm text-(--theme-text-subtle) md:col-span-3">
                Chưa có đánh giá nào. Hãy là người đầu tiên trải nghiệm!
              </div>
            ) : null}

            {reviewsLoading ? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-(--theme-border-strong) p-6 text-sm text-(--theme-text-subtle) md:col-span-3">
                <span className="mr-2 animate-spin text-xl">⏳</span> Đang tải đánh giá...
              </div>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-(--theme-border) pt-5">
            <div className="flex gap-2">
              <button className="rounded-xl border border-(--theme-border) bg-(--theme-surface) px-4 py-2 text-sm font-semibold text-(--theme-text) transition-colors hover:bg-(--theme-surface-muted) active:scale-95">
                Xem tất cả
              </button>
              <button
                type="button"
                onClick={handleOpenForm}
                className="rounded-xl bg-[#d51f35] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#b01628] active:scale-95"
              >
                Viết đánh giá
              </button>
            </div>
          </div>
        </div>
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-2xl rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-6 shadow-2xl transition-transform">
            <div className="flex items-start justify-between gap-4 border-b border-(--theme-border) pb-4">
              <div>
                <h3 className="text-lg font-bold text-(--theme-text)">Viết đánh giá hệ thống</h3>
                <p className="mt-1 text-sm text-(--theme-text-muted)">
                  Chia sẻ trải nghiệm của bạn để giúp chúng mình cải thiện website tốt hơn.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseForm}
                className="rounded-full bg-(--theme-surface-muted) p-2 text-(--theme-text-muted) transition-colors hover:bg-(--theme-surface) hover:text-(--theme-text)"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form className="mt-5 space-y-5" onSubmit={handleSubmitReview}>
              <div>
                <label className="text-sm font-semibold text-(--theme-text)">Đánh giá sao</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormRating(value)}
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                        formRating === value
                          ? "border-yellow-400 bg-yellow-50 text-yellow-700 shadow-sm"
                          : "border-(--theme-border) bg-(--theme-surface) text-(--theme-text-muted) hover:bg-(--theme-surface-muted)"
                      }`}
                    >
                      {value} ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-(--theme-text)">Nội dung</label>
                <textarea
                  value={formComment}
                  onChange={(event) => setFormComment(event.target.value)}
                  className="mt-2 min-h-[120px] w-full rounded-xl border border-(--theme-border-strong) bg-(--theme-surface) px-4 py-3 text-sm text-(--theme-text) outline-none transition-colors placeholder:text-(--theme-text-subtle) focus:border-[#d51f35] focus:ring-2 focus:ring-[#d51f35]/20"
                  placeholder="Website rất dễ sử dụng, giao diện đẹp..."
                />
              </div>

              {formError ? (
                <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
                  ⚠️ {formError}
                </div>
              ) : null}

              {formSuccess ? (
                <div className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-600">
                  ✅ Cảm ơn bạn! Đánh giá đã được gửi thành công.
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="rounded-full border border-(--theme-border) bg-(--theme-surface) px-6 py-2.5 text-sm font-semibold text-(--theme-text-muted) transition-colors hover:bg-(--theme-surface-muted) active:scale-95"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-[#d51f35] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#b01628] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
