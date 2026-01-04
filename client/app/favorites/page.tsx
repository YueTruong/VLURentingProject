"use client";

import Link from "next/link";
import RoomCard from "@/app/homepage/components/RoomCard";
import UserPageShell from "@/app/homepage/components/UserPageShell";

const favoriteRooms = [
  {
    id: 101,
    title: "Căn hộ studio view sông",
    image: "/images/House.svg",
    location: "Quận 7, TP.HCM",
    beds: 1,
    baths: 1,
    wifi: true,
    area: "32m²",
    price: "4.8 triệu",
  },
  {
    id: 102,
    title: "Phòng trọ gần cơ sở 3",
    image: "/images/House.svg",
    location: "Quận Gò Vấp, TP.HCM",
    beds: 1,
    baths: 1,
    wifi: true,
    area: "28m²",
    price: "3.9 triệu",
  },
  {
    id: 103,
    title: "Nhà nguyên căn 3 phòng",
    image: "/images/House.svg",
    location: "Thủ Đức, TP.HCM",
    beds: 3,
    baths: 2,
    wifi: true,
    area: "96m²",
    price: "11.5 triệu",
  },
  {
    id: 104,
    title: "Căn hộ 2PN full nội thất",
    image: "/images/House.svg",
    location: "Quận Bình Thạnh",
    beds: 2,
    baths: 2,
    wifi: true,
    area: "70m²",
    price: "8.2 triệu",
  },
  {
    id: 105,
    title: "Phòng trọ có ban công",
    image: "/images/House.svg",
    location: "Quận 10, TP.HCM",
    beds: 1,
    baths: 1,
    wifi: false,
    area: "22m²",
    price: "3.2 triệu",
  },
  {
    id: 106,
    title: "Co-living gần cơ sở 2",
    image: "/images/House.svg",
    location: "Quận Phú Nhuận, TP.HCM",
    beds: 4,
    baths: 2,
    wifi: true,
    area: "54m²",
    price: "2.6 triệu",
  },
];

export default function FavoritesPage() {
  return (
    <UserPageShell
      title="Danh sách yêu thích"
      description="Những tin bạn đã đánh dấu để xem lại nhanh, so sánh và nhận thông báo khi chủ nhà cập nhật."
      actions={
        <button className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 active:scale-95">
          Chia sẻ danh sách
        </button>
      }
    >
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Tổng tin yêu thích</p>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{favoriteRooms.length}</div>
            <p className="text-xs text-gray-500">Nhận thông báo khi tin thay đổi.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Tin đã lưu</p>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">4</div>
            <p className="text-xs text-gray-500">Đã mở chi tiết hoặc đặt lịch xem.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Gợi ý theo khu vực</p>
            <div className="mt-2 text-2xl font-extrabold text-gray-900">Quận 3, 5, Bình Thạnh</div>
            <p className="text-xs text-gray-500">Dựa trên lượt lưu gần đây.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-gray-900">{favoriteRooms.length} tin yêu thích</p>
              <p className="text-sm text-gray-600">
                Giữ lại các tin phù hợp, bật nhắc giá và cập nhật từ chủ nhà.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 active:scale-95">
                Xóa hết
              </button>
              <Link
                href="/saved"
                className="rounded-full bg-[#D51F35] px-5 py-2 text-sm font-semibold text-white hover:bg-[#b01628] active:scale-95"
              >
                Xem tin đã lưu
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {["Gần trường", "Giá < 5 triệu", "Có ban công", "Cho nuôi thú cưng"].map((tag) => (
              <button
                key={tag}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 active:scale-95"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {favoriteRooms.map((room) => (
            <RoomCard key={room.id} data={room} />
          ))}
        </div>

        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-gray-800">Không thấy tin hợp lý?</p>
            <p className="text-sm text-gray-600">
              Cập nhật bộ lọc để nhận gợi ý chính xác hơn hoặc yêu cầu gợi ý riêng từ VLU Renting.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 active:scale-95">
              Chỉnh bộ lọc
            </button>
            <button className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black active:scale-95">
              Nhận gợi ý
            </button>
          </div>
        </div>
      </div>
    </UserPageShell>
  );
}
