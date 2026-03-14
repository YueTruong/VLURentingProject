"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { getFavoriteScope, toggleFavorite, useFavoritesByScope } from "@/app/services/favorites";
import { type Listing, formatArea, formatPrice } from "../data/listings";

type ListingCardProps = {
  item: Listing;
};

export default function ListingCard({ item }: ListingCardProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role?.toLowerCase();
  const favoriteScope = getFavoriteScope(session?.user?.id);
  const favorites = useFavoritesByScope(favoriteScope);
  const isSaved = favorites.some((fav) => fav.id === item.id);

  const roomDataToSave = useMemo(
    () => ({
      id: item.id,
      title: item.title,
      image: item.image,
      location: item.location,
      beds: item.beds,
      baths: item.baths,
      wifi: item.wifi,
      area: formatArea(item.area),
      price: formatPrice(item.price),
    }),
    [item],
  );

  const handleToggleFavorite = () => {
    if (!session) {
      toast.error("Vui lòng đăng nhập để lưu tin!", {
        style: { borderRadius: "10px", background: "#333", color: "#fff" },
      });
      return;
    }

    toggleFavorite(roomDataToSave, favoriteScope);
    if (isSaved) {
      toast("Đã bỏ lưu tin", { icon: "💔" });
    } else {
      toast.success("Đã lưu tin thành công!");
    }
  };

  const availabilityLabel = item.availability === "rented" ? "Đã cho thuê" : "Còn phòng";
  const availabilityClass =
    item.availability === "rented"
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";
  const districtLabel = item.district?.trim() || "Chưa cập nhật";
  const amenityBadges = useMemo(() => {
    const normalized = new Set<string>();
    const merged: string[] = [];

    for (const amenity of item.tags) {
      const value = amenity?.trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (normalized.has(key)) continue;
      normalized.add(key);
      merged.push(value);
    }

    return merged;
  }, [item.tags]);

  return (
    <article className="overflow-hidden rounded-2xl border border-(--theme-border) bg-(--theme-surface) shadow-sm transition-shadow hover:border-(--theme-border-strong) hover:shadow-md">
      <div className="flex flex-col md:flex-row">
        <div className="relative h-52 w-full md:h-auto md:w-64">
          <Image
            src={item.image || "/images/House.svg"}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 256px"
            className="object-cover"
          />

          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-(--theme-surface)/90 px-2 py-1 text-xs font-semibold text-(--theme-text) backdrop-blur-sm">
              {item.type}
            </span>
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
              {item.campus}
            </span>
            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${availabilityClass}`}>
              {availabilityLabel}
            </span>
          </div>

          {userRole !== "landlord" ? (
            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-label={isSaved ? "Bỏ lưu tin" : "Lưu tin"}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-(--theme-surface) text-(--theme-text-muted) shadow transition-colors hover:bg-(--brand-accent-soft) hover:text-(--brand-accent) md:hidden"
            >
              <span className={`text-lg leading-none ${isSaved ? "text-(--brand-accent)" : ""}`}>
                {isSaved ? "♥" : "♡"}
              </span>
            </button>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="text-xs uppercase tracking-wide text-(--theme-text-subtle)">{item.updatedLabel}</p>
              <h3 className="line-clamp-2 text-lg font-semibold text-(--theme-text)">{item.title}</h3>
              <p className="truncate text-sm text-(--theme-text-muted)">{item.location}</p>
              <p className="text-xs font-medium text-(--theme-text-subtle)">
                {districtLabel} • {item.campus} • {availabilityLabel}
              </p>
            </div>
            <div className="hidden shrink-0 text-right sm:block">
              <p className="text-xs text-(--theme-text-subtle)">Đánh giá</p>
              <p className="text-sm font-semibold text-(--theme-text)">
                {item.rating} ({item.reviews})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-(--theme-text-muted)">
            <div className="flex items-center gap-2">
              <Image src="/icons/Bed-Icon.svg" alt="Giường" width={20} height={20} className="icon-adapt-dark" />
              <span>{item.beds} giường</span>
            </div>
            <div className="flex items-center gap-2">
              <Image src="/icons/Bath-Icon.svg" alt="Phòng tắm" width={18} height={18} className="icon-adapt-dark" />
              <span>{item.baths} phòng tắm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-(--theme-text-subtle)">Diện tích</span>
              <span>{formatArea(item.area)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-(--theme-text-subtle)">Khu vực</span>
              <span>{districtLabel}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-(--theme-text-subtle)">Tiện ích</p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-(--theme-text-muted)">
              {item.videoUrl ? <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-700">Có video</span> : null}
              {amenityBadges.slice(0, 8).map((badge, index) => (
                <span
                  key={`${item.id}-amenity-${badge}-${index}`}
                  className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700"
                >
                  {badge}
                </span>
              ))}
              {amenityBadges.length > 8 ? (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                  +{amenityBadges.length - 8} tiện ích
                </span>
              ) : null}
              {amenityBadges.length === 0 && !item.videoUrl ? (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">Chưa cập nhật tiện ích</span>
              ) : null}
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-lg font-bold text-(--brand-accent)">
              {formatPrice(item.price)} <span className="text-sm font-medium text-(--theme-text-muted)">/ tháng</span>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              {userRole !== "landlord" ? (
                <button
                  type="button"
                  onClick={handleToggleFavorite}
                  className={`w-full rounded-full border px-5 py-2 text-sm font-semibold transition-all active:scale-95 sm:w-auto ${
                    isSaved
                      ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                      : "border-(--theme-border) bg-(--theme-surface) text-(--theme-text) hover:bg-(--theme-surface-muted)"
                  }`}
                >
                  {isSaved ? "Đã lưu ♥" : "Lưu tin ♡"}
                </button>
              ) : null}

              <Link
                href={`/listings/${item.id}`}
                className="w-full rounded-full bg-[#D51F35] px-6 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-[#b01628] active:scale-95 sm:w-auto"
              >
                Xem chi tiết
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
