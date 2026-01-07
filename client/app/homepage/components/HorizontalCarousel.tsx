import { useEffect, useRef, useState } from "react";
import RoomCard, { RoomCardData } from "./RoomCard";

type CarouselProps = {
  items: RoomCardData[];
};

export default function HorizontalCarousel({ items }: CarouselProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [hiểnThịPrev, setHiểnThịPrev] = useState(false);
  const [hiểnThịNext, setHiểnThịNext] = useState(true);

  // Cập nhật hiển thị nút dựa trên vị trí cuộn hiện tại
  const cậpNhậtTrạngTháiNút = () => {
    const node = sliderRef.current;
    if (!node) return;
    const { scrollLeft, scrollWidth, clientWidth } = node;
    setHiểnThịPrev(scrollLeft > 4);
    setHiểnThịNext(scrollLeft + clientWidth < scrollWidth - 4);
  };

  const cuộn = (hướng: "trái" | "phải") => {
    const node = sliderRef.current;
    if (!node) return;
    const khoảngCách = node.clientWidth * 0.9;
    node.scrollBy({
      left: hướng === "trái" ? -khoảngCách : khoảngCách,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const node = sliderRef.current;
    if (!node) return;
    cậpNhậtTrạngTháiNút();
    node.addEventListener("scroll", cậpNhậtTrạngTháiNút, { passive: true });
    return () => {
      node.removeEventListener("scroll", cậpNhậtTrạngTháiNút);
    };
  }, []);

  return (
    <div className="relative group/row w-full overflow-hidden">
      {/* Nút Prev đặt ngoài danh sách, chỉ hiển thị khi đã cuộn */}
      {hiểnThịPrev ? (
        <button
          type="button"
          onClick={() => cuộn("trái")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full border border-gray-200 bg-white text-gray-700 shadow-md h-11 w-11 flex items-center justify-center transition hover:bg-gray-50 active:scale-95 opacity-0 group-hover/row:opacity-100"
          aria-label="Cuộn trái"
        >
          ←
        </button>
      ) : null}

      {/* Nút Next đặt ngoài danh sách, ẩn khi tới cuối */}
      {hiểnThịNext ? (
        <button
          type="button"
          onClick={() => cuộn("phải")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full border border-gray-200 bg-white text-gray-700 shadow-md h-11 w-11 flex items-center justify-center transition hover:bg-gray-50 active:scale-95 opacity-0 group-hover/row:opacity-100"
          aria-label="Cuộn phải"
        >
          →
        </button>
      ) : null}

      {/* Vùng scroll chính, chừa padding hai bên để nút không che card */}
      <div
        ref={sliderRef}
        className="flex w-full flex-nowrap gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-5 pl-12 pr-14 md:pl-14 md:pr-16 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((room) => (
          <div key={room.id} className="snap-start">
            <RoomCard
              data={room}
              className="w-[330px] min-w-[330px] lg:w-[350px] lg:min-w-[350px]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
