"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation"; // Thêm useRouter
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react"; // Thêm useSession
import UserTopBar from "@/app/homepage/components/UserTopBar";
import type { RoomCardData } from "@/app/homepage/components/RoomCard";
import { toggleFavorite, useFavorites } from "@/app/services/favorites";
import { getPostById, type Post } from "@/app/services/posts";
import { getPostReviews, updateReview, type PublicReview } from "@/app/services/reviews";

// --- 1. Cập nhật Type Listing (Thêm ID chủ trọ) ---
type Listing = {
  id: string;
  title: string;
  price: string;
  rawPrice: number;
  area: string;
  rawArea: number;
  address: string;
  campus: string;
  rating: string;
  reviews: number;
  beds: number;
  baths: number;
  parking: string;
  wifi: boolean;
  utilities: { label: string; value: string }[];
  amenities: string[];
  description: string;
  landlord: {
    id: number; // ✅ Thêm field này để biết chat với ai
    name: string;
    phone: string;
    email: string;
    response: string;
    avatar: string;
  };
  images: string[];
  mapQuery: string;
};

type ListingReview = {
  id: number;
  rating: number;
  comment: string;
  createdAt?: string;
  userId?: number;
  userName: string;
  userAvatar: string;
};

type ListingReviewSummary = {
  averageRating: number;
  totalReviews: number;
};

// --- Helper Functions (Giữ nguyên) ---
const toNumberValue = (value: number | string | undefined | null) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toOptionalNumber = (value: number | string | undefined | null) => {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toPriceMillion = (value: number | string | undefined | null) => {
  const raw = toNumberValue(value);
  return raw >= 100000 ? raw / 1_000_000 : raw;
};

const formatPriceText = (value: number | string | undefined | null) => {
  const price = toPriceMillion(value);
  if (!price) return "0 triệu / tháng";
  const trimmed = Number.isInteger(price) ? price.toFixed(0) : price.toFixed(1);
  return `${trimmed} triệu / tháng`;
};

const formatPriceShort = (value: number | string | undefined | null) => {
  const price = toPriceMillion(value);
  if (!price) return "0";
  const trimmed = Number.isInteger(price) ? price.toFixed(0) : price.toFixed(1);
  return `${trimmed}tr`;
};

const formatAreaText = (value: number | string | undefined | null) => {
  const area = toNumberValue(value);
  if (!area) return "0 m²";
  const trimmed = Number.isInteger(area) ? area.toFixed(0) : area.toFixed(1);
  return `${trimmed} m²`;
};

const formatAreaShort = (value: number | string | undefined | null) => {
  const area = toNumberValue(value);
  if (!area) return "0m2";
  const trimmed = Number.isInteger(area) ? area.toFixed(0) : area.toFixed(1);
  return `${trimmed}m2`;
};

const getAmenityNames = (post: Post) =>
  (post.amenities ?? [])
    .map((amenity) => (amenity?.name ?? "").trim())
    .filter(Boolean);

const formatReviewDate = (value?: string) => {
  if (!value) return "Mới đăng";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Mới đăng";
  return parsed.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const mapPublicReview = (review: PublicReview): ListingReview => {
  const userName =
    review.user?.profile?.full_name ||
    review.user?.username ||
    review.user?.email ||
    "Người dùng";

  return {
    id: review.id,
    rating: Number.isFinite(review.rating) ? review.rating : 0,
    comment: (review.comment ?? "").trim() || "Không có nội dung đánh giá.",
    createdAt: review.createdAt,
    userId: review.user?.id,
    userName,
    userAvatar: review.user?.profile?.avatar_url || "/images/Admins.png",
  };
};

const getSubmitErrorMessage = (error: unknown) => {
  const anyError = error as { response?: { data?: { message?: string | string[] } } };
  const message = anyError?.response?.data?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string" && message.trim()) return message;
  return "Không thể cập nhật đánh giá. Vui lòng thử lại.";
};

// --- 2. Cập nhật Mapper (Lấy ID chủ trọ từ Post) ---
const mapPostToListing = (post: Post): Listing => {
  const amenityNames = getAmenityNames(post);
  const amenityText = amenityNames.join(" ").toLowerCase();
  const hasParkingAmenity =
    amenityText.includes("giu xe") ||
    amenityText.includes("gửi xe") ||
    amenityText.includes("parking");
  const images = (post.images ?? [])
    .map((image) => image?.image_url ?? "")
    .filter(Boolean);
  const safeImages = images.length > 0 ? images : ["/images/House.svg"];
  const profile = post.user?.profile;
  
  const landlordId = post.user?.id || 0; // ✅ Lấy ID User
  const landlordName =
    profile?.full_name || post.user?.username || post.user?.email || "Chủ nhà";
  const landlordPhone = profile?.phone_number || "";
  const landlordEmail = post.user?.email || "";
  const landlordAvatar = profile?.avatar_url || "/images/Admins.png";
  
  const lat = toOptionalNumber(post.latitude);
  const lng = toOptionalNumber(post.longitude);
  const mapQuery =
    lat !== undefined && lng !== undefined ? `${lat},${lng}` : post.address || post.title || "";

  return {
    id: String(post.id),
    title: post.title || "Chưa có tiêu đề",
    price: formatPriceText(post.price),
    rawPrice: toNumberValue(post.price),
    area: formatAreaText(post.area),
    rawArea: toNumberValue(post.area),
    address: post.address || "",
    campus: post.category?.name ?? "Chưa rõ",
    rating: "0",
    reviews: 0,
    beds: Math.max(1, Math.round(toNumberValue(post.max_occupancy ?? 1))),
    baths: 1,
    parking: hasParkingAmenity ? "Gửi xe" : "Chưa rõ",
    wifi: amenityText.includes("wifi"),
    utilities: [],
    amenities: amenityNames,
    description: post.description || "",
    landlord: {
      id: landlordId, // ✅ Gán ID vào đây
      name: landlordName,
      phone: landlordPhone,
      email: landlordEmail,
      response: "Liên hệ để biết thêm",
      avatar: landlordAvatar,
    },
    images: safeImages,
    mapQuery,
  };
};

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100">
      {icon ? (
        <span className="inline-flex h-5 w-5 items-center justify-center text-gray-700">
          {icon}
        </span>
      ) : null}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function AmenityTag({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-800">
      {text}
    </span>
  );
}

function ReviewStars({ rating, showValue = false }: { rating: number; showValue?: boolean }) {
  const safeRating = Number.isFinite(rating) ? rating : 0;
  const fullStars = Math.max(0, Math.min(5, Math.round(safeRating)));

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} className={index < fullStars ? "text-yellow-500" : "text-gray-300"}>
          ★
        </span>
      ))}
      {showValue ? (
        <span className="ml-1 text-sm font-semibold text-gray-700">
          {safeRating.toFixed(1)}
        </span>
      ) : null}
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(); // ✅ Init Router
  const { data: session } = useSession(); // ✅ Lấy session
  const favorites = useFavorites();
  const currentUserId = session?.user ? Number(session.user.id) : null;

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // State xử lý nút Chat loading
  const [isChatting, setIsChatting] = useState(false);
  const [reviews, setReviews] = useState<ListingReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<ListingReviewSummary>({
    averageRating: 0,
    totalReviews: 0,
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(false);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [isEditingReview, setIsEditingReview] = useState(false);

  const imageCount = listing?.images.length ?? 0;
  const postId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [id]);
  const myReview = useMemo(() => {
    if (!currentUserId) return null;
    return reviews.find((review) => review.userId === currentUserId) ?? null;
  }, [reviews, currentUserId]);
  const favoritePayload = useMemo<RoomCardData | null>(() => {
    if (!listing || !postId) return null;
    return {
      id: postId,
      title: listing.title,
      image: listing.images?.[0] ?? "/images/House.svg",
      location: listing.address || "Unknown",
      beds: listing.beds,
      baths: listing.baths,
      wifi: listing.wifi,
      area: formatAreaShort(listing.rawArea),
      price: formatPriceShort(listing.rawPrice),
    };
  }, [listing, postId]);
  const isSaved = useMemo(() => {
    if (!postId) return false;
    return favorites.some((item) => item.id === postId);
  }, [favorites, postId]);

  const resetEditForm = () => {
    if (!myReview) {
      setEditRating(5);
      setEditComment("");
    } else {
      setEditRating(Number.isFinite(myReview.rating) ? myReview.rating : 5);
      setEditComment(myReview.comment ?? "");
    }
    setEditError("");
    setEditSuccess("");
  };

  // --- 3. Hàm xử lý bắt đầu Chat ---
  const handleStartChat = async () => {
    if (!listing) return;

    // A. Check đăng nhập
    if (!currentUserId) {
        alert("Bạn cần đăng nhập để chat với chủ trọ!");
        // router.push("/login"); // Uncomment nếu muốn redirect login
        return;
    }

    // B. Check chat với chính mình
    if (currentUserId === listing.landlord.id) {
        alert("Đây là bài đăng của bạn, không thể tự chat!");
        return;
    }

    setIsChatting(true);
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/chat/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                studentId: currentUserId,
                landlordId: listing.landlord.id
            }),
        });

        if (!res.ok) throw new Error("Lỗi khi tạo hội thoại");
        
        // Tạo xong thì chuyển hướng sang trang Chat
        router.push("/chat"); 
    } catch (error) {
        console.error("Chat Error:", error);
        alert("Không thể kết nối chat lúc này.");
    } finally {
        setIsChatting(false);
    }
  };
  // -------------------------------

  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const showPrevImage = () => {
    if (imageCount <= 1) return;
    setActiveImageIndex((idx) => (idx - 1 + imageCount) % imageCount);
  };

  const showNextImage = () => {
    if (imageCount <= 1) return;
    setActiveImageIndex((idx) => (idx + 1) % imageCount);
  };

  useEffect(() => {
    if (!id) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLoading(true);
      setLoadError(false);
    });
    getPostById(id)
      .then((post) => {
        if (!active) return;
        setListing(mapPostToListing(post));
        setActiveImageIndex(0);
        setIsLightboxOpen(false);
      })
      .catch(() => {
        if (!active) return;
        setLoadError(true);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!postId) {
      setReviews([]);
      setReviewSummary({ averageRating: 0, totalReviews: 0 });
      setReviewsLoading(false);
      setReviewsError(false);
      setIsEditingReview(false);
      return;
    }

    let active = true;
    setReviewsLoading(true);
    setReviewsError(false);

    getPostReviews(postId, 20)
      .then((data) => {
        if (!active) return;
        setReviewSummary({
          averageRating: Number.isFinite(data.averageRating) ? data.averageRating : 0,
          totalReviews: Number.isFinite(data.totalReviews) ? data.totalReviews : 0,
        });
        setReviews((data.reviews ?? []).map(mapPublicReview));
      })
      .catch(() => {
        if (!active) return;
        setReviews([]);
        setReviewSummary({ averageRating: 0, totalReviews: 0 });
        setReviewsError(true);
      })
      .finally(() => {
        if (!active) return;
        setReviewsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [postId]);

  useEffect(() => {
    if (!myReview) {
      setEditRating(5);
      setEditComment("");
      setEditError("");
      setEditSuccess("");
      setIsEditingReview(false);
      return;
    }
    setEditRating(Number.isFinite(myReview.rating) ? myReview.rating : 5);
    setEditComment(myReview.comment ?? "");
  }, [myReview]);

  const handleToggleSave = () => {
    if (!favoritePayload) return;
    toggleFavorite(favoritePayload);
  };

  const handleUpdateReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!postId || !myReview) return;
    if (!currentUserId) {
      setEditError("Vui lòng đăng nhập để chỉnh sửa đánh giá.");
      return;
    }
    if (!editComment.trim()) {
      setEditError("Vui lòng nhập nội dung đánh giá.");
      return;
    }
    if (!Number.isFinite(editRating) || editRating < 1 || editRating > 5) {
      setEditError("Số sao phải từ 1 đến 5.");
      return;
    }

    setEditError("");
    setEditSuccess("");
    setEditSubmitting(true);
    try {
      await updateReview(myReview.id, {
        rating: editRating,
        comment: editComment.trim(),
      });

      const refreshed = await getPostReviews(postId, 20);
      setReviewSummary({
        averageRating: Number.isFinite(refreshed.averageRating)
          ? refreshed.averageRating
          : 0,
        totalReviews: Number.isFinite(refreshed.totalReviews)
          ? refreshed.totalReviews
          : 0,
      });
      setReviews((refreshed.reviews ?? []).map(mapPublicReview));

      setEditSuccess("Cập nhật đánh giá thành công.");
    } catch (error) {
      setEditError(getSubmitErrorMessage(error));
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb]">
        <UserTopBar />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 text-gray-700">
            Đang tải tin...
          </div>
        </main>
      </div>
    );
  }

  if (loadError || !listing) {
    return (
      <div className="min-h-screen bg-[#f5f7fb]">
        <UserTopBar />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 text-gray-700 space-y-3">
            <p>Tin không khả dụng.</p>
            <Link href="/listings" className="text-sm font-semibold text-blue-600 hover:underline">
              Quay lại danh sách
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const images = listing.images ?? [];
  const activeImageSrc = images[activeImageIndex] ?? images[0];

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <UserTopBar />

      <main className="mx-auto max-w-6xl px-4 py-8 lg:py-10 space-y-8">
        {/* Hero */}
        <section className="rounded-3xl bg-white shadow-md border border-gray-100 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-gray-100 px-5 pt-5 pb-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 uppercase">{listing.campus}</span>
                <span className="text-gray-600">
                  Đánh giá {reviewSummary.averageRating.toFixed(1)} ({reviewSummary.totalReviews})
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">{listing.title}</h1>
              <p className="text-sm text-gray-600">{listing.address}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-gray-500">Đã cập nhật hôm nay</p>
              <p className="text-3xl font-extrabold text-[#d51f35]">{listing.price}</p>
            </div>
          </div>

          {/* Gallery */}
          <div className="grid grid-cols-1 gap-3 p-5 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => openLightbox(0)}
              aria-label="Xem ảnh 1"
              className="relative lg:col-span-2 h-64 sm:h-80 lg:h-[420px] overflow-hidden rounded-2xl cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/40"
            >
              <Image
                src={images[0]}
                alt={listing.title}
                fill
                sizes="(min-width: 1024px) 66vw, 100vw"
                className="object-cover"
              />
            </button>
            <div className="grid grid-rows-3 gap-3">
              {images.slice(1, 4).map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => openLightbox(idx + 1)}
                  aria-label={`Xem ảnh ${idx + 2}`}
                  className="relative h-full min-h-[110px] overflow-hidden rounded-2xl cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/40"
                >
                  <Image
                    src={img}
                    alt={`${listing.title} ${idx + 2}`}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Diện tích" value={listing.area} />
          <StatCard
            label="Giường ngủ"
            value={`${listing.beds} giường`}
            icon={<Image src="/icons/Bed-Icon.svg" alt="Giường" width={20} height={20} />}
          />
          <StatCard
            label="Phòng tắm"
            value={`${listing.baths} phòng`}
            icon={<Image src="/icons/Bath-Icon.svg" alt="Phòng tắm" width={18} height={18} />}
          />
          <StatCard label="Gửi xe" value={listing.parking} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-5">
            <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-2">
              <h2 className="text-lg font-semibold text-gray-900">Mô tả chi tiết</h2>
              <p className="text-sm leading-7 text-gray-700">{listing.description}</p>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Tiện ích & Chi phí</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {listing.utilities.map((item) => (
                  <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((a) => (
                  <AmenityTag key={a} text={a} />
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Vị trí</h2>
                <a
                  className="text-sm font-semibold text-[#d51f35] hover:underline"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(listing.mapQuery)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Xem đường đi →
                </a>
              </div>
              <div className="rounded-2xl border border-gray-100 overflow-hidden bg-gray-100">
                <iframe
                  title="Bản đồ Google"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(listing.mapQuery)}&output=embed`}
                  className="h-80 w-full"
                  loading="lazy"
                  allowFullScreen
                />
              </div>
              <p className="text-xs text-gray-500">* Địa chỉ chính xác sẽ được cung cấp sau khi đặt lịch hẹn.</p>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">Chính sách & Lưu ý</h2>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Đặt cọc 1 tháng, thanh toán đầu kỳ.</li>
                <li>• Giờ giấc tự do, không giới nghiêm.</li>
                <li>• Cho phép thú cưng nhỏ, giữ vệ sinh chung.</li>
                <li>• Ưu tiên sinh viên VLU, kiểm tra giấy tờ khi vào ở.</li>
              </ul>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Đánh giá người thuê</h2>
                  <p className="text-sm text-gray-500">
                    Chia sẻ trải nghiệm thực tế của người dùng về tin đăng này.
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-right">
                  <ReviewStars rating={reviewSummary.averageRating} showValue />
                  <p className="text-xs text-gray-500">{reviewSummary.totalReviews} đánh giá</p>
                </div>
              </div>

              {reviewsLoading ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                  Đang tải đánh giá...
                </div>
              ) : reviewsError ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                  Không thể tải đánh giá cho tin đăng này.
                </div>
              ) : reviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                  Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ trải nghiệm.
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <article key={review.id} className="rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 overflow-hidden rounded-full border border-gray-200">
                            <Image
                              src={review.userAvatar}
                              alt={review.userName}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{review.userName}</p>
                            <p className="text-xs text-gray-500">{formatReviewDate(review.createdAt)}</p>
                          </div>
                        </div>
                        <ReviewStars rating={review.rating} />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-gray-700">{review.comment}</p>
                  </article>
                ))}
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              {!session ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  Bạn cần{" "}
                  <Link href="/login" className="font-semibold text-[color:var(--brand-accent)] hover:underline">
                    đăng nhập
                  </Link>{" "}
                  để chỉnh sửa đánh giá.
                </div>
              ) : !myReview ? (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                  Bạn chưa có đánh giá để chỉnh sửa cho tin đăng này.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-gray-600">Bạn đã gửi đánh giá cho tin đăng này.</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isEditingReview) {
                          resetEditForm();
                        }
                        setIsEditingReview((value) => !value);
                      }}
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-95"
                    >
                      {isEditingReview ? "Đóng chỉnh sửa" : "Chỉnh sửa đánh giá"}
                    </button>
                  </div>

                  {isEditingReview ? (
                    <form className="space-y-3" onSubmit={handleUpdateReview}>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Chỉnh sửa số sao</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setEditRating(value)}
                              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                editRating === value
                                  ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {value} ★
                            </button>
                          ))}
                        </div>
                      </div>

                      <textarea
                        value={editComment}
                        onChange={(event) => setEditComment(event.target.value)}
                        placeholder="Cập nhật nội dung đánh giá của bạn..."
                        className="min-h-[110px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[color:var(--brand-accent)]"
                      />

                      {editError ? (
                        <p className="text-sm font-semibold text-red-500">{editError}</p>
                      ) : null}
                      {editSuccess ? (
                        <p className="text-sm font-semibold text-emerald-600">{editSuccess}</p>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            resetEditForm();
                            setIsEditingReview(false);
                          }}
                          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-95"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={editSubmitting}
                          className="rounded-full bg-[color:var(--brand-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--brand-accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {editSubmitting ? "Đang lưu..." : "Cập nhật đánh giá"}
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              )}
            </div>
          </section>
        </div>

          <aside className="space-y-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full">
                  <Image src={listing.landlord.avatar} alt={listing.landlord.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{listing.landlord.name}</p>
                  <p className="text-xs text-gray-500">{listing.landlord.response}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href={`tel:${listing.landlord.phone.replace(/\s/g, "")}`}
                  className="rounded-full bg-[#d51f35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b01628] active:scale-95 text-center"
                >
                  Gọi {listing.landlord.phone}
                </a>
                <a
                  href={`mailto:${listing.landlord.email}`}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-95 text-center"
                >
                  Gửi email
                </a>
                
                {/* ✅ Thay Link bằng Button xử lý Chat */}
                <button
                  onClick={handleStartChat}
                  disabled={isChatting}
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-95 text-center disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {isChatting ? "Đang kết nối..." : "Trò chuyện ngay"}
                </button>

              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-3">
              <h3 className="text-base font-semibold text-gray-900">Hành động nhanh</h3>
              <div className="flex flex-col gap-2">
                <button className="rounded-full bg-[#d51f35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b01628] active:scale-95">
                  Đặt lịch 15:00 hôm nay
                </button>
                <button
                  onClick={handleToggleSave}
                  disabled={!favoritePayload}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                    isSaved
                      ? "border-[#d51f35] bg-[#d51f35] text-white hover:bg-[#b01628]"
                      : "border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {isSaved ? "Đã lưu" : "Lưu tin"}
                </button>
                <button className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-95">
                  Chia sẻ
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {isLightboxOpen && activeImageSrc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6"
          onClick={closeLightbox}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative h-full w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={activeImageSrc}
              alt={listing.title}
              fill
              sizes="100vw"
              className="object-contain"
            />
            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Đóng ảnh"
              className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
            >
              <span className="text-sm font-semibold">X</span>
            </button>

            {imageCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={showPrevImage}
                  aria-label="Ảnh trước"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                >
                  <span className="text-lg font-semibold">&lt;</span>
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  aria-label="Ảnh sau"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                >
                  <span className="text-lg font-semibold">&gt;</span>
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                  {activeImageIndex + 1}/{imageCount}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
