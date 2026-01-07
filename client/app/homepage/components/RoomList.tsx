"use client";

import SectionRow from "./SectionRow";
import { RoomCardData } from "./RoomCard";

// Dữ liệu phòng giữ nguyên như hiện có
const roomsData: RoomCardData[] = [
  {
    id: 1,
    title: "Căn hộ mini 2 phòng ngủ rộng rãi",
    image: "/images/House.svg",
    location: "Bình Thạnh, TP.HCM",
    beds: 2,
    baths: 1,
    wifi: true,
    area: "60m²",
    price: "5.5tr",
  },
  {
    id: 2,
    title: "Phòng trọ cao cấp gần đại học Hutech",
    image: "/images/House.svg",
    location: "Bình Thạnh, TP.HCM",
    beds: 1,
    baths: 1,
    wifi: true,
    area: "35m²",
    price: "4.2tr",
  },
  {
    id: 3,
    title: "Studio full nội thất Landmark 81",
    image: "/images/House.svg",
    location: "Bình Thạnh, TP.HCM",
    beds: 1,
    baths: 1,
    wifi: true,
    area: "45m²",
    price: "8.5tr",
  },
  {
    id: 4,
    title: "Nhà nguyên căn hầm xe hơi",
    image: "/images/House.svg",
    location: "Gò Vấp, TP.HCM",
    beds: 3,
    baths: 2,
    wifi: true,
    area: "100m²",
    price: "12tr",
  },
  {
    id: 5,
    title: "Dormitory giường tầng giá rẻ",
    image: "/images/House.svg",
    location: "Quận 10, TP.HCM",
    beds: 6,
    baths: 2,
    wifi: true,
    area: "50m²",
    price: "1.8tr",
  },
  {
    id: 6,
    title: "Căn hộ dịch vụ view sông",
    image: "/images/House.svg",
    location: "Thảo Điền, Quận 2",
    beds: 2,
    baths: 2,
    wifi: false,
    area: "75m²",
    price: "15tr",
  },
];

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
  return (
    <section className="py-10 bg-gray-50 min-h-screen w-full">
      <div className="w-full px-4 md:px-6 space-y-8 overflow-hidden">
        {sections.map((section) => (
          <SectionRow
            key={section.id}
            title={section.title}
            subtitle={section.subtitle}
            items={roomsData}
          />
        ))}

      </div>
    </section>
  );
}
