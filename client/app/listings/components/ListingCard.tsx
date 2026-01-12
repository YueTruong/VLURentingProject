"use client";

import Image from "next/image";
import Link from "next/link";
import { Listing, formatArea, formatPrice } from "../data/listings";

type ListingCardProps = {
  item: Listing;
};

export default function ListingCard({ item }: ListingCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col md:flex-row">
        <div className="relative h-52 w-full md:h-auto md:w-64">
          <Image src={item.image} alt={item.title} fill className="object-cover" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-gray-700">{item.type}</span>
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{item.campus}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="text-xs uppercase tracking-wide text-gray-500">{item.updatedLabel}</p>
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
              <p className="text-sm text-gray-600 truncate">{item.location}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-gray-500">Đánh giá</p>
              <p className="text-sm font-semibold text-gray-900">
                {item.rating} ({item.reviews})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <Image src="/icons/Bed-Icon.svg" alt="Giường" width={20} height={20} />
              <span>{item.beds} giường</span>
            </div>
            <div className="flex items-center gap-2">
              <Image src="/icons/Bath-Icon.svg" alt="Phòng tắm" width={18} height={18} />
              <span>{item.baths} phòng tắm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase text-gray-500">Diện tích</span>
              <span>{formatArea(item.area)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Image src="/icons/Wifi-Icon.svg" alt="Wifi" width={18} height={18} className={item.wifi ? "" : "opacity-40"} />
              <span>{item.wifi ? "Wi-Fi" : "Không Wi-Fi"}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-700">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-gray-100 px-3 py-1">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-bold text-[#D51F35]">
              {formatPrice(item.price)} <span className="text-sm font-medium text-gray-600">/ tháng</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href={`/listings/${item.id}`}
                className="w-full rounded-full bg-[#D51F35] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-[#b01628] active:scale-95 sm:w-auto"
              >
                Xem chi tiết
              </Link>
              <button className="w-full rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 active:scale-95 sm:w-auto">
                Lưu tin
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
