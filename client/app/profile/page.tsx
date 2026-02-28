"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import UserPageShell from "@/app/homepage/components/UserPageShell"; 
import { getMyPosts, type Post } from "@/app/services/posts"; 
import { getFavoriteScope, useFavoritesByScope, toggleFavorite } from "@/app/services/favorites"; 
import toast from "react-hot-toast";
import { getMyProfile, updateMyProfile } from "@/app/services/auth";

type Listing = {
  id: number;
  title: string;
  location: string;
  price: string;
  priceValue: number;
  image: string;
  category: string;
  area: string;
  areaValue: number;
  beds: number;
  baths: number;
  wifi: boolean;
  updatedLabel: string;
  createdAtValue: number;
  tags: string[];
};

type ChatProfilePreview = {
  id: number;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  phone_number?: string;
  role?: string;
  isOnline?: boolean;
  savedAt?: string;
};

const CHAT_PROFILE_PREVIEW_KEY = "vlu.chat.profile.preview";

const safeParseChatProfilePreview = (raw: string | null): ChatProfilePreview | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ChatProfilePreview>;
    if (typeof parsed.id !== "number") return null;

    return {
      id: parsed.id,
      email: typeof parsed.email === "string" ? parsed.email : "",
      full_name: typeof parsed.full_name === "string" ? parsed.full_name : "",
      avatar_url: typeof parsed.avatar_url === "string" ? parsed.avatar_url : "",
      phone_number: typeof parsed.phone_number === "string" ? parsed.phone_number : "",
      role: typeof parsed.role === "string" ? parsed.role : "Người dùng",
      isOnline: Boolean(parsed.isOnline),
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
    };
  } catch {
    return null;
  }
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
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Cập nhật hôm nay";
  if (days === 1) return "Cập nhật 1 ngày trước";
  return `Cập nhật ${days} ngày trước`;
};

const formatMonthYear = (timestamp?: number | null) => {
  if (!timestamp || !Number.isFinite(timestamp)) return "--/--";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "--/--";
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
};

const getAmenityNames = (post: Post) =>
  (post.amenities ?? []).map((amenity) => amenity?.name?.trim()).filter(Boolean) as string[];

const mapPostToListing = (post: Post): Listing => ({
  id: post.id,
  title: post.title,
  location: post.address || "Chưa cập nhật",
  price: formatPrice(post.price),
  priceValue: toNumber(post.price),
  image: post.images?.[0]?.image_url || "/images/House.svg",
  category: post.category?.name || "Phòng trọ",
  area: formatArea(post.area),
  areaValue: toNumber(post.area),
  beds: Math.max(1, Math.round(toNumber(post.max_occupancy ?? 1) || 1)),
  baths: 1,
  wifi: getAmenityNames(post).join(" ").toLowerCase().includes("wifi"),
  updatedLabel: formatUpdatedLabel(post.updatedAt ?? post.createdAt),
  createdAtValue: new Date(post.createdAt ?? post.updatedAt ?? Date.now()).getTime(),
  tags: getAmenityNames(post).slice(0, 5),
});

const isApprovedPost = (status?: string | null) => status?.toLowerCase() === "approved";

function Icon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    search: <path strokeLinecap="round" strokeLinejoin="round" d="M20 20l-3.5-3.5M11 18a7 7 0 100-14 7 7 0 000 14z" />,
    heart: <path strokeLinecap="round" strokeLinejoin="round" d="M20.8 7.6a4.8 4.8 0 00-8.3-3.2L12 5l-.5-.6a4.8 4.8 0 00-8.3 3.2c0 2.7 2.1 4.8 5.3 7.7L12 19l3.5-3.7c3.2-2.9 5.3-5 5.3-7.7z" />,
    chat: <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a7 7 0 01-7 7H7l-4 3V5a3 3 0 013-3h8a7 7 0 017 7z" />,
    user: <path strokeLinecap="round" strokeLinejoin="round" d="M20 21a8 8 0 00-16 0M12 12a4 4 0 100-8 4 4 0 000 8z" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v4M16 3v4M3 10h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />,
    bolt: <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h7l-1 8 12-16h-7l-1-4z" />,
    key: <path strokeLinecap="round" strokeLinejoin="round" d="M10 12h11l-2 2m-2 2l-2-2M7 15a3 3 0 100-6 3 3 0 000 6z" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />,
    share: <path strokeLinecap="round" strokeLinejoin="round" d="M8 12l8-6M8 12l8 6M18 5a2 2 0 110-4 2 2 0 010 4zM6 14a2 2 0 110-4 2 2 0 010 4zM18 23a2 2 0 110-4 2 2 0 010 4z" />,
    mail: <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" />,
  };
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">{icons[name]}</svg>;
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-4 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-(--theme-text-subtle) dark:text-(--theme-text-subtle)">{label}</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <Icon name={icon} />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold text-(--theme-text) dark:text-white">{value}</div>
    </div>
  );
}

function ListingCard({
  listing,
  isSaved,
  onToggleSave,
  canSave,
}: {
  listing: Listing;
  isSaved: boolean;
  onToggleSave: () => void;
  canSave: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-(--theme-border) bg-(--theme-surface) shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col md:flex-row">
        <div className="relative h-44 w-full shrink-0 md:h-auto md:w-52">
          <Image src={listing.image} alt={listing.title} fill sizes="(max-width: 768px) 100vw, 208px" className="object-cover" />
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-(--theme-surface)/90 px-2.5 py-1 text-[11px] font-semibold text-(--theme-text) backdrop-blur-sm dark:bg-gray-900/80 dark:text-gray-200">
              {listing.category}
            </span>
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-(--theme-text-subtle) dark:text-(--theme-text-subtle)">{listing.updatedLabel}</p>
          <div className="mt-1 text-base font-semibold text-(--theme-text) dark:text-white md:text-lg line-clamp-1">{listing.title}</div>
          <div className="mt-1 text-sm text-(--theme-text-subtle) dark:text-(--theme-text-subtle) truncate">{listing.location}</div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-(--theme-text-muted) dark:text-gray-300">
            <span className="inline-flex items-center gap-1.5"><Image src="/icons/Bed-Icon.svg" alt="Giường" width={14} height={14} className="dark:invert opacity-80" />{listing.beds} giường</span>
            <span className="inline-flex items-center gap-1.5"><Image src="/icons/Bath-Icon.svg" alt="Phòng tắm" width={14} height={14} className="dark:invert opacity-80" />{listing.baths} phòng</span>
            <span className="inline-flex items-center gap-1.5"><span className="text-xs">DT</span>{listing.area}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-lg font-bold text-(--brand-accent) dark:text-red-400">{listing.price}</span>
            <div className="flex items-center gap-2">
              <Link href={`/listings/${listing.id}`} className="rounded-full bg-(--brand-accent) px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-(--brand-accent-strong) dark:hover:bg-red-700">
                Xem chi tiết
              </Link>
              {canSave ? (
                <button
                  type="button"
                  onClick={onToggleSave}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition active:scale-95 ${
                    isSaved
                      ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/30 dark:text-red-400"
                      : "border-(--theme-border) text-(--theme-text-muted) hover:bg-(--theme-surface-muted) dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  {isSaved ? "Đã lưu ♥" : "Lưu tin ♡"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [fetchedListings, setFetchedListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);
  const [listingError, setListingError] = useState(false);
  
  const [listingSearch, setListingSearch] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [chatPreviewProfile, setChatPreviewProfile] = useState<ChatProfilePreview | null>(null);
  const [chatPreviewResolved, setChatPreviewResolved] = useState(false);
  const favoriteScope = getFavoriteScope(session?.user?.id);
  const favorites = useFavoritesByScope(favoriteScope); 

  const chatProfileId = useMemo(() => {
    const raw = searchParams.get("chatUserId");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  const isChatPreviewMode = chatProfileId !== null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!isChatPreviewMode || chatProfileId === null) {
        setChatPreviewProfile(null);
        setChatPreviewResolved(true);
        return;
      }

      const stored = safeParseChatProfilePreview(window.sessionStorage.getItem(CHAT_PROFILE_PREVIEW_KEY));
      setChatPreviewProfile(stored && stored.id === chatProfileId ? stored : null);
      setChatPreviewResolved(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [chatProfileId, isChatPreviewMode]);

  const roleKey = session?.user?.role?.toString().toLowerCase() || "student";
  const isStudent = roleKey === "student";
  const isLandlord = roleKey === "landlord";
  const isAdmin = roleKey === "admin";
  const roleBadgeClassName =
    roleKey === "landlord"
      ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      : roleKey === "admin"
        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400";

  const displayName = useMemo(() => {
    const rawFullName = (session?.user as { full_name?: string })?.full_name;
    const sessionName = session?.user?.name;
    const email = session?.user?.email || "";

    if (rawFullName && rawFullName.trim() !== "") return rawFullName;
    if (sessionName && !sessionName.includes("@")) return sessionName;
    if (email) return email.split("@")[0]; 
    return "Người dùng";
  }, [session]);

  const avatarUrl = session?.user?.image || "/images/Admins.png";

  useEffect(() => {
    const token = session?.user?.accessToken;
    if (!token || status !== "authenticated") return;

    let active = true;
    getMyProfile(token)
      .then((profile) => {
        if (!active) return;
        setProfilePhone(profile.phone_number || "");
        setProfileAddress(profile.address || "");
      })
      .catch(() => {
        if (!active) return;
      });

    return () => {
      active = false;
    };
  }, [session, status]);

  useEffect(() => {
    let active = true;

    // ✅ Bọc logic vào một async function để tránh lỗi "synchronous setState" của ESLint
    const loadData = async () => {
      if (status !== "authenticated" || !isLandlord) {
        if (active) setLoadingListings(false);
        return;
      }

      const token = session?.user?.accessToken;
      if (!token) return;

      if (active) setLoadingListings(true);

      try {
        const raw = await getMyPosts(token);
        if (!active) return;
        const posts = Array.isArray(raw) ? raw : [];
        setFetchedListings(posts.filter((p) => isApprovedPost(p.status)).map(mapPostToListing));
      } catch {
        if (active) setListingError(true);
      } finally {
        if (active) setLoadingListings(false);
      }
    };

    loadData();

    return () => { active = false; };
  }, [session, status, isLandlord]);

  const handleSaveProfile = async () => {
    const token = session?.user?.accessToken;
    if (!token) return;

    setSavingProfile(true);
    try {
      await updateMyProfile(token, {
        phoneNumber: profilePhone,
        address: profileAddress,
      });
      toast.success("Cập nhật hồ sơ thành công");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể cập nhật hồ sơ";
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const studentListings: Listing[] = useMemo(() => {
    return favorites.map((fav) => ({
      id: fav.id,
      title: fav.title,
      location: fav.location,
      price: fav.price,
      priceValue: parseFloat(fav.price) || 0,
      image: fav.image,
      category: "Phòng trọ",
      area: fav.area,
      areaValue: parseFloat(fav.area) || 0,
      beds: fav.beds,
      baths: fav.baths,
      wifi: fav.wifi,
      updatedLabel: "Đã lưu trong máy",
      createdAtValue: 0, 
      tags: [],
    }));
  }, [favorites]);

  const activeListings = useMemo(() => {
    if (isStudent) return studentListings;
    if (isLandlord) return fetchedListings;
    return [];
  }, [fetchedListings, isLandlord, isStudent, studentListings]);

  const filteredListings = useMemo(() => {
    const keyword = listingSearch.trim().toLowerCase();
    if (!keyword) return activeListings;
    return activeListings.filter((l) =>
      [l.title, l.location, l.category].join(" ").toLowerCase().includes(keyword)
    );
  }, [listingSearch, activeListings]);

  const handleToggleSave = (listing: Listing) => {
    if (!isStudent) return;
    const roomData = {
      id: listing.id,
      title: listing.title,
      image: listing.image,
      location: listing.location,
      beds: listing.beds,
      baths: listing.baths,
      wifi: listing.wifi,
      area: listing.area,
      price: listing.price,
    };
    toggleFavorite(roomData, favoriteScope);
    if (favorites.some((f) => f.id === listing.id)) {
      toast("Đã bỏ lưu tin", { icon: "💔" });
    } else {
      toast.success("Đã lưu tin thành công!");
    }
  };

  const profileStats = useMemo(() => {
    const total = activeListings.length;
    const avgPrice = total > 0 ? activeListings.reduce((s, l) => s + l.priceValue, 0) / total : 0;
    const avgArea = total > 0 ? activeListings.reduce((s, l) => s + l.areaValue, 0) / total : 0;
    
    const stats = [];
    if (isLandlord) {
      stats.push({ label: "Phòng đã đăng", value: String(total), icon: "calendar" });
    }
    stats.push({ label: "Đã yêu thích", value: String(favorites.length), icon: "heart" });

    if (isLandlord) {
      stats.push({ label: "Giá trung bình", value: total > 0 ? formatPrice(avgPrice) : "--", icon: "bolt" });
      stats.push({ label: "Diện tích TB", value: total > 0 ? formatArea(avgArea) : "--", icon: "key" });
    }
    return stats;
  }, [activeListings, favorites.length, isLandlord]);

  const verifiedItems = [
    session?.user?.email ? "Email" : null,
    displayName !== "Người dùng" ? "Họ tên" : null,
    session?.user?.image ? "Ảnh đại diện" : null,
  ].filter(Boolean) as string[];

  const listingLocation = fetchedListings.length > 0 ? fetchedListings[0].location : "Chưa cập nhật khu vực";
  
  const joinedLabel = useMemo(() => {
    if (fetchedListings.length === 0) return "--/--";
    const firstCreatedAt = Math.min(...fetchedListings.map((item) => item.createdAtValue));
    return formatMonthYear(firstCreatedAt);
  }, [fetchedListings]);

  const profileBio = useMemo(() => {
    if (isStudent) return "Hồ sơ cá nhân của sinh viên. Chúc bạn tìm được phòng trọ ưng ý tại VLU Renting.";
    if (isAdmin) return "Tài khoản quản trị: theo dõi hệ thống và truy cập các công cụ điều hành từ trang quản trị.";
    if (fetchedListings.length === 0) return "Hiện chưa có tin cho thuê được duyệt trên hệ thống.";
    return `Hiện đang có ${fetchedListings.length} tin cho thuê đã được duyệt và hiển thị công khai.`;
  }, [fetchedListings.length, isStudent, isAdmin]);

  const listingSummary = useMemo(() => {
    if (isStudent) return "Hãy dạo một vòng trang chủ để tìm và lưu các phòng bạn yêu thích nhé.";
    if (isAdmin) return "Quản trị viên không có danh sách phòng cá nhân trong mục này.";
    if (loadingListings) return "Đang tải danh sách...";
    if (listingError) return "Không thể tải danh sách từ hệ thống.";
    if (activeListings.length === 0) return "Chưa có tin cho thuê.";
    if (listingSearch.trim().length > 0) {
      if (filteredListings.length === 0) return `Không tìm thấy tin phù hợp với "${listingSearch.trim()}".`;
      return `Tìm thấy ${filteredListings.length}/${activeListings.length} tin phù hợp.`;
    }
    return `Đang hiển thị ${activeListings.length} tin nổi bật.`;
  }, [filteredListings.length, listingError, listingSearch, loadingListings, activeListings.length, isStudent, isAdmin]);

  if (isChatPreviewMode) {
    const previewName =
      chatPreviewProfile?.full_name?.trim() || (chatProfileId !== null ? `Người dùng #${chatProfileId}` : "Người dùng");
    const previewRole = chatPreviewProfile?.role?.trim() || "Người dùng";
    const previewAvatar = chatPreviewProfile?.avatar_url?.trim() || "";
    const previewEmail = chatPreviewProfile?.email?.trim() || "Đang cập nhật...";
    const previewPhone = chatPreviewProfile?.phone_number?.trim() || "Chưa cập nhật";
    const previewOnline = Boolean(chatPreviewProfile?.isOnline);
    const isLandlordPreview = previewRole.toLowerCase().includes("trọ");

    return (
      <UserPageShell
        title="Hồ sơ người dùng"
        description="Xem thông tin tài khoản của người bạn đang trò chuyện."
      >
        <div className="space-y-6 lg:space-y-8">
          <section className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
            {chatPreviewResolved ? (
              chatPreviewProfile ? (
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-5">
                    <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-gray-50 bg-gray-100 shadow-sm dark:border-gray-800 dark:bg-gray-800">
                      {previewAvatar ? (
                        <Image src={previewAvatar} alt={previewName} fill className="object-cover" unoptimized />
                      ) : (
                        <span className="text-2xl font-bold text-gray-500 dark:text-gray-300">
                          {previewName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{previewName}</h1>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            isLandlordPreview
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                          }`}
                        >
                          {previewRole}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className={`inline-flex h-2 w-2 rounded-full ${previewOnline ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {previewOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => router.push("/chat")}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#d51f35] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#b01628] active:scale-95"
                    >
                      <Icon name="chat" />
                      Quay lại chat
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
                  Không tìm thấy dữ liệu hồ sơ từ cuộc trò chuyện. Hãy mở lại từ nút thông tin trong trang chat.
                </div>
              )
            ) : (
              <div className="space-y-3">
                <div className="h-7 w-48 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                <div className="h-4 w-32 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                <div className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
              </div>
            )}
          </section>

          {chatPreviewResolved && chatPreviewProfile ? (
            <section className="grid gap-6 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      <Icon name="user" />
                    </span>
                    Thông tin liên hệ
                  </div>
                  <div className="mt-4 space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</div>
                      <div className="mt-1 break-all text-sm text-gray-900 dark:text-white">{previewEmail}</div>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Số điện thoại</div>
                      <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{previewPhone}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 lg:col-span-8">
                <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chế độ xem từ chat</h2>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Đây là hồ sơ cơ bản của người dùng bạn đang trò chuyện. Dữ liệu chi tiết khác (như thống kê/tin đăng) chưa được kết nối trong chế độ xem này.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => router.push("/chat")}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Icon name="chat" />
                      Quay lại cuộc trò chuyện
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/profile")}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Icon name="user" />
                      Về hồ sơ của tôi
                    </button>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </UserPageShell>
    );
  }

  return (
    <UserPageShell
      title="Hồ sơ cá nhân"
      description={isStudent ? "Xem thông tin tài khoản và danh sách các phòng trọ bạn đã lưu." : isLandlord ? "Bảng điều khiển quản lý và thống kê các phòng trọ của bạn." : "Thông tin hồ sơ và truy cập nhanh các chức năng quản trị."}
    >
      <div className="space-y-6 lg:space-y-8">
        
        {/* HEADER CÁ NHÂN */}
        <section className="relative overflow-hidden rounded-3xl border border-(--theme-border) bg-(--theme-surface) p-6 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-5">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-gray-50 shadow-sm dark:border-gray-800">
                <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{displayName}</h1>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleBadgeClassName}`}>
                    {roleKey === "landlord" ? "Chủ trọ" : roleKey === "admin" ? "Admin" : "Sinh viên"}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-(--theme-text-subtle) dark:text-(--theme-text-subtle)">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  Đang hoạt động
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {verifiedItems.length > 0 ? (
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600 dark:border-blue-900/50 dark:bg-blue-900/30 dark:text-blue-400">
                      Đã xác minh
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-xl border border-(--theme-border) bg-(--theme-surface) px-4 py-2 text-sm font-semibold text-(--theme-text-muted) shadow-sm transition-colors hover:bg-(--theme-surface-muted) dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                <Icon name="share" />
                Chia sẻ
              </button>
              <button onClick={() => router.push("/chat")} className="inline-flex items-center gap-2 rounded-xl bg-(--brand-accent) px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-(--brand-accent-strong) active:scale-95">
                <Icon name="chat" />
                Hộp thư
              </button>
            </div>
          </div>
        </section>

        {/* THỐNG KÊ */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {profileStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>

        {/* CỘT THÔNG TIN CHUNG & DANH SÁCH LISTING */}
        <section className="grid gap-6 lg:grid-cols-12">
          
          <div className="space-y-6 lg:col-span-4">
            <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-5 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-2 text-sm font-semibold text-(--theme-text) dark:text-white">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  <Icon name="user" />
                </span>
                Về {displayName}
              </div>
              <p className="mt-3 text-sm text-(--theme-text-muted) dark:text-(--theme-text-subtle)">{profileBio}</p>

              <div className="mt-4 rounded-2xl border border-(--theme-border) bg-(--theme-surface-muted) p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-(--theme-text-subtle)">Thông tin liên hệ</p>
                <div className="mt-2 space-y-2">
                  <input
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="Số điện thoại"
                    className="w-full rounded-xl border border-(--theme-border) bg-(--theme-surface) px-3 py-2 text-sm text-(--theme-text) outline-none focus:border-(--theme-border-strong)"
                  />
                  <input
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    placeholder="Địa chỉ"
                    className="w-full rounded-xl border border-(--theme-border) bg-(--theme-surface) px-3 py-2 text-sm text-(--theme-text) outline-none focus:border-(--theme-border-strong)"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="rounded-full bg-(--brand-accent) px-3 py-1.5 text-xs font-semibold text-white hover:bg-(--brand-accent-strong) disabled:opacity-60"
                    >
                      {savingProfile ? "Đang lưu..." : "Lưu thông tin"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-(--theme-text-muted) dark:text-(--theme-text-subtle)">
                {isLandlord && (
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Đang hiển thị {fetchedListings.length} tin đã duyệt
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Đã lưu {favorites.length} tin yêu thích
                </div>
              </div>
            </div>

            {isLandlord && (
              <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-5 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-center gap-2 text-sm font-semibold text-(--theme-text) dark:text-white">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    <Icon name="calendar" />
                  </span>
                  Thời gian hoạt động
                </div>
                <div className="mt-3 text-sm text-(--theme-text-muted) dark:text-(--theme-text-subtle)">
                  Có bài đăng đầu tiên từ <span className="font-semibold text-(--theme-text) dark:text-white">{joinedLabel}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm text-(--theme-text-muted) dark:text-(--theme-text-subtle)">
                  <span className="inline-flex h-2 w-2 rounded-full bg-(--brand-accent)" />
                  Khu vực: {listingLocation}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-3xl border border-(--theme-border) bg-(--theme-surface) p-6 shadow-sm transition-colors dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-col gap-4 border-b border-(--theme-border) pb-5 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-(--theme-text) dark:text-white">
                    {isStudent ? "Phòng trọ bạn đã lưu" : isLandlord ? "Danh sách phòng đang cho thuê" : "Thông tin theo vai trò quản trị"}
                  </h2>
                  <p className="text-sm text-(--theme-text-subtle) dark:text-(--theme-text-subtle) mt-1">
                    {listingSummary}
                  </p>
                </div>
                
                {(isStudent || isLandlord) && activeListings.length > 0 && (
                  <div className="relative w-full sm:w-72">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--theme-text-subtle)">
                      <Icon name="search" />
                    </span>
                    <input
                      type="text"
                      value={listingSearch}
                      onChange={(e) => setListingSearch(e.target.value)}
                      placeholder="Tìm kiếm nhanh..."
                      className="h-10 w-full rounded-xl border border-(--theme-border) bg-(--theme-surface-muted) pl-10 pr-3 text-sm text-(--theme-text-muted) outline-none transition focus:border-[#d51f35] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div className="mt-5">
                {loadingListings ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--theme-border) py-16 text-(--theme-text-subtle) dark:border-gray-700 dark:text-(--theme-text-subtle)">
                    <span className="mb-3 animate-spin text-3xl">⏳</span>
                    <p>Đang tải dữ liệu...</p>
                  </div>
                ) : listingError ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 py-16 text-red-500 dark:border-red-900/50 dark:text-red-400">
                    <span className="mb-3 text-3xl opacity-50">❌</span>
                    <p>Lỗi kết nối. Không thể tải danh sách!</p>
                  </div>
                ) : activeListings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--theme-border) py-16 text-(--theme-text-subtle) dark:border-gray-700 dark:text-(--theme-text-subtle)">
                    <span className="mb-3 text-4xl opacity-40">📂</span>
                    <p className="font-semibold text-(--theme-text-muted) dark:text-gray-300">
                      {isStudent ? "Bạn chưa lưu phòng yêu thích nào." : isLandlord ? "Bạn chưa có tin đăng nào." : "Tài khoản admin không có danh sách phòng cá nhân."}
                    </p>
                    {isStudent && (
                      <Link href="/listings" className="mt-3 text-sm font-semibold text-(--brand-accent) hover:underline dark:text-red-400">
                        Khám phá phòng trọ ngay →
                      </Link>
                    )}
                  </div>
                ) : filteredListings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--theme-border) py-16 text-(--theme-text-subtle) dark:border-gray-700 dark:text-(--theme-text-subtle)">
                    <span className="mb-3 text-4xl opacity-40">🔍</span>
                    <p>Không tìm thấy tin phù hợp.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredListings.map((listing) => (
                      <ListingCard
                        key={listing.id}
                        listing={listing}
                        isSaved={favorites.some((f) => f.id === listing.id)}
                        onToggleSave={() => handleToggleSave(listing)}
                        canSave={isStudent}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </section>
      </div>
    </UserPageShell>
  );
}
