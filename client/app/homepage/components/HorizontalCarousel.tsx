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
      setShowPrev(scrollLeft > 4);
      setShowNext(scrollLeft + clientWidth < scrollWidth - 4);
    };

    updateButtons();
    node.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);

    return () => {
      node.removeEventListener("scroll", updateButtons);
      window.removeEventListener("resize", updateButtons);
    };
  }, [items.length]);

  const scrollByDirection = (direction: "left" | "right") => {
    const node = sliderRef.current;
    if (!node) return;

    const distance = node.clientWidth * 0.9;
    node.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  return (
    <div className="group/row relative w-full overflow-hidden">
      {showPrev ? (
        <button
          type="button"
          onClick={() => scrollByDirection("left")}
          className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 opacity-0 shadow-md transition hover:bg-gray-50 active:scale-95 group-hover/row:opacity-100"
          aria-label="Cuộn trái"
        >
          ←
        </button>
      ) : null}

      {showNext ? (
        <button
          type="button"
          onClick={() => scrollByDirection("right")}
          className="absolute right-0 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 opacity-0 shadow-md transition hover:bg-gray-50 active:scale-95 group-hover/row:opacity-100"
          aria-label="Cuộn phải"
        >
          →
        </button>
      ) : null}

      <div
        ref={sliderRef}
        className="flex w-full snap-x snap-mandatory flex-nowrap gap-5 overflow-x-auto scroll-smooth pb-5 pl-12 pr-14 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:pl-14 md:pr-16"
      >
        {items.map((room) => (
          <div key={room.id} className="snap-start flex-none">
            <RoomCard
              data={room}
              className="w-[clamp(260px,28vw,380px)] min-w-[clamp(260px,28vw,380px)]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
