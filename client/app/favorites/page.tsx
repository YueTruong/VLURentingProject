"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import RoomCard from "@/app/homepage/components/RoomCard";
import UserPageShell from "@/app/homepage/components/UserPageShell";
import { clearFavorites, getFavoriteScope, useFavoritesByScope } from "@/app/services/favorites";
import toast from "react-hot-toast";

export default function FavoritesPage() {
  const { data: session } = useSession();
  const favoriteScope = getFavoriteScope(session?.user?.id);
  const favorites = useFavoritesByScope(favoriteScope);
  
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  const favoriteRooms = useMemo(() => {
    return [...favorites].sort((a, b) => {
      const ta = new Date(a.savedAt).getTime();
      const tb = new Date(b.savedAt).getTime();
      return tb - ta;
    });
  }, [favorites]);

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setNow(Date.now());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const recentCount = useMemo(() => {
    if (now === null) return 0; 
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    return favoriteRooms.filter((room) => new Date(room.savedAt).getTime() > sevenDaysAgo).length;
  }, [favoriteRooms, now]);

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
    return Array.from(new Set(areas)); 
  }, [favoriteRooms]);

  const activeArea = (selectedArea && areaTags.includes(selectedArea)) ? selectedArea : null;

  const filteredRooms = useMemo(() => {
    if (!activeArea) return favoriteRooms;
    
    return favoriteRooms.filter(room => {
      const roomArea = room.location.split(",")[0]?.trim();
      return roomArea === activeArea;
    });
  }, [favoriteRooms, activeArea]);

  const handleClearAll = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ tin đã lưu không? Hành động này không thể hoàn tác.")) {
      clearFavorites(favoriteScope);
      setSelectedArea(null); 
      toast.success("Đã xóa toàn bộ tin đã lưu");
    }
  };

  return (
    <UserPageShell
      title="Tin đã lưu"
      description="Những tin bạn đã đánh dấu để xem lại nhanh, so sánh và nhận thông báo khi chủ nhà cập nhật."
      actions={
        <button 
          className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 active:scale-95 transition-all"
          onClick={() => toast("Tính năng chia sẻ đang được phát triển!", { icon: '🔗' })}
        >
          Chia sẻ danh sách
        </button>
      }
    >
      <div className="space-y-8">
        
        {/* PANEL THỐNG KÊ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-4 shadow-sm">
            <p className="text-sm font-medium text-(--theme-text-subtle)">Tổng tin đã lưu</p>
            <div className="mt-2 text-3xl font-extrabold text-[#D51F35]">{favoriteRooms.length}</div>
            <p className="mt-1 text-xs text-(--theme-text-subtle)">Tin được giữ lại để theo dõi.</p>
          </div>
          <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-4 shadow-sm">
            <p className="text-sm font-medium text-(--theme-text-subtle)">Lưu gần đây</p>
            <div className="mt-2 text-3xl font-extrabold text-(--theme-text)">{recentCount}</div>
            <p className="mt-1 text-xs text-(--theme-text-subtle)">Tin được lưu trong 7 ngày qua.</p>
          </div>
          <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-4 shadow-sm">
            <p className="text-sm font-medium text-(--theme-text-subtle)">Khu vực đang quan tâm</p>
            <div className="mt-2 text-xl font-extrabold text-gray-900 truncate" title={areaSummary}>
              {areaSummary}
            </div>
            <p className="mt-1 text-xs text-(--theme-text-subtle)">Dựa trên các tin bạn đã lưu.</p>
          </div>
        </div>

        {/* TOOLBAR KIỂM SOÁT */}
        <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-(--theme-text)">
                {activeArea ? `Danh sách tại ${activeArea} (${filteredRooms.length})` : `Danh sách (${favoriteRooms.length})`}
              </p>
              <p className="text-sm text-(--theme-text-muted)">
                Bật nhắc giá và cập nhật từ chủ nhà đối với các phòng này.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleClearAll}
                disabled={favoriteRooms.length === 0}
                className="rounded-full border border-(--theme-border) bg-(--theme-surface) px-4 py-2 text-sm font-semibold text-(--theme-text) hover:bg-(--brand-accent-soft) hover:text-(--brand-accent) hover:border-(--brand-accent) transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Xóa hết
              </button>
              <Link
                href="/"
                className="rounded-full bg-(--brand-accent) px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-(--brand-accent-strong) transition-all active:scale-95"
              >
                Tìm thêm phòng
              </Link>
            </div>
          </div>

          {areaTags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-(--theme-border) pt-2">
              <span className="mr-1 py-1 text-xs font-medium text-(--theme-text-subtle)">Lọc theo khu vực:</span>
              
              <button
                onClick={() => setSelectedArea(null)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                  activeArea === null 
                    ? "bg-(--brand-accent) text-white border-[#D51F35] shadow-sm" 
                    : "bg-(--theme-surface-muted) text-(--theme-text-muted) border-(--theme-border) hover:brightness-95"
                }`}
              >
                Tất cả
              </button>

              {areaTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedArea(tag)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition-all ${
                    activeArea === tag 
                      ? "bg-(--brand-accent) text-white border-[#D51F35] shadow-sm" 
                      : "bg-(--theme-surface-muted) text-(--theme-text-muted) border-(--theme-border) hover:brightness-95"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* DANH SÁCH HIỂN THỊ */}
        {favoriteRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--theme-border) bg-(--theme-surface) px-4 py-16 text-center shadow-sm">
            <span className="text-5xl mb-4 opacity-50">📂</span>
            <p className="text-lg font-bold text-(--theme-text)">Chưa có tin nào được lưu</p>
            <p className="mt-2 max-w-md text-sm text-(--theme-text-subtle)">
              Bạn chưa lưu phòng nào. Hãy dạo quanh các bài đăng và nhấn vào biểu tượng <span className="text-red-400 font-bold">♥</span> để lưu lại những căn phòng ưng ý nhé.
            </p>
            <Link 
              href="/" 
              className="mt-6 rounded-full bg-(--brand-accent) px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-(--brand-accent-strong) active:scale-95 transition-all"
            >
              Khám phá ngay
            </Link>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--theme-border) bg-(--theme-surface) px-4 py-16 text-center shadow-sm">
            <span className="text-5xl mb-4 opacity-50">🔍</span>
            <p className="text-lg font-bold text-(--theme-text)">Không tìm thấy tin nào</p>
            <p className="mt-2 max-w-md text-sm text-(--theme-text-subtle)">
              Không có phòng nào trong danh sách tin đã lưu thuộc khu vực <strong>{activeArea}</strong>.
            </p>
            <button 
              onClick={() => setSelectedArea(null)}
              className="mt-6 rounded-full border border-(--theme-border) bg-(--theme-surface) px-6 py-2.5 text-sm font-semibold text-(--theme-text) shadow-sm hover:bg-(--theme-surface-muted) active:scale-95 transition-all"
            >
              Xem tất cả
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} data={room} />
            ))}
          </div>
        )}

      </div>
    </UserPageShell>
  );
}
