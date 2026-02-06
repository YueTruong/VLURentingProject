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

const isApprovedPost = (status?: string | null) => {
  if (!status) return true;
  return status.toLowerCase() === "approved";
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

  return (
    <section className="min-h-screen w-full bg-gray-50 py-10">
      <div className="w-full space-y-8 overflow-hidden px-4 md:px-6">
        {!loaded ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 shadow-sm">
            Đang tải dữ liệu phòng từ hệ thống...
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 shadow-sm">
            Không thể tải danh sách phòng từ hệ thống.
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 shadow-sm">
            Chưa có dữ liệu phòng được duyệt.
          </div>
        ) : (
          sections.map((section) => (
            <SectionRow
              key={section.id}
              title={section.title}
              subtitle={section.subtitle}
              items={items}
            />
          ))
        )}
      </div>
    </section>
  );
}
