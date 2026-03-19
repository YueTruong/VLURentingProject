"use client";

export default function MapSection() {
  const embedSrc =
    "https://www.google.com/maps?q=V%C4%83n%20Lang%20University%20Ho%20Chi%20Minh&output=embed";

  return (
    <section className="w-full bg-transparent py-10">
      <div className="w-full px-4 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-(--theme-text)">Bản đồ khu vực</h2>
            <p className="mt-1 text-(--theme-text-muted)">
              Xem vị trí và khu vực lân cận để chọn phòng thuận tiện.
            </p>
          </div>

          <a
            className="text-sm font-semibold text-(--brand-primary-text) hover:text-(--brand-accent)"
            href="https://www.google.com/maps"
            target="_blank"
            rel="noreferrer"
          >
            Mở Google Maps →
          </a>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-(--theme-border) bg-(--theme-surface) shadow-sm">
          <div className="h-[420px] w-full">
            <iframe
              title="VLU Renting Map"
              src={embedSrc}
              className="block h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-(--theme-border) px-4 py-3">
            <div className="flex gap-2" />
          </div>
        </div>
      </div>
    </section>
  );
}
