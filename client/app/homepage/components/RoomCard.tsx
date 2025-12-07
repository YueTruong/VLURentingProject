import Image from "next/image";

// Định nghĩa kiểu dữ liệu cho Room
interface RoomProps {
  data: {
    id: number;
    title: string;
    image: string;
    location: string;
    beds: number;
    baths: number;
    wifi: boolean;
    area: string;
    price: string;
  };
}

export default function RoomCard({ data }: RoomProps) {
  return (
    <div className="
      w-full bg-white rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.1)]
      overflow-hidden flex flex-col
      hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:-translate-y-1
      transition-all duration-300 cursor-pointer group
    ">
      
      {/* Image */}
      <div className="relative w-full h-[180px] overflow-hidden">
        <Image
          src={data.image}
          alt={data.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Like button */}
        <button className="
          absolute top-3 right-3
          bg-white w-8 h-8 rounded-full shadow
          flex items-center justify-center
          hover:bg-red-50 hover:text-red-500 transition-colors
        ">
          ❤️
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-2">

        <h3 className="font-semibold text-[18px] line-clamp-1" title={data.title}>
          {data.title}
        </h3>

        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <span>📍</span>
          <span className="truncate">{data.location}</span>
        </div>

        {/* Info icons */}
        <div className="flex items-center justify-between mt-2 text-gray-700">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">🛏 {data.beds}</div>
            <div className="flex items-center gap-1">🚿 {data.baths}</div>
            <div className="flex items-center gap-1">
                {data.wifi ? '📶 Free' : '📶 No'}
            </div>
            <div>{data.area}</div>
          </div>
        </div>

        <hr className="border-dashed border-gray-200 mt-2"/>

        {/* Price + button */}
        <div className="flex items-center justify-between mt-2">
          <p className="text-red-500 font-bold text-[18px]">
            {data.price} <span className="text-gray-500 text-sm font-normal">/ tháng</span>
          </p>
          <button className="
            bg-blue-50 text-blue-600 
            px-4 py-1.5 rounded-[10px] text-sm font-medium
            hover:bg-blue-600 hover:text-white transition-all duration-300
          ">
            Xem ngay
          </button>
        </div>

      </div>
    </div>
  );
}