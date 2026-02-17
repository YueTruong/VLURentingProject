"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import UserPageShell from "@/app/homepage/components/UserPageShell";
import { getMyReviews, type MyReviewItem } from "@/app/services/reviews";

const formatReviewDate = (value?: string) => {
  if (!value) return "Mới đăng";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Mới đăng";
  return parsed.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

function StarRating({ rating }: { rating: number }) {
  const safeRating = Number.isFinite(rating) ? rating : 0;
  const rounded = Math.round(safeRating);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, idx) => (
        <svg
          key={idx}
          viewBox="0 0 20 20"
          className={idx < rounded ? "h-5 w-5 text-yellow-500" : "h-5 w-5 text-gray-300"}
          fill="currentColor"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.035a1 1 0 00-1.175 0l-2.802 2.035c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.88 8.72c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-2 text-sm font-semibold text-gray-700">{safeRating.toFixed(1)}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: MyReviewItem }) {
  const title = review.post?.title?.trim() || "Tin đăng đã bị xóa";
  const location = review.post?.address?.trim() || "Không rõ địa điểm";
  const content = (review.comment ?? "").trim() || "Không có nội dung đánh giá.";

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {formatReviewDate(review.createdAt)} • {location}
          </p>
          {review.post?.id ? (
            <Link href={`/listings/${review.post.id}`} className="mt-1 block text-lg font-semibold text-gray-900 hover:underline">
              {title}
            </Link>
          ) : (
            <h3 className="mt-1 text-lg font-semibold text-gray-900">{title}</h3>
          )}
        </div>
        <StarRating rating={review.rating} />
      </div>

      <p className="text-sm leading-6 text-gray-700 md:text-base">{content}</p>

      <div className="flex flex-wrap items-center justify-between gap-3">
      </div>
    </article>
  );
}

export default function MyReviewsPage() {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<MyReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      setReviews([]);
      setLoading(false);
      setError("");
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    getMyReviews(50)
      .then((data) => {
        if (!active) return;
        setReviews(data);
      })
      .catch(() => {
        if (!active) return;
        setReviews([]);
        setError("Không thể tải đánh giá của bạn.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session, status]);

  const avg = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + (Number.isFinite(review.rating) ? review.rating : 0), 0);
    return total / reviews.length;
  }, [reviews]);

  return (
    <UserPageShell
      title="Đánh giá của tôi"
      description="Theo dõi các đánh giá bạn đã gửi cho bài đăng, xem trạng thái và điều chỉnh nội dung khi cần."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Trung bình</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="text-3xl font-bold text-gray-900">{avg.toFixed(1)}</div>
              <StarRating rating={avg} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Tổng số đánh giá</p>
            <div className="mt-2 text-3xl font-bold text-gray-900">{reviews.length}</div>
            <p className="text-xs text-gray-500">Đánh giá đã gửi cho bài đăng</p>
          </div>
        </div>

        {!session && status !== "loading" ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
            Bạn cần đăng nhập để xem các đánh giá của mình.
          </div>
        ) : loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
            Đang tải đánh giá...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
            {error}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
            Bạn chưa có đánh giá nào cho bài đăng.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </UserPageShell>
  );
}
