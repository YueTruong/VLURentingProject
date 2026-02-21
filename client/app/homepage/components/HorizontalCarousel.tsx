import { useEffect, useRef, useState } from "react";
import RoomCard, { type RoomCardData } from "./RoomCard";

type CarouselProps = {
  items: RoomCardData[];
};

export default function HorizontalCarousel({ items }: CarouselProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [showPrev, setShowPrev] = useState(false);
  const [showNext, setShowNext] = useState(false);

  useEffect(() => {
    const node = sliderRef.current;
    if (!node) return;

    const updateButtons = () => {
      const { scrollLeft, scrollWidth, clientWidth } = node;
      // Dùng Math.ceil và Math.floor để xử lý lỗi số thập phân (fractional pixels) trên các màn hình Retina
      setShowPrev(Math.ceil(scrollLeft) > 4);
      setShowNext(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 4);
    };

    // Timeout nhỏ để DOM render xong CSS trước khi tính toán
    const timer = setTimeout(updateButtons, 100);

    node.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);

    return () => {
      clearTimeout(timer);
      node.removeEventListener("scroll", updateButtons);
      window.removeEventListener("resize", updateButtons);
    };
  }, [items.length]);

  const scrollByDirection = (direction: "left" | "right") => {
    const node = sliderRef.current;
    if (!node) return;

    // Cuộn 80% chiều rộng để người dùng nhìn thấy một phần của thẻ tiếp theo/trước đó
    const distance = node.clientWidth * 0.8;
    node.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="group/row relative w-full overflow-hidden">
      {showPrev ? (
        <button
          type="button"
          onClick={() => scrollByDirection("left")}
          // Nâng cấp: Ẩn trên mobile (hidden md:flex), thêm Dark Mode, hiệu ứng kính mờ (backdrop-blur)
          className="absolute left-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-700 opacity-0 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-white active:scale-95 group-hover/row:opacity-100 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800 md:flex"
          aria-label="Cuộn trái"
        >
          {/* Nâng cấp: Dùng SVG Icon thay vì chữ Text */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      ) : null}

      {showNext ? (
        <button
          type="button"
          onClick={() => scrollByDirection("right")}
          className="absolute right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-700 opacity-0 shadow-md backdrop-blur-sm transition-all hover:scale-110 hover:bg-white active:scale-95 group-hover/row:opacity-100 dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-200 dark:hover:bg-gray-800 md:flex"
          aria-label="Cuộn phải"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      ) : null}

      <div
        ref={sliderRef}
        className="flex w-full snap-x snap-mandatory flex-nowrap gap-5 overflow-x-auto scroll-smooth pb-5 pl-4 pr-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:pl-14 md:pr-16"
      >
        {items.map((room) => (
          <div key={room.id} className="snap-start flex-none">
            {/* Nâng cấp width cho thẻ: trên mobile rộng hơn một chút để người dùng dễ nhìn thấy nó scroll ngang */}
            <RoomCard
              data={room}
              className="w-[clamp(270px,80vw,340px)] min-w-[clamp(270px,80vw,340px)] md:w-[clamp(260px,28vw,380px)] md:min-w-[clamp(260px,28vw,380px)]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}