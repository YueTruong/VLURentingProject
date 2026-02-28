"use client";

import Image from "next/image";
import Link from "next/link";
import { getFavoriteScope, toggleFavorite, useFavoritesByScope } from "@/app/services/favorites";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

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
  const iconClassName = "dark:invert transition-all";

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
      className={`group relative flex h-full w-full max-w-[360px] flex-none flex-col overflow-hidden rounded-[20px] bg-white border border-transparent shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.14)] dark:border-gray-600 dark:bg-gray-800 dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] dark:hover:border-gray-400 dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] ${className ?? ""}`}
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
        
        {canUseFavoriteAction && (
          <button
            type="button"
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md backdrop-blur-sm transition-all hover:bg-red-50 hover:text-red-500 active:scale-90 dark:border dark:border-gray-600 dark:bg-gray-800/90 dark:text-gray-100 dark:hover:bg-gray-700 dark:hover:text-red-400"
            onClick={handleToggleFavorite} 
            aria-label="Lưu tin"
            aria-pressed={isSaved}
          >
            <span className={`text-xl leading-none ${isSaved ? "text-red-500 dark:text-red-400" : ""}`}>
              {isSaved ? "♥" : "♡"} 
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="space-y-1">
          <h3 className="line-clamp-2 text-[18px] font-semibold text-gray-900 dark:text-white" title={data.title}>
            {data.title}
          </h3>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <span aria-hidden="true">📍</span>
            <span className="truncate">{data.location}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-700 dark:text-gray-200">
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
                <span className="text-gray-700 dark:text-gray-200">Miễn phí</span>
              </>
            ) : (
              <>
                <Image
                  src="/icons/Wifi-Icon.svg"
                  alt="Không có Wifi"
                  width={18}
                  height={18}
                  className={`${iconClassName} opacity-40 grayscale dark:opacity-30`} 
                />
                <span className="text-gray-700 dark:text-gray-500">Không</span>
              </>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2 text-gray-700 dark:text-gray-200">
            <span>{data.area}</span>
          </div>
        </div>

        {/* ✅ Đường kẻ ngang (divider) sáng rõ hơn để tạo độ nổi */}
        <hr className="border-dashed border-gray-200 dark:border-gray-600" />

        <div className="flex items-center justify-between">
          <p className="text-[18px] font-bold text-red-500 dark:text-red-400">
            {data.price} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/ tháng</span>
          </p>
          <Link
            href={`/listings/${data.id}`}
            className="rounded-[10px] bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600 transition-all duration-300 hover:bg-blue-600 hover:text-white active:scale-95 dark:bg-blue-600/20 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white"
          >
            Xem ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
