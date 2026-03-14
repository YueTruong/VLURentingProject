"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import {
  getFavoriteScope,
  toggleFavorite,
  useFavoritesByScope,
} from "@/app/services/favorites";

export type RoomCardData = {
  id: number;
  title: string;
  image: string;
  location: string;
  beds: number;
  baths: number;
  wifi: boolean;
  area: string;
  price: string;
};

interface RoomProps {
  data: RoomCardData;
  className?: string;
}

export default function RoomCard({ data, className }: RoomProps) {
  const { data: session } = useSession();
  const favoriteScope = getFavoriteScope(session?.user?.id);
  const favorites = useFavoritesByScope(favoriteScope);

  const userRole = session?.user?.role?.toLowerCase();
  const canUseFavoriteAction = userRole !== "landlord" && userRole !== "admin";
  const isSaved = favorites.some((item) => item.id === data.id);
  const iconClassName = "icon-adapt-dark transition-all";

  const handleToggleFavorite = () => {
    if (!session) {
      toast.error("Vui lòng đăng nhập để lưu tin!", {
        style: {
          borderRadius: "10px",
          background: "#333",
          color: "#fff",
        },
      });
      return;
    }

    toggleFavorite(data, favoriteScope);

    if (isSaved) {
      toast("Đã bỏ lưu tin", { icon: "💔" });
    } else {
      toast.success("Đã lưu tin thành công!");
    }
  };

  return (
    <div
      className={`group relative flex h-full w-full max-w-[360px] flex-none flex-col overflow-hidden rounded-[20px] border border-(--theme-border) bg-(--theme-surface) shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-(--theme-border-strong) hover:shadow-[0_16px_36px_rgba(0,0,0,0.14)] ${className ?? ""}`}
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={data.image}
          alt={data.title}
          fill
          sizes="(max-width: 768px) 100vw, 360px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/30 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {canUseFavoriteAction ? (
          <button
            type="button"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-(--theme-border) bg-(--theme-surface)/90 text-(--theme-text-muted) shadow-md backdrop-blur-sm transition-all hover:bg-(--brand-accent-soft) hover:text-(--brand-accent) active:scale-90"
            onClick={handleToggleFavorite}
            aria-label="Lưu tin"
            aria-pressed={isSaved}
          >
            <span
              className={`text-xl leading-none ${isSaved ? "text-(--brand-accent)" : ""}`}
            >
              {isSaved ? "♥" : "♡"}
            </span>
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-[18px] font-semibold text-(--theme-text)" title={data.title}>
            {data.title}
          </h3>

          <div className="flex items-center gap-2 text-sm text-(--theme-text-muted)">
            <span aria-hidden="true">📍</span>
            <span className="truncate">{data.location}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-(--theme-text-muted)">
          <div className="flex items-center gap-2" title="Số phòng ngủ">
            <Image src="/icons/Bed-Icon.svg" alt="Giường" width={20} height={20} className={iconClassName} />
            <span>{data.beds}</span>
          </div>

          <div className="flex items-center gap-2" title="Số phòng tắm">
            <Image src="/icons/Bath-Icon.svg" alt="Phòng tắm" width={18} height={18} className={iconClassName} />
            <span>{data.baths}</span>
          </div>

          <div className="flex items-center gap-2" title="Internet">
            {data.wifi ? (
              <>
                <Image src="/icons/Wifi-Icon.svg" alt="Wifi miễn phí" width={18} height={18} className={iconClassName} />
                <span className="text-(--theme-text)">Miễn phí</span>
              </>
            ) : (
              <>
                <Image
                  src="/icons/Wifi-Icon.svg"
                  alt="Không có Wifi"
                  width={18}
                  height={18}
                  className={`${iconClassName} opacity-40 grayscale`}
                />
                <span className="text-(--theme-text-subtle)">Không</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 text-(--theme-text)">
            <span>{data.area}</span>
          </div>
        </div>

        <hr className="border-dashed border-(--theme-border)" />

        <div className="flex items-center justify-between gap-3">
          <p className="text-[18px] font-bold text-(--brand-accent)">
            {data.price} <span className="text-sm font-normal text-(--theme-text-subtle)">/ tháng</span>
          </p>
          <Link
            href={`/listings/${data.id}`}
            className="rounded-[10px] bg-(--brand-primary-soft) px-4 py-1.5 text-sm font-medium text-(--brand-primary-text) transition-all duration-300 hover:bg-(--brand-accent) hover:text-white active:scale-95"
          >
            Xem ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
