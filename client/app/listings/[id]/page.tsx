"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation"; 
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react"; 
import UserPageShell from "@/app/homepage/components/UserPageShell"; // ✅ Dùng chung Shell với Listings & Favorites
import { getPostById, type Post } from "@/app/services/posts";
import { createReview, getPostReviews, updateReview, type PublicReview } from "@/app/services/reviews";
import toast from "react-hot-toast"; 
import { getFavoriteScope, toggleFavorite, useFavoritesByScope } from "@/app/services/favorites"; 

// --- Types ---
type Listing = {
  id: string;
  title: string;
  price: string;
  rawPrice: number;
  area: string;
  rawArea: number;
  address: string;
  campus: string;
  categoryName: string;
  status: string;
  availability: string;
  maxOccupancy: number;
  beds: number;
  baths: number;
  parking: string;
  wifi: boolean;
  utilities: { label: string; value: string }[];
  amenities: string[];
  description: string;
  videoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  landlord: {
    id: number;
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

type BookingFormData = {
  bookingDate: string;
  timeSlot: string;
  note?: string;
};

// --- Helper Functions ---
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

const formatAreaText = (value: number | string | undefined | null) => {
  const area = toNumberValue(value);
  if (!area) return "0 m²";
  const trimmed = Number.isInteger(area) ? area.toFixed(0) : area.toFixed(1);
  return `${trimmed} m²`;
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

const formatDateTime = (value?: string) => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

const mapPostStatusLabel = (status?: string) => {
  const normalized = (status ?? "pending").toLowerCase();
  if (normalized === "approved") return "Đã duyệt";
  if (normalized === "pending") return "Chờ duyệt";
  if (normalized === "rejected") return "Từ chối";
  if (normalized === "hidden") return "Ẩn";
  if (normalized === "rented") return "Đã cho thuê";
  return status ?? "Chờ duyệt";
};

// --- Mapper ---
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
  
  const landlordId = post.user?.id || 0; 
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
    campus: post.campus ?? "Chưa rõ",
    categoryName: post.category?.name?.trim() || "Chưa phân loại",
    status: post.status ?? "pending",
    availability: post.availability === "rented" ? "Đã cho thuê" : "Còn phòng",
    maxOccupancy: Math.max(1, Math.round(toNumberValue(post.max_occupancy ?? 1))),
    beds: Math.max(1, Math.round(toNumberValue(post.max_occupancy ?? 1))),
    baths: 1,
    parking: hasParkingAmenity ? "Có chỗ gửi xe" : "Chưa rõ",
    wifi: amenityText.includes("wifi"),
    utilities: [
      { label: "Mức giá", value: formatPriceText(post.price) },
      { label: "Diện tích", value: formatAreaText(post.area) },
      { label: "Sức chứa", value: `${Math.max(1, Math.round(toNumberValue(post.max_occupancy ?? 1)))} người` },
      { label: "Danh mục", value: post.category?.name?.trim() || "Chưa phân loại" },
      { label: "Trạng thái duyệt", value: mapPostStatusLabel(post.status) },
      { label: "Tình trạng phòng", value: post.availability === "rented" ? "Đã cho thuê" : "Còn phòng" },
      { label: "Đăng lúc", value: formatDateTime(post.createdAt) },
      { label: "Cập nhật", value: formatDateTime(post.updatedAt) },
    ],
    amenities: amenityNames,
    description: post.description || "",
    videoUrl: post.videoUrl ?? undefined,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    landlord: {
      id: landlordId, 
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

function StatCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode; }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100 transition-colors dark:border-gray-800 dark:bg-gray-900">
      {icon ? (
        <span className="inline-flex h-5 w-5 items-center justify-center text-gray-700 dark:text-gray-300">
          {icon}
        </span>
      ) : null}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function AmenityTag({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-800 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
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
        <span key={index} className={index < fullStars ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"}>
          ★
        </span>
      ))}
      {showValue ? (
        <span className="ml-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {safeRating.toFixed(1)}
        </span>
      ) : null}
    </div>
  );
}

function BookingModal({ 
  isOpen, 
  onClose, 
  listingTitle, 
  onSubmit 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  listingTitle: string;
  onSubmit: (data: BookingFormData) => void;
}) {
  const [formData, setFormData] = useState({
    bookingDate: "",
    timeSlot: "Sáng (08:00 - 11:00)",
    note: ""
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Hẹn lịch xem phòng</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">✕</button>
        </div>

        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
          <p className="text-xs font-bold text-[#d51f35] uppercase mb-1">Tin đăng:</p>
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">{listingTitle}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Chọn ngày đi xem</label>
            <input 
              type="date" 
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm outline-none focus:border-[#d51f35] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              onChange={(e) => setFormData({...formData, bookingDate: e.target.value})}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Khung giờ rảnh</label>
            <select 
              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm outline-none focus:border-[#d51f35] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              onChange={(e) => setFormData({...formData, timeSlot: e.target.value})}
            >
              <option value="Sáng (08:00 - 11:00)">Sáng (08:00 - 11:00)</option>
              <option value="Chiều (14:00 - 17:00)">Chiều (14:00 - 17:00)</option>
              <option value="Tối (18:00 - 20:00)">Tối (18:00 - 20:00)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Lời nhắn (không bắt buộc)</label>
            <textarea 
              placeholder="Bạn muốn nhắn gì cho chủ trọ không?"
              className="w-full min-h-[100px] rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-sm outline-none focus:border-[#d51f35] dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              onChange={(e) => setFormData({...formData, note: e.target.value})}
            />
          </div>

          <button 
            onClick={() => onSubmit(formData)}
            disabled={!formData.bookingDate}
            className="w-full rounded-full bg-[#d51f35] py-4 text-sm font-bold text-white shadow-lg hover:bg-[#b01628] transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            Xác nhận gửi yêu cầu
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter(); 
  const { data: session } = useSession(); 
  const currentUserId = session?.user ? Number(session.user.id) : null;
  const userRole = session?.user?.role?.toLowerCase();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Hàm này sẽ được gọi khi bấm nút "Xác nhận đặt lịch" trong Modal
  const handleCreateBooking = async (bookingData: BookingFormData) => {
  if (!session?.user?.accessToken) {
    toast.error("Vui lòng đăng nhập lại!");
    return;
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.user.accessToken}`
      },
      body: JSON.stringify({
        postId: Number(listing?.id),
        landlordId: listing?.landlord.id,
        // Backend sẽ tự lấy studentId từ JWT Token (req.user.id)
        ...bookingData
      }),
    });

    if (!res.ok) throw new Error();

    toast.success("Đã gửi yêu cầu đặt lịch đến chủ trọ!");
    setIsBookingModalOpen(false);
  } catch {
    toast.error("Gửi yêu cầu thất bại.");
  }
};

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
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

  const imageCount = listing?.images.length ?? 0;
  const postId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [id]);
  const myReview = useMemo(() => {
    if (!currentUserId) return null;
    return reviews.find((review) => Number(review.userId) === currentUserId) ?? null;
  }, [reviews, currentUserId]);

  // Setup Logic Lưu Tin
  const favoriteScope = getFavoriteScope(session?.user?.id);
  const favorites = useFavoritesByScope(favoriteScope);
  const isSaved = listing ? favorites.some((item) => item.id === Number(listing.id)) : false;

  const handleToggleFavorite = () => {
    if (!session) {
      toast.error("Vui lòng đăng nhập để lưu tin!", {
        style: { borderRadius: '10px', background: '#333', color: '#fff' },
      });
      return;
    }
    if (!listing) return;

    const roomDataToSave = {
      id: Number(listing.id),
      title: listing.title,
      image: listing.images[0] || "/images/House.svg",
      location: listing.address,
      beds: listing.beds,
      baths: listing.baths,
      wifi: listing.wifi,
      area: listing.area,
      price: listing.price,
    };

    toggleFavorite(roomDataToSave, favoriteScope);
    
    if (isSaved) {
      toast("Đã bỏ lưu tin", { icon: '💔' });
    } else {
      toast.success("Đã lưu tin thành công!");
    }
  };

  const handleStartChat = async () => {
    if (!listing) return;
    
    if (!session || !currentUserId) {
        toast.error("Bạn cần đăng nhập để chat với chủ trọ!");
        return;
    }
    
    if (currentUserId === listing.landlord.id) {
        toast.error("Đây là bài đăng của bạn, không thể tự chat!");
        return;
    }

    setIsChatting(true);
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        
        interface ExtendedSession {
          accessToken?: string;
          user?: {
            accessToken?: string;
          };
        }

        const extendedSession = session as ExtendedSession;
        const token = extendedSession?.accessToken || extendedSession?.user?.accessToken || "";

        const res = await fetch(`${apiUrl}/chat/init`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({
                partnerId: listing.landlord.id 
            }),
        });

        if (!res.ok) {
          if (res.status === 401) throw new Error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");
          throw new Error("Lỗi khi tạo hội thoại");
        }
        
        router.push("/chat"); 
        
    } catch (error: unknown) {
        console.error("Chat Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Không thể kết nối chat lúc này.";
        toast.error(errorMessage);
    } finally {
        setIsChatting(false);
    }
  };

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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Đã sao chép đường dẫn bài đăng!");
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
      return;
    }
    setEditRating(Number.isFinite(myReview.rating) ? myReview.rating : 5);
    setEditComment(myReview.comment ?? "");
  }, [myReview]);

  const handleSubmitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!postId) return;
    if (!currentUserId) {
      setEditError("Vui lòng đăng nhập để gửi đánh giá.");
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
      if (myReview) {
        await updateReview(myReview.id, {
          rating: editRating,
          comment: editComment.trim(),
        });
      } else {
        await createReview({
          postId,
          rating: editRating,
          comment: editComment.trim(),
        });
      }

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

      setEditSuccess(myReview ? "Cập nhật đánh giá thành công." : "Gửi đánh giá thành công.");
      if (!myReview) {
        setEditRating(5);
        setEditComment("");
      }
    } catch (error) {
      setEditError(getSubmitErrorMessage(error));
    } finally {
      setEditSubmitting(false);
    }
  };

  if (loading) {
    return (
      <UserPageShell title="Đang tải thông tin..." description="Vui lòng đợi trong giây lát.">
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 text-gray-700 transition-colors dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          Đang tải tin đăng...
        </div>
      </UserPageShell>
    );
  }

  if (loadError || !listing) {
    return (
      <UserPageShell title="Không tìm thấy tin" description="Tin đăng này có thể đã bị xóa hoặc không tồn tại.">
        <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm border border-gray-100 text-gray-700 transition-colors dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <p>Tin không khả dụng.</p>
          <Link href="/listings" className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
            Quay lại danh sách
          </Link>
        </div>
      </UserPageShell>
    );
  }

  const images = listing.images ?? [];
  const activeImageSrc = images[activeImageIndex] ?? images[0];
  const isLandlordRole = userRole === "landlord";
  const isAdminRole = userRole === "admin";
  const isOwner = currentUserId !== null && currentUserId === listing.landlord.id;
  const canViewModerationInfo = isOwner || isAdminRole;
  const canUseStudentActions = !isLandlordRole && !isOwner;
  const canContactLandlord = !isOwner;

  return (
    // ✅ Bọc toàn bộ trong UserPageShell giống hệt trang Listings / Favorites
    <UserPageShell
      title="Chi tiết phòng trọ"
      description="Xem thông tin chi tiết, liên hệ chủ nhà và các đánh giá thực tế."
      actions={
        <button
          onClick={handleShare}
          className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/20 active:scale-95"
        >
          Chia sẻ tin đăng
        </button>
      }
    >
      <div className="space-y-6 lg:space-y-8">
        
        {/* Hero */}
        <section className="rounded-3xl bg-white shadow-sm border border-gray-100 overflow-hidden transition-colors dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 border-b border-gray-100 px-5 pt-5 pb-3 transition-colors dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 uppercase dark:bg-blue-900/30 dark:text-blue-400">
                  {listing.campus}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  Đánh giá {reviewSummary.averageRating.toFixed(1)} ({reviewSummary.totalReviews})
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white">{listing.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{listing.address}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Cập nhật: {formatDateTime(listing.updatedAt)}</p>
              <p className="text-3xl font-extrabold text-[#d51f35] dark:text-red-400">{listing.price}</p>
            </div>
          </div>

          {/* Gallery */}
          <div className="grid grid-cols-1 gap-3 p-5 lg:grid-cols-3">
            <button
              type="button"
              onClick={() => openLightbox(0)}
              aria-label="Xem ảnh 1"
              className="relative lg:col-span-2 h-64 sm:h-80 lg:h-[420px] overflow-hidden rounded-2xl cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/40 dark:focus-visible:ring-gray-100/40"
            >
              <Image src={images[0]} alt={listing.title} fill sizes="(min-width: 1024px) 66vw, 100vw" className="object-cover" />
            </button>
            <div className="grid grid-rows-3 gap-3">
              {images.slice(1, 4).map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => openLightbox(idx + 1)}
                  aria-label={`Xem ảnh ${idx + 2}`}
                  className="relative h-full min-h-[110px] overflow-hidden rounded-2xl cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/40 dark:focus-visible:ring-gray-100/40"
                >
                  <Image src={img} alt={`${listing.title} ${idx + 2}`} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Diện tích" value={listing.area} />
          <StatCard label="Sức chứa" value={`${listing.maxOccupancy} người`} icon={<Image src="/icons/Bed-Icon.svg" alt="Sức chứa" width={20} height={20} className="dark:invert dark:opacity-80" />} />
          <StatCard label="Tình trạng" value={listing.availability} />
          <StatCard label="Danh mục" value={listing.categoryName} />
        </div>

        {/* Cột Layout */}
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-5">
            <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-2 transition-colors dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mô tả chi tiết</h2>
              <p className="text-sm leading-7 text-gray-700 whitespace-pre-wrap dark:text-gray-300">{listing.description}</p>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-4 transition-colors dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tiện ích & Chi phí</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {listing.utilities.map((item) => (
                  <div key={item.label} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition-colors dark:border-gray-700 dark:bg-gray-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.length > 0 ? (
                  listing.amenities.map((a) => <AmenityTag key={a} text={a} />)
                ) : (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Chưa khai báo tiện ích.</span>
                )}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-3 transition-colors dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Vị trí</h2>
                <a className="text-sm font-semibold text-[#d51f35] hover:underline dark:text-red-400" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.mapQuery)}`} target="_blank" rel="noreferrer">
                  Xem đường đi →
                </a>
              </div>
              <div className="rounded-2xl border border-gray-100 overflow-hidden bg-gray-100 transition-colors dark:border-gray-700 dark:bg-gray-800">
                <iframe title="Bản đồ Google" src={`https://maps.google.com/maps?q=${encodeURIComponent(listing.mapQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`} className="h-80 w-full" loading="lazy" allowFullScreen />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">* Địa chỉ chính xác sẽ được cung cấp sau khi liên hệ chủ trọ.</p>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-3 transition-colors dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Thông tin bài đăng</h2>
              <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {canViewModerationInfo ? (
                  <li>• Trạng thái kiểm duyệt: <span className="font-semibold">{mapPostStatusLabel(listing.status)}</span></li>
                ) : null}
                <li>• Tình trạng phòng: <span className="font-semibold">{listing.availability}</span></li>
                <li>• Cơ sở gần nhất: <span className="font-semibold">{listing.campus}</span></li>
                <li>• Danh mục: <span className="font-semibold">{listing.categoryName}</span></li>
                <li>• Đăng lúc: <span className="font-semibold">{formatDateTime(listing.createdAt)}</span></li>
              </ul>
            </section>

            {listing.videoUrl ? (
              <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-3 transition-colors dark:border-gray-800 dark:bg-gray-900">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Video bài đăng</h2>
                <a
                  href={listing.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-blue-600 hover:underline"
                >
                  Mở video trong tab mới
                </a>
              </section>
            ) : null}

            <section className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-4 transition-colors dark:border-gray-800 dark:bg-gray-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Đánh giá người thuê</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Chia sẻ trải nghiệm thực tế của người dùng về tin đăng này.</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-right transition-colors dark:border-gray-700 dark:bg-gray-800">
                  <ReviewStars rating={reviewSummary.averageRating} showValue />
                  <p className="text-xs text-gray-500 dark:text-gray-400">{reviewSummary.totalReviews} đánh giá</p>
                </div>
              </div>

              {reviewsLoading ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">Đang tải đánh giá...</div>
              ) : reviewsError ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">Không thể tải đánh giá cho tin đăng này.</div>
              ) : reviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ trải nghiệm.</div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <article key={review.id} className="rounded-xl border border-gray-200 bg-white p-4 transition-colors dark:border-gray-700 dark:bg-gray-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-9 w-9 overflow-hidden rounded-full border border-gray-200 dark:border-gray-600">
                            <Image src={review.userAvatar} alt={review.userName} fill unoptimized className="object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{review.userName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{formatReviewDate(review.createdAt)}</p>
                          </div>
                        </div>
                        <ReviewStars rating={review.rating} />
                      </div>
                      <p className="mt-3 text-sm leading-6 text-gray-700 dark:text-gray-300">{review.comment}</p>
                    </article>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
                {!canUseStudentActions ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {isOwner ? "Bạn là chủ của tin đăng này nên không thể tự đánh giá." : "Tính năng đánh giá hiện áp dụng cho sinh viên/người thuê."}
                  </div>
                ) : !session ? (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 transition-colors dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    Bạn cần <Link href="/login" className="font-semibold text-[#d51f35] hover:underline dark:text-red-400">đăng nhập</Link> để viết đánh giá.
                  </div>
                ) : (
                  <form className="space-y-3" onSubmit={handleSubmitReview}>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{myReview ? "Chỉnh sửa đánh giá của bạn" : "Chọn số sao"}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value} type="button" onClick={() => setEditRating(value)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                              editRating === value ? "border-yellow-400 bg-yellow-50 text-yellow-700 shadow-sm dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            }`}
                          >
                            {value} ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      value={editComment} onChange={(event) => setEditComment(event.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn về tin đăng này..."
                      className="min-h-[110px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none transition-colors focus:border-[#d51f35] focus:ring-1 focus:ring-[#d51f35] dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                    />

                    {editError ? <p className="text-sm font-semibold text-red-500 dark:text-red-400">{editError}</p> : null}
                    {editSuccess ? <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{editSuccess}</p> : null}

                    <div className="flex justify-end">
                      <button type="submit" disabled={editSubmitting} className="rounded-full bg-[#d51f35] px-6 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#b01628] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
                        {editSubmitting ? "Đang gửi..." : myReview ? "Cập nhật đánh giá" : "Gửi đánh giá"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-3 transition-colors dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-gray-100 dark:border-gray-700">
                  <Image src={listing.landlord.avatar} alt={listing.landlord.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{listing.landlord.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{listing.landlord.response}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {canContactLandlord ? (
                  <>
                    {listing.landlord.phone ? (
                      <a href={`tel:${listing.landlord.phone.replace(/\s/g, "")}`} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 active:scale-95 text-center shadow-sm">
                        Gọi {listing.landlord.phone}
                      </a>
                    ) : (
                      <div className="rounded-full bg-gray-100 px-4 py-2 text-center text-sm font-semibold text-gray-500">
                        Chủ trọ chưa cập nhật số điện thoại
                      </div>
                    )}
                    <button
                      onClick={handleStartChat} disabled={isChatting}
                      className="rounded-full border border-transparent bg-[#d51f35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b01628] active:scale-95 text-center shadow-sm disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500"
                    >
                      {isChatting ? "Đang kết nối..." : "Nhắn tin cho chủ trọ"}
                    </button>
                  </>
                ) : (
                  <div className="rounded-xl bg-gray-100 px-4 py-2 text-center text-sm font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    Đây là tin đăng của bạn.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-3 sticky top-24 transition-colors dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Hành động nhanh</h3>
            <div className="flex flex-col gap-2">
              {canUseStudentActions ? (
                <>
                  {/* Nút Đặt lịch mới - Gọi Modal */}
                  <button 
                    onClick={() => setIsBookingModalOpen(true)} 
                    className="rounded-full bg-gray-900 py-3 text-sm font-bold text-white hover:bg-black transition-all dark:bg-white dark:text-gray-900 shadow-md active:scale-95"
                  >
                    Đặt lịch xem phòng
                  </button>

                  {/* Nút Lưu tin */}
                  <button 
                    onClick={handleToggleFavorite} 
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
                      isSaved 
                        ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40" 
                        : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {isSaved ? "Đã lưu tin ♥" : "Lưu tin ♡"}
                  </button>
                </>
              ) : (
                <div className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  Tài khoản chủ trọ chỉ có thể quản lý tin đăng của mình.
                </div>
              )}

              {/* NÚT CHIA SẺ TIN ĐĂNG - Đã cập nhật theo ý em */}
              <button 
                onClick={handleShare} 
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 active:scale-95 transition-all dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Chia sẻ tin đăng
              </button>
            </div>
          </div>
          </aside>
        </div>

      </div>

      {/* Lightbox - Z-index 100 để chắc chắn nằm trên Header */}
      {isLightboxOpen && activeImageSrc ? (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-sm" onClick={closeLightbox}>
          <div role="dialog" aria-modal="true" className="relative h-full w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <Image src={activeImageSrc} alt={listing.title} fill sizes="100vw" className="object-contain" />
            <button type="button" onClick={closeLightbox} aria-label="Đóng ảnh" className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-all border border-white/10">
              <span className="text-sm font-semibold">X</span>
            </button>
            {imageCount > 1 && (
              <>
                <button type="button" onClick={showPrevImage} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-all border border-white/10">
                  <span className="text-lg font-semibold">{"<"}</span>
                </button>
                <button type="button" onClick={showNextImage} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 transition-all border border-white/10">
                  <span className="text-lg font-semibold">{">"}</span>
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white border border-white/10">
                  {activeImageIndex + 1}/{imageCount}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        listingTitle={listing.title}
        onSubmit={handleCreateBooking} // Truyền hàm xử lý API vào đây
      />
    </UserPageShell>
  );
}
