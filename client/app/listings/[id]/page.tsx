"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import UserTopBar from "@/app/homepage/components/UserTopBar";
import { getPostById, type Post } from "@/app/services/posts";

type Listing = {
  id: string;
  title: string;
  price: string;
  area: string;
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
    name: string;
    phone: string;
    email: string;
    response: string;
    avatar: string;
  };
  images: string[];
  mapQuery: string;
};

/*
const mockListing: Listing = {
  id: "101",
  title: "Căn hộ studio view sông, gần trường ĐH",
  price: "4.8 triệu / tháng",
  area: "32 m²",
  address: "123 Đường ABC, Quận 7, TP.HCM",
  campus: "Cơ sở 3",
  rating: "4.8",
  reviews: 12,
  beds: 1,
  baths: 1,
  parking: "Miễn phí gửi xe",
  wifi: true,
  utilities: [
    { label: "Điện", value: "3.500đ/kWh" },
    { label: "Nước", value: "20.000đ/m³" },
    { label: "Phí quản lý", value: "200k/tháng" },
  ],
  amenities: ["Wifi miễn phí", "Ban công", "Bếp riêng", "Máy lạnh", "Máy giặt", "Thang máy", "Thú cưng nhỏ"],
  description:
    "Căn hộ studio thoáng mát, có ban công nhìn ra sông, đón gió tự nhiên. Vị trí cực kỳ thuận tiện, chỉ mất 8 phút đi bộ tới cơ sở 3, gần siêu thị và trạm xe buýt. Khu vực an ninh tốt, yên tĩnh, phù hợp cho sinh viên cần không gian học tập. Chủ nhà thân thiện, tôn trọng sự riêng tư, giờ giấc tự do.",
  landlord: {
    name: "Chị Lan",
    phone: "0901 234 567",
    email: "lan.home@example.com",
    response: "Phản hồi trong ~15 phút",
    avatar: "/images/Admins.png",
  },
  images: ["/images/House.svg", "/images/House.svg", "/images/House.svg", "/images/House.svg"],
  mapQuery: "Van Lang University Cơ sở 3",
};
*/

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
    area: formatAreaText(post.area),
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

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const imageCount = listing?.images.length ?? 0;

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
                <span className="text-gray-600">Đánh giá {listing.rating} ({listing.reviews})</span>
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
                <Link
                  href="/chat"
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-95 text-center"
                >
                  Trò chuyện ngay
                </Link>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100 space-y-3">
              <h3 className="text-base font-semibold text-gray-900">Hành động nhanh</h3>
              <div className="flex flex-col gap-2">
                <button className="rounded-full bg-[#d51f35] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b01628] active:scale-95">
                  Đặt lịch 15:00 hôm nay
                </button>
                <button className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-95">
                  Lưu tin
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
