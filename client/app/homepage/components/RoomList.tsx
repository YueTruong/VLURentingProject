import RoomCard from "./RoomCard";

// 1. Dữ liệu mẫu (Mock Data)
const roomsData = [
  {
    id: 1,
    title: "Căn hộ mini 2 phòng ngủ rộng rãi",
    image: "/images/House.svg", // Đảm bảo đường dẫn ảnh đúng
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
    title: "Nhà nguyên căn hẻm xe hơi",
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

export default function RoomListBody() {
  return (
    <section className="py-10 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        
        {/* Header của phần Body */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Khám phá phòng trọ nổi bật
            </h2>
            <p className="text-gray-500 mt-2">
              Hơn 10,000 tin đăng mới được cập nhật mỗi ngày
            </p>
          </div>
          
          <button className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
            Xem tất cả phòng <span>&rarr;</span>
          </button>
        </div>

        {/* Lưới sản phẩm (Grid System) */}
        {/* - grid-cols-1: Mobile (1 cột)
            - sm:grid-cols-2: Tablet nhỏ (2 cột)
            - lg:grid-cols-3: Desktop (3 cột)
            - xl:grid-cols-4: Màn hình lớn (4 cột)
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
          {roomsData.map((room) => (
            <RoomCard key={room.id} data={room} />
          ))}
        </div>

        {/* Nút 'Xem thêm' ở dưới cùng (nếu cần) */}
        <div className="mt-12 text-center">
          <button className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition shadow-sm">
            Tải thêm tin đăng
          </button>
        </div>

      </div>
    </section>
  );
}