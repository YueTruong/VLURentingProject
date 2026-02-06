"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import UserPageShell from "@/app/homepage/components/UserPageShell";
import {
  getApprovedPosts,
  getMySavedPostIds,
  unsavePost,
  type Post,
} from "@/app/services/posts";

type SavedItem = {
  id: number;
  title: string;
  location: string;
  image: string;
  price: string;
  updated: string;
  tags: string[];
};

const toNumber = (value: number | string | undefined | null) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatSavedPrice = (value: number | string | undefined | null) => {
  const raw = toNumber(value);
  if (!raw) return "0 triệu";
  const million = raw >= 100000 ? raw / 1_000_000 : raw;
  const rounded = Number.isInteger(million) ? million.toFixed(0) : million.toFixed(1);
  return `${rounded} triệu`;
};

const formatSavedUpdated = (value?: string | null) => {
  if (!value) return "Mới cập nhật";
  const updated = new Date(value);
  if (Number.isNaN(updated.getTime())) return "Mới cập nhật";

  const diffMs = Date.now() - updated.getTime();
  if (diffMs <= 0) return "Cập nhật hôm nay";

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Cập nhật hôm nay";
  if (days === 1) return "Cập nhật 1 ngày trước";
  return `Cập nhật ${days} ngày trước`;
};

const getAmenityTags = (post: Post) =>
  (post.amenities ?? [])
    .map((amenity) => amenity?.name?.trim())
    .filter((name): name is string => Boolean(name))
    .slice(0, 4);

const isApprovedPost = (status?: string | null) =>
  status?.toLowerCase() === "approved";

const mapPostToSavedItem = (post: Post): SavedItem => ({
  id: post.id,
  title: post.title,
  location: post.address || "Chưa cập nhật khu vực",
  image: post.images?.[0]?.image_url || "/images/House.svg",
  price: formatSavedPrice(post.price),
  updated: formatSavedUpdated(post.updatedAt ?? post.createdAt),
  tags: getAmenityTags(post),
});

function SavedCard({
  item,
  removing,
  onRemove,
}: {
  item: SavedItem;
  removing: boolean;
  onRemove: () => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col md:flex-row">
        <div className="relative h-48 w-full md:h-auto md:w-56">
          <Image src={item.image} alt={item.title} fill className="object-cover" />
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">{item.updated}</p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.location}</p>
          </div>

          {item.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-xs font-medium text-gray-700">
              {item.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-gray-100 px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-bold text-[#D51F35]">
              {item.price} <span className="text-sm font-medium text-gray-600">/ tháng</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/listings/${item.id}`}
                className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black active:scale-95"
              >
                Mở tin
              </Link>
              <button
                type="button"
                onClick={onRemove}
                disabled={removing}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removing ? "Đang xử lý..." : "Bỏ lưu"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SavedPage() {
  const { data: session, status } = useSession();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [removingIds, setRemovingIds] = useState<number[]>([]);
  const [clearingAll, setClearingAll] = useState(false);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (status !== "authenticated") {
        if (!active) return;
        setSavedItems([]);
        setLoading(false);
        setLoadError(false);
        setRemovingIds([]);
        setClearingAll(false);
        return;
      }

      const token = session?.user?.accessToken;
      if (!token) {
        if (!active) return;
        setSavedItems([]);
        setLoading(false);
        setLoadError(true);
        return;
      }

      if (!active) return;
      setLoading(true);
      setLoadError(false);

      try {
        const [posts, savedIds] = await Promise.all([
          getApprovedPosts(),
          getMySavedPostIds(token),
        ]);

        if (!active) return;

        const idSet = new Set(savedIds);
        const mapped = (posts ?? [])
          .filter((post) => isApprovedPost(post.status))
          .filter((post) => idSet.has(post.id))
          .map(mapPostToSavedItem);

        setSavedItems(mapped);
      } catch {
        if (!active) return;
        setLoadError(true);
        setSavedItems([]);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [session, status]);

  const token = session?.user?.accessToken;

  const handleRemove = async (postId: number) => {
    if (!token || removingIds.includes(postId)) return;

    setRemovingIds((prev) => [...prev, postId]);
    try {
      await unsavePost(postId, token);
      setSavedItems((prev) => prev.filter((item) => item.id !== postId));
    } catch {
      // Keep the current UI state if request fails.
    } finally {
      setRemovingIds((prev) => prev.filter((id) => id !== postId));
    }
  };

  const handleClearAll = async () => {
    if (!token || savedItems.length === 0 || clearingAll) return;

    setClearingAll(true);
    try {
      await Promise.all(savedItems.map((item) => unsavePost(item.id, token).catch(() => null)));
      setSavedItems([]);
    } finally {
      setClearingAll(false);
      setRemovingIds([]);
    }
  };

  const summaryText = useMemo(() => {
    if (loading) return "Đang tải danh sách tin đã lưu...";
    if (loadError) return "Không thể tải danh sách tin đã lưu từ hệ thống.";
    if (savedItems.length === 0) return "Bạn chưa lưu tin nào.";
    return `${savedItems.length} tin đang lưu`;
  }, [loadError, loading, savedItems.length]);

  return (
    <UserPageShell
      title="Tin đã lưu"
      description="Danh sách này được đồng bộ từ hệ thống, không còn dùng dữ liệu mẫu."
      actions={
        <Link
          href="/favorites"
          className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 active:scale-95"
        >
          Quay lại yêu thích
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-base font-semibold text-gray-900">{summaryText}</p>
            <p className="text-sm text-gray-600">
              Bạn có thể mở tin chi tiết hoặc bỏ lưu trực tiếp.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleClearAll}
              disabled={savedItems.length === 0 || clearingAll}
              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {clearingAll ? "Đang xóa..." : "Xóa tất cả"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 shadow-sm">
            Đang tải dữ liệu từ hệ thống...
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 shadow-sm">
            Không thể tải danh sách đã lưu. Vui lòng thử lại sau.
          </div>
        ) : savedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 shadow-sm">
            Chưa có tin nào trong danh sách đã lưu.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {savedItems.map((item) => (
              <SavedCard
                key={item.id}
                item={item}
                removing={removingIds.includes(item.id)}
                onRemove={() => handleRemove(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </UserPageShell>
  );
}