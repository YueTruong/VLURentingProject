"use client";

import UserPageShell from "@/app/homepage/components/UserPageShell";

type MyReview = {
  id: string;
  title: string;
  rating: number;
  date: string;
  location: string;
  content: string;
  status?: string;
};

const myReviews: MyReview[] = [
  {
    id: "r1",
    title: "Phòng trọ gần cơ sở 3 - ban công thoáng",
    rating: 4.5,
    date: "12/2025",
    location: "Quận Gò Vấp, TP.HCM",
    content:
      "Chủ nhà phản hồi nhanh, phòng sạch, vị trí đi bộ tới trường trong 8 phút. Để xe máy trong nhà không phụ phí.",
    status: "Đã hiển thị",
  },
  {
    id: "r2",
    title: "Căn hộ mini full nội thất",
    rating: 4,
    date: "11/2025",
    location: "Quận Bình Thạnh",
    content:
      "Có bếp riêng, đồ nội thất mới. Giờ giấc tự do nhưng xe gửi dưới hầm chung. Giá phù hợp cho 2 người ở.",
    status: "Đang hiển thị",
  },
  {
    id: "r3",
    title: "Co-living ở quận 7",
    rating: 3,
    date: "10/2025",
    location: "Quận 7, TP.HCM",
    content:
      "Phòng sạch nhưng cách âm chưa tốt. Phù hợp nếu muốn ở cùng bạn bè, chủ nhà dễ thương và dễ trao đổi.",
    status: "Chờ duyệt",
  },
];

function StarRating({ rating }: { rating: number }) {
  const rounded = Math.round(rating);

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
      <span className="ml-2 text-sm font-semibold text-gray-700">{rating.toFixed(1)}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: MyReview }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {review.date} • {review.location}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{review.title}</h3>
        </div>
        <StarRating rating={review.rating} />
      </div>

      <p className="text-sm leading-6 text-gray-700 md:text-base">{review.content}</p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
          {review.status || "Đang xử lý"}
        </span>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 active:scale-95">
            Chỉnh sửa
          </button>
          <button className="rounded-full border border-gray-200 bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black active:scale-95">
            Gửi lại
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MyReviewsPage() {
  const avg = myReviews.reduce((total, review) => total + review.rating, 0) / Math.max(myReviews.length, 1);

  return (
    <UserPageShell
      title="Đánh giá của tôi"
      description="Theo dõi các đánh giá bạn đã gửi cho chủ nhà, xem trạng thái và điều chỉnh nội dung khi cần."
      actions={
        <button className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white border border-white/30 hover:bg-white/20 active:scale-95">
          Viết đánh giá mới
        </button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Trung bình</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="text-3xl font-bold text-gray-900">{avg.toFixed(1)}</div>
              <StarRating rating={avg} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Tổng số đánh giá</p>
            <div className="mt-2 text-3xl font-bold text-gray-900">{myReviews.length}</div>
            <p className="text-xs text-gray-500">Đã hiển thị trên trang tin</p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Gợi ý</p>
            <p className="mt-2 text-sm text-gray-700">
              Cập nhật lại đánh giá cũ nếu chủ nhà đã khắc phục vấn đề bạn nhắc đến.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {myReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </UserPageShell>
  );
}
