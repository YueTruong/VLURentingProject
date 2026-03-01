"use client";

import { useEffect, useState } from "react";
import { getApprovedPosts, type Post } from "@/app/services/posts";
import SectionRow from "./SectionRow";
import type { RoomCardData } from "./RoomCard";

const toNumber = (value: number | string | undefined | null) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toPriceMillion = (value: number | string | undefined | null) => {
  const raw = toNumber(value);
  return raw >= 100000 ? raw / 1_000_000 : raw;
};

const formatPriceShort = (value: number | string | undefined | null) => {
  const price = toPriceMillion(value);
  if (!price) return "0";
  const rounded = Number.isInteger(price) ? price.toFixed(0) : price.toFixed(1);
  return `${rounded}tr`;
};

const formatAreaShort = (value: number | string | undefined | null) => {
  const area = toNumber(value);
  if (!area) return "0m2";
  const rounded = Number.isInteger(area) ? area.toFixed(0) : area.toFixed(1);
  return `${rounded}m2`;
};

const MIN_ITEMS_PER_SECTION = 4;

const getAmenityText = (post: Post) =>
  (post.amenities ?? [])
    .map((amenity) => amenity?.name ?? "")
    .join(" ")
    .toLowerCase();

const mapPostToRoom = (post: Post): RoomCardData => {
  const amenityText = getAmenityText(post);
  const image = post.images?.[0]?.image_url || "/images/House.svg";
  const maxPeople = toNumber(post.max_occupancy ?? 1);

  return {
    id: post.id,
    title: post.title,
    image,
    location: post.address || "Unknown",
    beds: Math.max(1, Math.round(maxPeople || 1)),
    baths: 1,
    wifi: amenityText.includes("wifi"),
    area: formatAreaShort(post.area),
    price: formatPriceShort(post.price),
  };
};

const parsePriceFromRoomCard = (priceText: string) => {
  const normalized = priceText.replace(/[^\d.,-]/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const isApprovedPost = (status?: string | null) => status?.toLowerCase() === "approved";
const padSectionItems = (filtered: RoomCardData[], allItems: RoomCardData[]) => {
  if (filtered.length >= MIN_ITEMS_PER_SECTION) {
    return filtered;
  }

  const selectedIds = new Set(filtered.map((item) => item.id));
  const supplementalItems = allItems.filter((item) => !selectedIds.has(item.id));

  return [...filtered, ...supplementalItems].slice(
    0,
    Math.min(MIN_ITEMS_PER_SECTION, allItems.length),
  );
};

const sections = [
  {
    id: "featured",
    title: "Khám phá phòng trọ nổi bật",
    subtitle: "Hơn 10,000 tin uy tín mới được cập nhật mỗi ngày",
  },
  {
    id: "near-campus",
    title: "Gần trường đại học",
    subtitle: "Lựa chọn thuận tiện di chuyển tới các cơ sở VLU",
  },
  {
    id: "student",
    title: "Giá sinh viên",
    subtitle: "Tối ưu ngân sách, vẫn đủ tiện nghi để học tập",
  },
  {
    id: "luxury",
    title: "Căn hộ cao cấp",
    subtitle: "Không gian rộng, tiện ích đầy đủ, bãi xe riêng",
  },
  {
    id: "recent",
    title: "Mới đăng gần đây",
    subtitle: "Tin vừa lên, xem sớm để giữ chỗ",
  },
];

export default function RoomListBody() {
  const [items, setItems] = useState<RoomCardData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    getApprovedPosts()
      .then((posts) => {
        if (!active) return;
        const approvedPosts = (posts ?? []).filter((post) => isApprovedPost(post.status));
        setItems(approvedPosts.map(mapPostToRoom));
        setLoadError(false);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        setLoadError(true);
      })
      .finally(() => {
        if (!active) return;
        setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const getItemsForSection = (sectionId: string, allItems: RoomCardData[]) => {
    let filtered = allItems;

    switch (sectionId) {
      case "student":
        filtered = allItems.filter((item) => parsePriceFromRoomCard(item.price) <= 4.5);
        break;
      case "luxury":
        filtered = allItems.filter((item) => parsePriceFromRoomCard(item.price) >= 6.0);
        break;
      case "recent":
        filtered = [...allItems].reverse();
        break;
      case "near-campus":
        filtered = allItems.filter((item) => {
          const normalizedLocation = normalizeText(item.location);
          return normalizedLocation.includes("go vap") || normalizedLocation.includes("binh thanh");
        });
        break;
      case "featured":
      default:
        filtered = allItems;
        break;
    }

    return padSectionItems(filtered.length > 0 ? filtered : allItems, allItems);
  };

  return (
    <section className="w-full bg-transparent py-10">
      <div className="w-full space-y-8 overflow-hidden px-4 md:px-6">
        
        {!loaded ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 px-4 text-center shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
            <span className="mb-4 animate-spin text-4xl text-gray-900 dark:text-white">⏳</span>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">Đang tải dữ liệu phòng...</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Vui lòng đợi trong giây lát.</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 px-4 text-center shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
            <span className="mb-4 text-4xl opacity-50">❌</span>
            <p className="text-lg font-semibold text-red-600 dark:text-red-400">Không thể tải danh sách phòng</p>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Hệ thống đang gặp sự cố. Vui lòng thử lại sau.</p>
            <button onClick={() => window.location.reload()} className="mt-4 text-sm font-semibold text-[#D51F35] underline hover:text-red-700 dark:text-red-400">Tải lại trang</button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 px-4 text-center shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-800">
            <span className="mb-4 text-5xl opacity-50">📂</span>
            <p className="text-lg font-bold text-gray-800 dark:text-white">Chưa có dữ liệu phòng</p>
            <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
              Hiện tại chưa có bài đăng nào được duyệt trên hệ thống.
            </p>
          </div>
        ) : (
          sections.map((section) => (
            <SectionRow
              key={section.id}
              title={section.title}
              subtitle={section.subtitle}
              items={getItemsForSection(section.id, items)}
            />
          ))
        )}
      </div>
    </section>
  );
}
