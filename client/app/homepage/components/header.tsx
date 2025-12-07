import Image from 'next/image';
// import SelectBox from "./SelectBox"

export default function Header() {
  return (
    <div className="flex flex-col w-full">
      {/* 1. TOP HEADER (Màu xanh đậm) */}
      <header className="w-full bg-[#010433] text-white relative z-20">
        <div className="w-full mx-auto flex items-center justify-between py-4 px-12 h-[100px]">
          {/* Left: Logo */}
          <div className="shrink-0">
            <Image
              src="/images/VLU-Renting-Logo.svg"
              alt="VLU Renting"
              width={187}
              height={74}
              className="object-contain"
            />
          </div>

          {/* Center: Title & Subtitle - Căn giữa tuyệt đối */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center hidden md:block">
            <h1 className="text-[42px] font-extrabold tracking-wide">
              <span className="text-white">VLU</span>{' '}
              <span className="text-[#D51F35]">Renting</span>
            </h1>
            <p className="text-[16px] text-gray-300 font-light -mt-1">
              Trang web giúp sinh viên Văn Lang tìm kiếm nhà trọ phù hợp
            </p>
          </div>

          {/* Right: User Button */}
          <button
            className="
            shrink-0 w-[140px] h-10 
            bg-white text-black rounded-full 
            flex items-center justify-center gap-2 
            font-semibold text-sm shadow-md 
            hover:bg-gray-100 transition-all active:scale-95
          "
          >
            {/* User Icon */}
            <div className="w-5 h-5 relative">
              <Image
                src="/icons/UserIcon.svg"
                alt="user"
                fill
                className="object-contain"
              />
            </div>
            Thành viên
          </button>
        </div>
      </header>

      {/* 2. HERO BANNER & SEARCH BAR */}
      <div className="relative w-full h-[276px]">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/Background-Image.svg')" }}
        >
          {/* Lớp phủ tối nhẹ nếu ảnh nền quá sáng */}
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* 3. THANH TÌM KIẾM (SEARCH BAR) */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-full max-w-5xl px-4">
          <div className="bg-white rounded-[10px] shadow-xl p-2 flex flex-col md:flex-row items-center gap-2">
            {/* Input: Tìm kiếm */}
            <div className="
              flex-1 flex items-center px-4 w-full h-12 border-b md:border-b-0 md:border-r border-gray-200
            ">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-gray-400 mr-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm nhà trọ..."
                className="w-full outline-none text-gray-700 placeholder-gray-500"
              />
            </div>

            {/* Dropdown: Chọn cơ sở */}
            <div className="
              flex items-center
              w-[180px] h-12 px-4
              border-b border-gray-200
              md:border-b-0 md:border-r
              cursor-pointer rounded-lg transition hover:bg-gray-50
            ">
              <span className="text-[#D51F35] mr-2">📍</span>
              <select className="w-full bg-transparent outline-none text-gray-700 font-medium cursor-pointer appearance-none">
                <option value="">Chọn cơ sở</option>
                <option value="cs1">Cơ sở 1 (Nguyễn Khắc Nhu)</option>
                <option value="cs2">Cơ sở 2 (Đặng Thùy Trâm)</option>
                <option value="cs3">Cơ sở 3 (LVL)</option>
              </select>
              {/* Mũi tên nhỏ cho đẹp */}
              <svg
                className="w-4 h-4 text-gray-400 ml-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>

            {/* Dropdown: Chọn giá tiền */}
            <div className="flex items-center px-4 w-[180px] h-12 border-b md:border-b-0 md:border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition rounded-lg">
              <span className="text-[#D51F35] mr-2">🏷️</span>
              <select className="w-full bg-transparent outline-none text-gray-700 font-medium cursor-pointer appearance-none">
                <option value="">Chọn giá tiền</option>
                <option value="duoi-3tr">Dưới 3 triệu</option>
                <option value="3tr-5tr">3 triệu - 5 triệu</option>
                <option value="tren-5tr">Trên 5 triệu</option>
              </select>
              <svg
                className="w- h-4 text-gray-400 ml-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>

            {/* Button: Search */}
            <button
              className="
              bg-[#D51F35] text-white 
              px-8 h-12 rounded-[10px]
              font-bold shadow-md 
              hover:bg-[#b01628] transition-all duration-300 ease-in-out active:scale-95
              w-full md:w-auto
            "
            >
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
