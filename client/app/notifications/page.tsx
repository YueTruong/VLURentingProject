"use client";

import UserTopBar from "@/app/homepage/components/UserTopBar";

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: "listing" | "message" | "system";
  highlight?: boolean;
};

const notifications: NotificationItem[] = [
  {
    id: "n1",
    title: "Lịch xem phòng đã được xác nhận",
    detail: "Chủ nhà phòng trọ cơ sở 3 xác nhận lịch 15:00 hôm nay. Vui lòng đến đúng giờ.",
    time: "10 phút trước",
    type: "listing",
    highlight: true,
  },
  {
    id: "n2",
    title: "Tin nhắn mới từ chủ nhà",
    detail: "Bạn có thể ghé sớm hơn 30 phút không? Tôi có việc bận đột xuất vào buổi chiều.",
    time: "1 giờ trước",
    type: "message",
    highlight: true,
  },
  {
    id: "n3",
    title: "Cập nhật tính năng",
    detail: "Đã thêm bộ lọc ký túc xá và gợi ý khu vực gần VLU.",
    time: "Hôm qua",
    type: "system",
  },
  {
    id: "n4",
    title: "Tin yêu thích có thay đổi giá",
    detail: "Căn hộ mini Bình Thạnh giảm còn 6.5 triệu/tháng.",
    time: "2 ngày trước",
    type: "listing",
  },
];

function TypeBadge({ type }: { type: NotificationItem["type"] }) {
  const map = {
    system: { label: "Hệ thống", color: "bg-gray-100 text-gray-800" },
    message: { label: "Tin nhắn", color: "bg-blue-100 text-blue-700" },
    listing: { label: "Tin phòng", color: "bg-green-100 text-green-700" },
  };
  const chosen = map[type];
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${chosen.color}`}>{chosen.label}</span>;
}

function NotificationCard({ item }: { item: NotificationItem }) {
  const border = item.highlight ? "border-red-200 bg-red-50" : "border-gray-200 bg-white";
  return (
    <article className={`rounded-2xl border ${border} p-4 shadow-sm`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
          <p className="text-sm text-gray-700 mt-1">{item.detail}</p>
          <p className="text-xs text-gray-500 mt-2">{item.time}</p>
        </div>
        <TypeBadge type={item.type} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="rounded-full border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50 active:scale-95">
          Đánh dấu đã đọc
        </button>
        <button className="rounded-full bg-[#0b1a57] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0a1647] active:scale-95">
          Mở chi tiết
        </button>
      </div>
    </article>
  );
}

export default function NotificationsPage() {
  const unread = notifications.filter((n) => n.highlight).length;

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <UserTopBar />

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="rounded-3xl bg-white shadow-md border border-gray-100 overflow-hidden">
          {/* Tabs mock */}
          <div className="flex items-center gap-4 border-b border-gray-100 px-6 pt-6">
            <button className="rounded-t-xl border-b-2 border-transparent px-3 pb-3 text-sm font-semibold text-gray-500 hover:text-gray-800">
              Thông tin chung
            </button>
            <button className="rounded-t-xl border-b-2 border-transparent px-3 pb-3 text-sm font-semibold text-gray-500 hover:text-gray-800">
              Bảo mật & Mật khẩu
            </button>
            <button className="rounded-t-xl border-b-2 border-[#2c4ce8] px-3 pb-3 text-sm font-semibold text-[#2c4ce8]">
              Thông báo
            </button>
          </div>

          <div className="bg-gradient-to-r from-[#0c184f] to-[#182c7a] text-white px-6 py-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded-full bg-white/15 px-2 py-1 text-xs font-semibold uppercase">Thông báo</span>
              </div>
              <h1 className="text-2xl font-bold">Trung tâm thông báo</h1>
              <p className="text-sm text-gray-100">
                Tổng hợp cập nhật mới về tin nhắn, lịch xem phòng và thay đổi từ các tin bạn quan tâm.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gray-100">Luồng người dùng</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gray-100">Cập nhật thời gian thực</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-100">{unread} thông báo chưa đọc</p>
              <div className="flex gap-2">
                <button className="rounded-full bg-white text-[#0b1a57] px-4 py-2 text-xs font-semibold hover:bg-gray-100">Bật thông báo</button>
                <button className="rounded-full border border-white/50 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10">Cài đặt ưu tiên</button>
                <button className="rounded-full bg-[#d51f35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#b01628]">Đọc hết</button>
              </div>
            </div>
          </div>

          <div className="space-y-3 px-6 py-5 bg-white">
            {notifications.map((n) => (
              <NotificationCard key={n.id} item={n} />
            ))}
            <div className="flex justify-center py-2">
              <button className="text-sm font-semibold text-gray-700 hover:underline">Xem các thông báo cũ hơn</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
