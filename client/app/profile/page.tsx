// app/profile/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import UserTopBar from "@/app/homepage/components/UserTopBar";
import { getMyPosts, getMySavedPostIds, savePost, unsavePost, type Post } from "@/app/services/posts";

type Listing = {
  id: number;
  title: string;
  location: string;
  price: string;
  image: string;
  category: string;
  area: string;
  beds: number;
  baths: number;
  wifi: boolean;
  updatedLabel: string;
  tags: string[];
};

type Review = {
  name: string;
  date: string;
  rating: number;
  content: string;
};

const toNumber = (value: number | string | undefined | null) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatPrice = (value: number | string | undefined | null) => {
  const raw = toNumber(value);
  if (!raw) return "0";
  const million = raw >= 100000 ? raw / 1_000_000 : raw;
  const rounded = Number.isInteger(million) ? million.toFixed(0) : million.toFixed(1);
  return `${rounded} triệu / tháng`;
};

const formatArea = (value: number | string | undefined | null) => {
  const raw = toNumber(value);
  if (!raw) return "0 m²";
  const rounded = Number.isInteger(raw) ? raw.toFixed(0) : raw.toFixed(1);
  return `${rounded} m²`;
};

const formatUpdatedLabel = (value?: string | null) => {
  if (!value) return "Mới cập nhật";
  const updatedDate = new Date(value);
  if (Number.isNaN(updatedDate.getTime())) return "Mới cập nhật";

  const diff = Date.now() - updatedDate.getTime();
  if (diff <= 0) return "Cập nhật hôm nay";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Cập nhật hôm nay";
  if (days === 1) return "Cập nhật 1 ngày trước";
  return `Cập nhật ${days} ngày trước`;
};

const getAmenityNames = (post: Post) =>
  (post.amenities ?? [])
    .map((amenity) => amenity?.name?.trim())
    .filter((name): name is string => Boolean(name));

const user = {
  name: "Nguyễn Văn A",
  role: "Chủ trọ đã xác minh",
  location: "TP. Hồ Chí Minh, Việt Nam",
  joined: "01/2026",
  avatar: "/images/Admins.png",
  bio:
    "Tôi chuyên hỗ trợ sinh viên Văn Lang tìm phòng phù hợp. Ưu tiên phản hồi nhanh, minh bạch hợp đồng và chăm sóc sau thuê.",
  verified: ["CCCD/CMND", "Số điện thoại", "Email", "Giấy tờ sở hữu"],
};

const stats = [
  { label: "Thời gian tham gia", value: "4 năm", icon: "calendar" },
  { label: "Tỉ lệ phản hồi", value: "98%", icon: "bolt" },
  { label: "Đánh giá", value: "4.9/5", icon: "star" },
  { label: "Hợp đồng thành công", value: "42", icon: "key" },
];

const reviews: Review[] = [
  {
    name: "Trần Minh",
    date: "01/2026",
    rating: 5,
    content:
      "Chủ trọ hỗ trợ nhiệt tình, phòng đúng như mô tả. Hợp đồng rõ ràng và phản hồi nhanh chóng.",
  },
  {
    name: "Lê Ngọc",
    date: "12/2025",
    rating: 4,
    content:
      "Khu vực yên tĩnh, phòng sạch sẽ. Hơi thiếu chỗ gửi xe nhưng nhìn chung rất ổn.",
  },
];

const navItems = [
  { label: "Hồ sơ", icon: "user", active: true },
];

const mapPostToListing = (post: Post): Listing => ({
  id: post.id,
  title: post.title,
  location: post.address || "Chưa cập nhật",
  price: formatPrice(post.price),
  image: post.images?.[0]?.image_url || "/images/House.svg",
  category: post.category?.name || "Phòng trọ",
  area: formatArea(post.area),
  beds: Math.max(1, Math.round(toNumber(post.max_occupancy ?? 1) || 1)),
  baths: 1,
  wifi: getAmenityNames(post).join(" ").toLowerCase().includes("wifi"),
  updatedLabel: formatUpdatedLabel(post.updatedAt ?? post.createdAt),
  tags: getAmenityNames(post).slice(0, 5),
});

const isApprovedPost = (status?: string | null) => status?.toLowerCase() === "approved";

function Icon({ name }: { name: string }) {
  switch (name) {
    case "search":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 20l-3.5-3.5" />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.8 7.6a4.8 4.8 0 00-8.3-3.2L12 5l-.5-.6a4.8 4.8 0 00-8.3 3.2c0 2.7 2.1 4.8 5.3 7.7L12 19l3.5-3.7c3.2-2.9 5.3-5 5.3-7.7z"
          />
        </svg>
      );
    case "chat":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a7 7 0 01-7 7H7l-4 3V5a3 3 0 013-3h8a7 7 0 017 7z" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 00-16 0" />
          <circle cx="12" cy="8" r="4" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3" />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V22a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H2a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H8a1.7 1.7 0 001-1.5V2a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V8c0 .7.4 1.3 1 1.5H22a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"
          />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v4M16 3v4M3 10h18" />
        </svg>
      );
    case "bolt":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h7l-1 8 12-16h-7l-1-4z" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l2.6 5.3 5.9.9-4.3 4.2 1 5.9L12 16.8 6.8 19.3l1-5.9-4.3-4.2 5.9-.9L12 3z" />
        </svg>
      );
    case "key":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="7" cy="12" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 12h11l-2 2m-2 2l-2-2" />
        </svg>
      );
    case "check":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      );
    case "share":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="18" cy="5" r="2" />
          <circle cx="6" cy="12" r="2" />
          <circle cx="18" cy="19" r="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l8-6M8 12l8 6" />
        </svg>
      );
    case "mail":
      return (
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6" />
        </svg>
      );
    default:
      return null;
  }
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--brand-primary-soft)] text-[color:var(--brand-primary-text)]">
          <Icon name={icon} />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function ListingCard({
  id,
  title,
  location,
  price,
  image,
  category,
  area,
  beds,
  baths,
  wifi,
  updatedLabel,
  tags,
  isSaved,
  savePending,
  onToggleSave,
}: Listing & {
  isSaved: boolean;
  savePending: boolean;
  onToggleSave: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col md:flex-row">
        <div className="relative h-44 w-full shrink-0 md:h-auto md:w-52">
          <Image src={image} alt={title} fill className="object-cover" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-gray-800">
              {category}
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{updatedLabel}</p>
          <div className="mt-1 text-base font-semibold text-gray-900 md:text-lg">{title}</div>
          <div className="mt-1 text-sm text-gray-500">{location}</div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-700">
            <span className="inline-flex items-center gap-1.5">
              <Image src="/icons/Bed-Icon.svg" alt="Giường" width={14} height={14} />
              {beds} giường
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Image src="/icons/Bath-Icon.svg" alt="Phòng tắm" width={14} height={14} />
              {baths} phòng tắm
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-xs">Diện tích</span>
              {area}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Image
                src="/icons/Wifi-Icon.svg"
                alt={wifi ? "Có Wi-Fi" : "Không Wi-Fi"}
                width={14}
                height={14}
                className={wifi ? "" : "opacity-40 grayscale"}
              />
              {wifi ? "Có Wi-Fi" : "Không Wi-Fi"}
            </span>
          </div>

          {tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-lg font-bold text-[color:var(--brand-accent)]">{price}</span>
            <div className="flex items-center gap-2">
              <Link
                href={`/listings/${id}`}
                className="rounded-full bg-[color:var(--brand-accent)] px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-[color:var(--brand-accent-strong)]"
              >
                Xem chi tiết
              </Link>
              <button
                type="button"
                onClick={onToggleSave}
                disabled={savePending}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                  isSaved
                    ? "border-[color:var(--brand-accent)] bg-[color:var(--brand-accent-soft)] text-[color:var(--brand-accent)]"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                } ${savePending ? "cursor-not-allowed opacity-60" : ""}`}
              >
                {savePending ? "Đang lưu..." : isSaved ? "Đã lưu" : "Lưu tin"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ name, date, rating, content }: Review) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-900">{name}</div>
          <div className="text-xs text-gray-500">Đánh giá vào {date}</div>
        </div>
        <div className="flex items-center gap-1 text-[#F59E0B]">
          {Array.from({ length: 5 }).map((_, idx) => (
            <span key={idx} className={idx < rating ? "opacity-100" : "opacity-30"}>
              ★
            </span>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-gray-600">“{content}”</p>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [listingError, setListingError] = useState(false);
  const [listingSearch, setListingSearch] = useState("");
  const [savedPostIds, setSavedPostIds] = useState<number[]>([]);
  const [savingPostIds, setSavingPostIds] = useState<number[]>([]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (status !== "authenticated") {
        if (!active) return;
        setUserListings([]);
        setSavedPostIds([]);
        setSavingPostIds([]);
        setListingError(false);
        setLoadingListings(false);
        return;
      }

      const token = session?.user?.accessToken;
      if (!token) {
        if (!active) return;
        setListingError(true);
        setLoadingListings(false);
        setUserListings([]);
        setSavedPostIds([]);
        setSavingPostIds([]);
        return;
      }

      if (!active) return;
      setLoadingListings(true);
      setListingError(false);

      try {
        const [raw, savedIds] = await Promise.all([
          getMyPosts(token),
          getMySavedPostIds(token).catch(() => [] as number[]),
        ]);
        const posts = Array.isArray(raw) ? raw : [];
        if (!active) return;
        const mapped = posts
          .filter((post) => isApprovedPost(post.status))
          .map(mapPostToListing);
        setUserListings(mapped);
        setSavedPostIds(savedIds);
      } catch {
        if (!active) return;
        setListingError(true);
        setUserListings([]);
        setSavedPostIds([]);
      } finally {
        if (!active) return;
        setLoadingListings(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [session, status]);

  const handleToggleSave = async (postId: number) => {
    const token = session?.user?.accessToken;
    if (!token || savingPostIds.includes(postId)) return;

    const currentlySaved = savedPostIds.includes(postId);
    setSavingPostIds((prev) => [...prev, postId]);

    try {
      if (currentlySaved) {
        await unsavePost(postId, token);
        setSavedPostIds((prev) => prev.filter((id) => id !== postId));
      } else {
        await savePost(postId, token);
        setSavedPostIds((prev) => (prev.includes(postId) ? prev : [postId, ...prev]));
      }
    } catch {
      // Keep UI state unchanged if save request fails.
    } finally {
      setSavingPostIds((prev) => prev.filter((id) => id !== postId));
    }
  };

  const filteredUserListings = useMemo(() => {
    const keyword = listingSearch.trim().toLowerCase();
    if (!keyword) return userListings;

    return userListings.filter((listing) => {
      const lookup = [
        listing.title,
        listing.location,
        listing.category,
        listing.area,
        ...listing.tags,
      ]
        .join(" ")
        .toLowerCase();
      return lookup.includes(keyword);
    });
  }, [listingSearch, userListings]);

  const listingSummary = useMemo(() => {
    if (loadingListings) return "Đang tải danh sách...";
    if (listingError) return "Không thể tải danh sách từ hệ thống.";
    if (userListings.length === 0) return "Chưa có tin cho thuê.";
    if (listingSearch.trim().length > 0) {
      if (filteredUserListings.length === 0) return `Không tìm thấy tin phù hợp với "${listingSearch.trim()}".`;
      return `Tìm thấy ${filteredUserListings.length}/${userListings.length} tin phù hợp.`;
    }
    return `Đang hiển thị ${userListings.length} tin nổi bật.`;
  }, [filteredUserListings.length, listingError, listingSearch, loadingListings, userListings.length]);

  return (
    <div className="relative min-h-screen bg-gray-50 text-gray-900">
      <UserTopBar />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(213,31,53,0.18), transparent 45%), radial-gradient(circle at 80% 0%, rgba(1,4,51,0.18), transparent 55%)",
        }}
      />

      <div className="relative mx-auto flex w-full gap-6 px-4 py-10 md:px-6 lg:px-10 xl:px-14 2xl:px-20">
        <aside className="hidden w-64 flex-shrink-0 lg:flex">
          <div className="sticky top-8 flex h-fit w-full flex-col rounded-3xl bg-[#010433] px-6 py-8 text-white shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                <Icon name="user" />
              </div>
              <div>
                <div className="text-sm font-semibold">VLU Renting</div>
                <div className="text-xs text-white/60">Bảng điều khiển</div>
              </div>
            </div>

            <div className="mt-8 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    item.active ? "bg-white/15" : "text-white/70 hover:bg-white/10"
                  }`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.active ? "bg-white/15" : "bg-white/5"}`}>
                    <Icon name={item.icon} />
                  </span>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-wide text-white/50">Tài khoản</div>
              <div className="mt-2 text-sm font-semibold">{user.name}</div>
              <div className="text-xs text-white/60">Tham gia {user.joined}</div>
              <button className="mt-3 w-full rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white">
                Quản lý tài khoản
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 10% 10%, rgba(213,31,53,0.12), transparent 45%), radial-gradient(circle at 85% 20%, rgba(1,4,51,0.08), transparent 45%)",
              }}
            />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-gray-200">
                  <Image src={user.avatar} alt={user.name} fill className="object-cover" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold text-gray-900">{user.name}</h1>
                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-600">
                      {user.role}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                    <span className="inline-flex h-2 w-2 rounded-full bg-[color:var(--brand-accent)]" />
                    {user.location}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[color:var(--brand-primary-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-primary-text)]">
                      ID đã xác minh
                    </span>
                    <span className="rounded-full bg-[color:var(--brand-primary-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--brand-primary-text)]">
                      SĐT đã xác minh
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  <Icon name="share" />
                  Chia sẻ
                </button>
                <button
                  onClick={() => router.push("/chat")}
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--brand-accent-strong)]"
                >
                  <Icon name="mail" />
                  Liên hệ chủ trọ
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--brand-accent-soft)] text-[color:var(--brand-accent)]">
                    <Icon name="user" />
                  </span>
                  Về {user.name.split(" ").slice(-1)}
                </div>
                <p className="mt-3 text-sm text-gray-600">{user.bio}</p>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Hỗ trợ tiếng Việt, tiếng Anh
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Phản hồi trong vòng 1 giờ
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--brand-primary-soft)] text-[color:var(--brand-primary-text)]">
                    <Icon name="check" />
                  </span>
                  Thông tin đã xác minh
                </div>
                <div className="mt-4 space-y-3">
                  {user.verified.map((item) => (
                    <div key={item} className="flex items-center justify-between text-sm text-gray-600">
                      <span>{item}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-600">
                        <Icon name="check" />
                        Đã kiểm tra
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Danh sách phòng đang cho thuê</h2>
                  <p className="text-sm text-gray-500">{listingSummary}</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Icon name="search" />
                  </span>
                  <input
                    type="text"
                    value={listingSearch}
                    onChange={(event) => setListingSearch(event.target.value)}
                    placeholder="Tìm theo tiêu đề, khu vực..."
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-3 text-sm text-gray-700 outline-none transition focus:border-[color:var(--brand-accent)]"
                  />
                </div>
              </div>

              {loadingListings ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 shadow-sm">
                  Đang tải dữ liệu từ hệ thống...
                </div>
              ) : listingError ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 shadow-sm">
                  Không thể tải danh sách phòng. Vui lòng thử lại sau.
                </div>
              ) : userListings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 shadow-sm">
                  Người dùng này chưa có tin cho thuê nào.
                </div>
              ) : filteredUserListings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600 shadow-sm">
                  Không tìm thấy tin phù hợp với từ khóa hiện tại.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredUserListings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      {...listing}
                      isSaved={savedPostIds.includes(listing.id)}
                      savePending={savingPostIds.includes(listing.id)}
                      onToggleSave={() => handleToggleSave(listing.id)}
                    />
                  ))}
                </div>
              )}

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Đánh giá & nhận xét</h3>
                    <p className="text-sm text-gray-500">Tổng điểm 4.9 • {reviews.length} đánh giá gần nhất</p>
                  </div>
                  <div className="flex items-center gap-2 text-[#F59E0B]">
                    <span className="text-2xl font-semibold text-gray-900">4.9</span>
                    <span className="text-sm text-gray-500">/ 5</span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <span key={idx}>★</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {reviews.map((review) => (
                    <ReviewCard key={review.name} {...review} />
                  ))}
                </div>

                <button className="mt-4 w-full rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Xem thêm đánh giá
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
