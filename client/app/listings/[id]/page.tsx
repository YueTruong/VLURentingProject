"use client";

import Image from "next/image";
import Link from "next/link";
import UserTopBar from "@/app/homepage/components/UserTopBar";

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

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm border border-gray-100">
      <span className="text-xl">{icon}</span>
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

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  // In thực tế fetch theo params.id; hiện dùng mock
  const listing = { ...mockListing, id: params.id };

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
                <span className="text-gray-500">★ {listing.rating} ({listing.reviews} đánh giá)</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900">{listing.title}</h1>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <span>📍</span>
                {listing.address}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-gray-500">Đã cập nhật hôm nay</p>
              <p className="text-3xl font-extrabold text-[#d51f35]">{listing.price}</p>
            </div>
          </div>

          {/* Gallery */}
          <div className="grid grid-cols-1 gap-3 p-5 lg:grid-cols-3">
            <div className="relative lg:col-span-2 h-64 sm:h-80 lg:h-[420px] overflow-hidden rounded-2xl">
              <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
            </div>
            <div className="grid grid-rows-3 gap-3">
              {listing.images.slice(1, 4).map((img, idx) => (
                <div key={idx} className="relative h-full min-h-[110px] overflow-hidden rounded-2xl">
                  <Image src={img} alt={`${listing.title} ${idx + 2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Diện tích" value={listing.area} icon="📐" />
          <StatCard label="Giường ngủ" value={`${listing.beds} Ngủ`} icon="🛏️" />
          <StatCard label="Phòng tắm" value={`${listing.baths} Tắm`} icon="🛁" />
          <StatCard label="Gửi xe" value={listing.parking} icon="🛵" />
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
                  Xem đường đi ↗
                </a>
              </div>
              <div className="rounded-2xl border border-gray-100 overflow-hidden bg-gray-100">
                <iframe
                  title="Google Map"
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
                  Gửi Email
                </a>
                <Link
                  href="/chat"
                  className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 active:scale-95 text-center"
                >
                  Chat ngay
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
    </div>
  );
}
