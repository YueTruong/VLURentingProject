import Link from "next/link";
import HorizontalCarousel from "./HorizontalCarousel";
import { RoomCardData } from "./RoomCard";

type SectionRowProps = {
  title: string;
  subtitle?: string;
  items: RoomCardData[];
};

export default function SectionRow({ title, subtitle, items }: SectionRowProps) {
  return (
    <div className="w-full overflow-hidden rounded-[24px] border border-[color:var(--theme-border)] bg-[color:var(--theme-surface)] p-4 shadow-sm md:p-6">
      <div className="grid items-start gap-6 md:grid-cols-[260px_1fr]">
        <div className="relative">
          <div
            className="flex h-full flex-col justify-between rounded-2xl border border-[color:var(--theme-border)] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
            style={{
              backgroundImage:
                "linear-gradient(135deg, var(--theme-surface) 0%, var(--theme-surface-muted) 100%)",
            }}
          >
            <div className="space-y-2">
              <h3 className="text-2xl font-bold leading-tight text-[color:var(--theme-text)]">{title}</h3>
              {subtitle ? <p className="text-sm text-[color:var(--theme-text-muted)]">{subtitle}</p> : null}
            </div>
            <Link
              href="/listings"
              className="flex items-center gap-1 font-semibold text-[color:var(--brand-accent)] hover:text-[color:var(--brand-accent-strong)]"
            >
              Xem tất cả →
            </Link>
          </div>
        </div>

        <HorizontalCarousel items={items} />
      </div>
    </div>
  );
}
