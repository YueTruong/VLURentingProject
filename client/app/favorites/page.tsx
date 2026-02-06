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
    return favoriteRooms.filter((room) => Number.isFinite(new Date(room.savedAt).getTime())).length;
  }, [favoriteRooms]);

  const areaSummary = useMemo(() => {
    const areas = favoriteRooms
      .map((room) => room.location.split(",")[0]?.trim())
      .filter((item) => Boolean(item));
    const unique = Array.from(new Set(areas));
    return unique.slice(0, 3).join(", ") || "Chưa có";
  }, [favoriteRooms]);

  const areaTags = useMemo(() => {
    const areas = favoriteRooms
      .map((room) => room.location.split(",")[0]?.trim())
      .filter((item): item is string => Boolean(item));
    return Array.from(new Set(areas)).slice(0, 4);
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
            <p className="text-sm text-gray-500">Tin có thời gian lưu</p>
            <div className="mt-2 text-3xl font-extrabold text-gray-900">{recentCount}</div>
            <p className="text-xs text-gray-500">Dữ liệu hợp lệ để theo dõi lịch sử lưu.</p>
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

          {areaTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {areaTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
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
