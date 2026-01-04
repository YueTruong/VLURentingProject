"use client";

type Review = {
  id: string;
  name: string;
  role?: string;
  rating: number;
  content: string;
  date: string;
};

function Stars({ rating }: { rating: number }) {
  const full = Math.max(0, Math.min(5, Math.floor(rating)));
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < full ? "text-yellow-500" : "text-gray-300"}>
          ★
        </span>
      ))}
      <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function ReviewsSection() {
  // Dùng tạm hard Data
  const reviews: Review[] = [
    {
      id: "1",
      name: "Minh Anh",
      role: "Sinh viên",
      rating: 4.8,
      date: "12/2025",
      content:
        "Phòng sạch, chủ trọ hỗ trợ nhanh. Vị trí gần trường nên đi lại rất tiện, giá cũng ổn so với khu vực.",
    },
    {
      id: "2",
      name: "Hoàng Nam",
      role: "Thuê dài hạn",
      rating: 4.6,
      date: "11/2025",
      content:
        "Mình thích phần mô tả rõ ràng và hình ảnh đúng thực tế. Quy trình đặt lịch xem phòng nhanh gọn.",
    },
    {
      id: "3",
      name: "Ngọc Hân",
      role: "Người thuê",
      rating: 3,
      date: "10/2025",
      content:
        "Khu vực yên tĩnh, có nhiều tiện ích xung quanh. Trải nghiệm tìm phòng trên web mượt và dễ dùng.",
    },
  ];

  // Rating tổng (demo)
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / Math.max(1, reviews.length);

  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto px-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Đánh giá nổi bật</h2>
              <p className="mt-1 text-gray-600">
                Tổng hợp trải nghiệm của người thuê để bạn yên tâm chọn phòng.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white-50 px-4 py-3">
              <div className="text-sm text-gray-600">Điểm trung bình</div>
              <div className="mt-1 flex items-center gap-3">
                <div className="text-3xl font-extrabold text-gray-900">
                  {avg.toFixed(1)}
                </div>
                <Stars rating={avg} />
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Dựa trên {reviews.length} đánh giá
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {reviews.map((r) => (
              <article
                key={r.id}
                className="rounded-2xl border border-gray-200 p-5 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">{r.name}</div>
                    <div className="text-sm text-gray-600">{r.role ? r.role : "Người dùng"} • {r.date}</div>
                  </div>
                  <Stars rating={r.rating} />
                </div>
              
              <p className="mt-4 text-sm leading-6 text-gray-700">{r.content}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-5">
            <div className="text-sm text-gray-600">
              Có thể thêm “Write a review” sau khi có login/booking.
            </div>

            <div className="flex gap-2">
              <button className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-500">
                Xem tất cả
              </button>
              <button className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Viết đánh giá
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}