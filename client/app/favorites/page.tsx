"use client";

import { useMemo } from "react";
import Link from "next/link";
import RoomCard from "@/app/homepage/components/RoomCard";
import UserPageShell from "@/app/homepage/components/UserPageShell";
import { clearFavorites, useFavorites } from "@/app/services/favorites";

export default function FavoritesPage() {
  const favorites = useFavorites();
  const favoriteRooms = useMemo(() => {
    return [...favorites].sort((a, b) => {
      const ta = new Date(a.savedAt).getTime();
      const tb = new Date(b.savedAt).getTime();
      return tb - ta;
    });
  }, [favorites]);

  const recentCount = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    return favoriteRooms.filter((room) => {
      const ts = new Date(room.savedAt).getTime();
      return Number.isFinite(ts) && now - ts <= weekMs;
    }).length;
  }, [favoriteRooms]);

  const areaSummary = useMemo(() => {
    const areas = favoriteRooms
      .map((room) => room.location.split(",")[0]?.trim())
      .filter((item) => Boolean(item));
    const unique = Array.from(new Set(areas));
    return unique.slice(0, 3).join(", ") || "Chưa có";
  }, [favoriteRooms]);

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
            <p className="text-sm text-gray-500">Mới lưu 7 ngày</p>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{recentCount}</div>
            <p className="text-xs text-gray-500">Những tin được lưu gần đây.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Gợi ý theo khu vực</p>
            <div className="mt-2 text-2xl font-extrabold text-gray-900">{areaSummary}</div>
            <p className="text-xs text-gray-500">Dựa trên khu vực bạn ưa thích.</p>
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
              <button
                onClick={() => clearFavorites()}
                disabled={favoriteRooms.length === 0}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
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

        {favoriteRooms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-600 shadow-sm">
            Chưa có tin yêu thích. Hãy khám phá các phòng trên hệ thống và nhấn ♥ để lưu.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favoriteRooms.map((room) => (
              <RoomCard key={room.id} data={room} />
            ))}
          </div>
        )}

        {/* <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 flex flex-wrap items-center justify-between gap-3 shadow-sm">
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
        </div> */}
      </div>
    </UserPageShell>
  );
}
