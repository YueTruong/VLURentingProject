"use client";

import Image from "next/image";
import Link from "next/link";
import UserPageShell from "@/app/homepage/components/UserPageShell";

type SavedItem = {
  id: number;
  title: string;
  location: string;
  image: string;
  price: string;
  updated: string;
  status: "active" | "viewed" | "archived";
  tags: string[];
};

const savedItems: SavedItem[] = [
  {
    id: 201,
    title: "Phòng trọ 1 ngủ gần cơ sở 3",
    location: "Quận Gò Vấp, TP.HCM",
    image: "/images/House.svg",
    price: "4.2 triệu",
    updated: "Cập nhật 2 giờ trước",
    status: "active",
    tags: ["1 ngủ", "Ban công", "Wifi free"],
  },
  {
    id: 202,
    title: "Căn hộ mini full nội thất",
    location: "Quận Bình Thạnh",
    image: "/images/House.svg",
    price: "6.8 triệu",
    updated: "Cập nhật hôm qua",
    status: "viewed",
    tags: ["2 ngủ", "Bảo vệ 24/7", "Giữ xe mái che"],
  },
  {
    id: 203,
    title: "Nhà nguyên căn 3 tầng",
    location: "Thủ Đức, TP.HCM",
    image: "/images/House.svg",
    price: "12.5 triệu",
    updated: "Cập nhật 3 ngày trước",
    status: "active",
    tags: ["3 ngủ", "2 phòng tắm", "Sân thượng"],
  },
  {
    id: 204,
    title: "Co-living có bếp riêng",
    location: "Quận 7, TP.HCM",
    image: "/images/House.svg",
    price: "3.1 triệu",
    updated: "Đã lưu 2 tuần trước",
    status: "archived",
    tags: ["2 ngủ", "Giờ giấc tự do", "Gần TTTM"],
  },
];

function StatusBadge({ status }: { status: SavedItem["status"] }) {
  const tone =
    status === "active"
      ? "bg-green-100 text-green-700"
      : status === "archived"
        ? "bg-gray-100 text-gray-600"
        : "bg-blue-100 text-blue-700";

  const label = status === "active" ? "Đang mở" : status === "archived" ? "Hết hạn" : "Đã xem";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{label}</span>;
}

function SavedCard({ item }: { item: SavedItem }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row">
        <div className="relative h-48 w-full md:h-auto md:w-56">
          <Image src={item.image} alt={item.title} fill className="object-cover" />
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">{item.updated}</p>
              <h3 className="mt-1 text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.location}</p>
            </div>
            <StatusBadge status={item.status} />
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-700">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 px-3 py-1">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-bold text-[#D51F35]">
              {item.price} <span className="text-sm font-medium text-gray-600">/ tháng</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 active:scale-95">
                Đặt lịch xem
              </button>
              <button className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black active:scale-95">
                Mở tin
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SavedPage() {
  return (
    <UserPageShell
      title="Tin đã lưu"
      description="Lưu lại các tin muốn xem kỹ hơn hoặc chia sẻ với bạn bè. Mỗi tin đều hiển thị thông tin cập nhật mới nhất."
      actions={
        <Link
          href="/favorites"
          className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 active:scale-95"
        >
          Quay lại yêu thích
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-base font-semibold text-gray-900">{savedItems.length} tin đang lưu</p>
            <p className="text-sm text-gray-600">
              Bạn có thể đặt lịch xem, gửi tin nhắn hoặc xóa các tin không còn phù hợp.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 active:scale-95">
              Xóa tất cả
            </button>
            <button className="rounded-full bg-[#D51F35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b01628] active:scale-95">
              Đặt thông báo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {savedItems.map((item) => (
            <SavedCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </UserPageShell>
  );
}
