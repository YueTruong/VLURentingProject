"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import UserTopBar from "@/app/homepage/components/UserTopBar";
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

export default function MyReviewsPage() {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState<MyReviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"from-you" | "about-you">("from-you");

  useEffect(() => {
    if (status !== "authenticated" || !session) return;

    let active = true;

    const loadReviews = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getMyReviews(50);
        if (!active) return;
        setReviews(data);
      } catch {
        if (!active) return;
        setReviews([]);
        setError("Không thể tải đánh giá của bạn.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void loadReviews();

    return () => {
      active = false;
    };
  }, [session, status]);

  const publishedReviews = useMemo(() => reviews.filter((item) => !!item.post?.id), [reviews]);
  const averageRating = useMemo(() => {
    if (publishedReviews.length === 0) return 0;
    const total = publishedReviews.reduce((sum, item) => sum + (Number.isFinite(item.rating) ? item.rating : 0), 0);
    return total / publishedReviews.length;
  }, [publishedReviews]);

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#222222]">
      <UserTopBar />

      <main className="mx-auto w-full max-w-none px-4 pb-16 pt-8 sm:px-6 sm:pt-10 lg:px-12">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Đánh giá</h1>

        <div className="mt-8 border-b border-[#dddddd]">
          <div className="flex items-center gap-6 text-sm sm:text-base">
            <button
              type="button"
              onClick={() => setActiveTab("about-you")}
              className={`pb-3 ${
                activeTab === "about-you"
                  ? "border-b-2 border-[#222222] font-semibold text-[#222222]"
                  : "text-[#717171] hover:text-[#222222]"
              }`}
              aria-current={activeTab === "about-you" ? "page" : undefined}
            >
              Đánh giá về bạn
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("from-you")}
              className={`pb-3 ${
                activeTab === "from-you"
                  ? "border-b-2 border-[#222222] font-semibold text-[#222222]"
                  : "text-[#717171] hover:text-[#222222]"
              }`}
              aria-current={activeTab === "from-you" ? "page" : undefined}
            >
              Đánh giá từ bạn
            </button>
          </div>
        </div>

        {activeTab === "about-you" ? (
          <section className="mt-10">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Đánh giá về bạn</h2>
            <p className="mt-3 text-base text-[#484848]">
              Đây là nơi hiển thị các đánh giá mà người thuê/chủ trọ khác gửi cho bạn.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#dddddd] bg-white p-5">
                <p className="text-sm text-[#717171]">Trung bình</p>
                <p className="mt-2 text-2xl font-semibold text-[#222222]">0.0</p>
                <p className="mt-1 text-sm text-[#717171]">Chưa có đánh giá nhận được</p>
              </div>
              <div className="rounded-2xl border border-[#dddddd] bg-white p-5">
                <p className="text-sm text-[#717171]">Tổng số đánh giá</p>
                <p className="mt-2 text-2xl font-semibold text-[#222222]">0</p>
                <p className="mt-1 text-sm text-[#717171]">Dữ liệu sẽ cập nhật khi có phản hồi mới</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-dashed border-[#d5d5d5] bg-white p-6">
              <p className="text-base font-medium text-[#222222]">Chưa có đánh giá nào về bạn.</p>
              <p className="mt-2 text-sm text-[#717171]">
                Khi có người đánh giá hồ sơ của bạn, nội dung sẽ xuất hiện tại đây.
              </p>
            </div>
          </section>
        ) : (
          <section className="mt-10">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Đánh giá trước đây bạn đã viết</h2>

            {!session && status !== "loading" ? (
              <p className="mt-3 text-base text-[#222222]">Bạn cần đăng nhập để xem đánh giá của mình.</p>
            ) : loading ? (
              <p className="mt-3 text-base text-[#222222]">Đang tải đánh giá...</p>
            ) : error ? (
              <p className="mt-3 text-base text-[#222222]">{error}</p>
            ) : publishedReviews.length === 0 ? (
              <p className="mt-3 text-base text-[#222222]">Bạn chưa viết bất kỳ đánh giá nào.</p>
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#dddddd] bg-white p-5">
                    <p className="text-sm text-[#717171]">Trung bình đánh giá đã gửi</p>
                    <p className="mt-2 text-2xl font-semibold text-[#222222]">{averageRating.toFixed(1)}</p>
                  </div>
                  <div className="rounded-2xl border border-[#dddddd] bg-white p-5">
                    <p className="text-sm text-[#717171]">Tổng số đánh giá đã gửi</p>
                    <p className="mt-2 text-2xl font-semibold text-[#222222]">{publishedReviews.length}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {publishedReviews.map((review) => {
                    const title = review.post?.title?.trim() || "Tin đăng đã bị xóa";
                    const location = review.post?.address?.trim() || "Không rõ địa điểm";
                    const content = (review.comment ?? "").trim() || "Không có nội dung đánh giá.";

                    return (
                      <article key={review.id} className="rounded-2xl border border-[#dddddd] bg-white p-5">
                        <p className="text-sm text-[#717171]">
                          {formatReviewDate(review.createdAt)} • {location}
                        </p>
                        {review.post?.id ? (
                          <Link href={`/listings/${review.post.id}`} className="mt-1 block text-base font-semibold hover:underline">
                            {title}
                          </Link>
                        ) : (
                          <h3 className="mt-1 text-base font-semibold">{title}</h3>
                        )}
                        <p className="mt-3 text-sm text-[#222222]">{content}</p>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
