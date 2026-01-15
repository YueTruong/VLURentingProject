"use client";


export default function MapSection() {
  const embedSrc = "https://www.google.com/maps?q=V%C4%83n%20Lang%20University%20Ho%20Chi%20Minh&output=embed";

  return (
    <section className="py-10 bg-white w-full">
      <div className="w-full px-4 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Bản đồ khu vực
            </h2>
            <p className="mt-1 text-gray-600">
              Xem vị trí và khu vực lân cận để chọn phòng thuận tiện.
            </p>
          </div>

          <a
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            href="https://www.google.com/maps"
            target="_blank"
            rel="noreferrer"
          >
            Mở Google Maps →
          </a>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="h-[420px] w-full">
            <iframe
              title="VLU Renting Map"
              src={embedSrc}
              className="block h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3">
            <div className="text-sm text-gray-600">
              Gợi ý: Có thể lọc theo khoảng cách ở phần Filters (làm sau).
            </div>
            
            <div className="flex gap-2">
              <button className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                Xem quanh đây
              </button>
              <button className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50">
                Tìm theo vị trí
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}