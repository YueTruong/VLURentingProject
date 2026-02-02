"use client";

import Image from "next/image";
import Link from "next/link";
import { toggleFavorite, useFavorites } from "@/app/services/favorites";

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
  const favorites = useFavorites();
  const isSaved = favorites.some((item) => item.id === data.id);

  return (
    <div
      className={`group relative flex h-full w-full max-w-[360px] flex-col overflow-hidden rounded-[20px] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.14)] flex-none ${className ?? ""}`}
    >
      <div className="relative w-full aspect-video overflow-hidden">
        <Image
          src={data.image}
          alt={data.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/25 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <button
          type="button"
          className="
          absolute top-3 right-3
          bg-white w-9 h-9 rounded-full shadow
          flex items-center justify-center text-gray-700
          hover:bg-red-50 hover:text-red-500 transition-colors
        "
          onClick={() => toggleFavorite(data)}
          aria-label="Yêu thích"
          aria-pressed={isSaved}
        >
          <span className={isSaved ? "text-red-500" : ""}>♥</span>
        </button>
      </div>

      <div className="p-5 flex flex-col gap-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-[18px] line-clamp-2 text-gray-900" title={data.title}>
            {data.title}
          </h3>

          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <span aria-hidden="true">📍</span>
            <span className="truncate">{data.location}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-gray-700 text-sm font-medium">
          <div className="flex items-center gap-2" title="Số phòng ngủ">
            <Image src="/icons/Bed-Icon.svg" alt="Giường" width={20} height={20} className="text-gray-500" />
            <span>{data.beds}</span>
          </div>

          <div className="flex items-center gap-2" title="Số phòng tắm">
            <Image src="/icons/Bath-Icon.svg" alt="Phòng tắm" width={18} height={18} className="text-gray-500" />
            <span>{data.baths}</span>
          </div>

          <div className="flex items-center gap-2" title="Internet">
            {data.wifi ? (
              <>
                <Image src="/icons/Wifi-Icon.svg" alt="Wifi miễn phí" width={18} height={18} />
                <span className="text-gray-700">Miễn phí</span>
              </>
            ) : (
              <>
                <Image src="/icons/Wifi-Icon.svg" alt="Không có Wifi" width={18} height={18} className="opacity-40 grayscale" />
                <span className="text-gray-700">Không</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-gray-700 ml-auto">
            <span>{data.area}</span>
          </div>
        </div>

        <hr className="border-dashed border-gray-200" />

        <div className="flex items-center justify-between">
          <p className="text-red-500 font-bold text-[18px]">
            {data.price} <span className="text-gray-500 text-sm font-normal">/ tháng</span>
          </p>
          <Link
            href={`/listings/${data.id}`}
            className="
            bg-blue-50 text-blue-600 
            px-4 py-1.5 rounded-[10px] text-sm font-medium
            hover:bg-blue-600 hover:text-white transition-all duration-300 active:scale-95
          "
          >
            Xem ngay
          </Link>
        </div>
      </div>
    </div>
  );
}

