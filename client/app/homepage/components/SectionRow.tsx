import HorizontalCarousel from "./HorizontalCarousel";
import { RoomCardData } from "./RoomCard";

type SectionRowProps = {
  title: string;
  subtitle?: string;
  items: RoomCardData[];
};

export default function SectionRow({ title, subtitle, items }: SectionRowProps) {
  return (
    <div className="w-full overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm p-4 md:p-6">
      <div className="grid gap-6 md:grid-cols-[260px_1fr] items-start">
        <div className="relative">
          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-gray-50 shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-5 h-full flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-800 leading-tight">{title}</h3>
              {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
            </div>
            <button className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
              Xem tất cả →
            </button>
          </div>
        </div>

        <HorizontalCarousel items={items} />
      </div>
    </div>
  );
}
