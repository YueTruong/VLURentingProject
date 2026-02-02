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
        <span key={i} className={i < full ? "text-yellow-500" : "text-gray-300"}>
          ★
        </span>
      ))}
      <span className="ml-2 text-sm text-gray-600">{safeRating.toFixed(1)}</span>
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
    () => reviews.reduce((sum, r) => sum + r.rating, 0) / Math.max(1, reviews.length),
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
      handleCloseForm();
    } catch (error) {
      setFormError(getSubmitErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-10 bg-white w-full">
      <div className="w-full px-4 md:px-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Đánh giá nổi bật về website</h2>
              <p className="mt-1 text-gray-600">
                Tổng hợp trải nghiệm của người dùng về website.
              </p>
              {loadError && (
                <p className="mt-2 text-xs text-amber-600">
                  Không thể tải đánh giá mới nhất.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white-50 px-4 py-3">
              <div className="text-sm text-gray-600">Điểm trung bình</div>
              <div className="mt-1 flex items-center gap-3">
                <div className="text-3xl font-extrabold text-gray-900">
                  {avg.toFixed(1)}
                </div>
                <Stars rating={avg} />
              </div>
              <div className="mt-1 text-xs text-gray-500">Dựa trên {reviews.length} đánh giá</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {reviews.map((r) => (
              <article key={r.id} className="rounded-2xl border border-gray-200 p-5 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">{r.name}</div>
                    <div className="text-sm text-gray-600">
                      {r.role ? r.role : "Người dùng"} - {r.date}
                    </div>
                  </div>
                  <Stars rating={r.rating} />
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-700">{r.content}</p>
              </article>
            ))}
            {!reviewsLoading && reviews.length === 0 && !loadError && (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500 md:col-span-3">
                Chưa có đánh giá nào.
              </div>
            )}
            {reviewsLoading && (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-500 md:col-span-3">
                Đang tải đánh giá...
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-5">
            <div className="flex gap-2">
              <button className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-500">
                Xem tất cả
              </button>
              <button
                type="button"
                onClick={handleOpenForm}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Viết đánh giá
              </button>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Viết đánh giá</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Chia sẻ trải nghiệm của bạn về website.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseForm}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
              >
                Đóng
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmitReview}>
              <div>
                <label className="text-sm font-semibold text-gray-700">Số sao</label>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormRating(value)}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                        formRating === value
                          ? "border-yellow-400 bg-yellow-50 text-yellow-600"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {value} ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Nội dung</label>
                <textarea
                  value={formComment}
                  onChange={(event) => setFormComment(event.target.value)}
                  className="mt-2 min-h-[120px] w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800"
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                />
              </div>

              {formError && (
                <p className="text-sm font-semibold text-red-500">{formError}</p>
              )}
              {formSuccess && (
                <p className="text-sm font-semibold text-emerald-600">
                  Gửi đánh giá thành công!
                </p>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {submitting ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
