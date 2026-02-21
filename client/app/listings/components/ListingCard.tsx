"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Listing, formatArea, formatPrice } from "../data/listings";
import { toggleFavorite, useFavorites } from "@/app/services/favorites";

type ListingCardProps = {
  item: Listing;
};

export default function ListingCard({ item }: ListingCardProps) {
  const { data: session } = useSession();
  const userRole = session?.user?.role?.toLowerCase();
  
  // Lấy danh sách yêu thích hiện tại
  const favorites = useFavorites();
  const isSaved = favorites.some((fav) => fav.id === item.id);

  // Xử lý khi bấm nút Lưu tin
  const handleToggleFavorite = () => {
    if (!session) {
      toast.error("Vui lòng đăng nhập để lưu tin!", {
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      return;
    }

    // Do định dạng data của ListingCard khác với RoomCard, ta phải map nó về chuẩn RoomCardData để lưu chung
    const roomDataToSave = {
      id: item.id,
      title: item.title,
      image: item.image,
      location: item.location,
      beds: item.beds,
      baths: item.baths,
      wifi: item.wifi,
      area: formatArea(item.area), // Chuyển số thành chuỗi kèm 'm2'
      price: formatPrice(item.price), // Chuyển số thành chuỗi kèm 'triệu'
    };

    toggleFavorite(roomDataToSave);
    
    if (isSaved) {
      toast("Đã bỏ lưu tin", { icon: '💔' });
    } else {
      toast.success("Đã lưu tin thành công!");
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col md:flex-row">
        <div className="relative h-52 w-full md:h-auto md:w-64">
          <Image src={item.image} alt={item.title} fill className="object-cover" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-gray-700">{item.type}</span>
            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">{item.campus}</span>
          </div>
          
          {/* Nút thả tim góc ảnh trên Mobile (Tùy chọn hiển thị cho đẹp) */}
          {userRole !== 'landlord' && (
            <button
              onClick={handleToggleFavorite}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow transition-colors hover:bg-red-50 hover:text-red-500 md:hidden"
            >
              <span className={`text-lg leading-none ${isSaved ? "text-red-500" : ""}`}>
                {isSaved ? "♥" : "♡"}
              </span>
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <p className="text-xs uppercase tracking-wide text-gray-500">{item.updatedLabel}</p>
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{item.title}</h3>
              <p className="text-sm text-gray-600 truncate">{item.location}</p>
            </div>
            <div className="shrink-0 text-right hidden sm:block">
              <p className="text-xs text-gray-500">Đánh giá</p>
              <p className="text-sm font-semibold text-gray-900">
                {item.rating} ({item.reviews})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <Image src="/icons/Bed-Icon.svg" alt="Giường" width={20} height={20} className="icon-adapt-dark" />
              <span>{item.beds} giường</span>
            </div>
            <div className="flex items-center gap-2">
              <Image src="/icons/Bath-Icon.svg" alt="Phòng tắm" width={18} height={18} className="icon-adapt-dark" />
              <span>{item.baths} phòng tắm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Diện tích</span>
              <span>{formatArea(item.area)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Image src="/icons/Wifi-Icon.svg" alt="Wifi" width={18} height={18} className={`icon-adapt-dark ${item.wifi ? "" : "opacity-40"}`} />
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

          <div className="flex flex-wrap items-center justify-between gap-3 mt-auto pt-2">
            <div className="text-lg font-bold text-[#D51F35]">
              {formatPrice(item.price)} <span className="text-sm font-medium text-gray-600">/ tháng</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row w-full sm:w-auto">
              {/* NÚT LƯU TIN (Đã ẩn với Chủ trọ) */}
              {userRole !== 'landlord' && (
                <button 
                  onClick={handleToggleFavorite}
                  className={`w-full rounded-full border px-5 py-2 text-sm font-semibold transition-all active:scale-95 sm:w-auto ${
                    isSaved 
                      ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100" 
                      : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {isSaved ? "Đã lưu ♥" : "Lưu tin ♡"}
                </button>
              )}
              
              <Link
                href={`/listings/${item.id}`}
                className="w-full rounded-full bg-[#D51F35] px-6 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-[#b01628] active:scale-95 sm:w-auto"
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