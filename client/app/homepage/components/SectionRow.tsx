import { useEffect, useMemo, useState } from "react";
import HorizontalCarousel from "./HorizontalCarousel";
import { RoomCardData } from "./RoomCard";

type SectionRowProps = {
  title: string;
  subtitle?: string;
  items: RoomCardData[];
};

// Tính số lượng card muốn hiển thị theo kích thước màn hình
const tínhSốHiểnThị = (width: number) => {
  if (width >= 1280) return 6;
  if (width >= 1024) return 5;
  if (width >= 768) return 4;
  if (width >= 640) return 3;
  return 2;
};

export default function SectionRow({ title, subtitle, items }: SectionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sốHiểnThị, setSốHiểnThị] = useState(5);

  // Cập nhật số card hiển thị theo kích thước màn hình
  useEffect(() => {
    const cậpNhật = () => {
      const w = typeof window !== "undefined" ? window.innerWidth : 1280;
      setSốHiểnThị(tínhSốHiểnThị(w));
    };
    cậpNhật();
    window.addEventListener("resize", cậpNhật);
    return () => window.removeEventListener("resize", cậpNhật);
  }, []);

  const danhSáchHiểnThị = useMemo(() => {
    if (isExpanded) return items;
    return items.slice(0, sốHiểnThị);
  }, [isExpanded, items, sốHiểnThị]);

  const nhãnNút = isExpanded ? "Thu gọn" : "Xem thêm";

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm p-4 md:p-6">
      <div className="grid gap-6 md:grid-cols-[260px_1fr] items-start">
        <div className="relative">
          <div className="rounded-2xl border border-gray-200 bg-linear-to-br from-white via-white to-gray-50 shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-5 h-full flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-800 leading-tight">{title}</h3>
              {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              {nhãnNút}
            </button>
          </div>
        </div>

        <HorizontalCarousel items={danhSáchHiểnThị} />
      </div>
    </div>
  );
}
