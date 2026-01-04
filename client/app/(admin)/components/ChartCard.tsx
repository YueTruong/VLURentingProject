import { ReactNode } from "react";
import SectionCard from "./SectionCard";

type RangeValue = string;

type RangeOption = {
  label: string;
  value: RangeValue;
};

type ChartCardProps = {
  title: string;
  subtitle?: string;
  ranges: RangeOption[];
  activeRange: RangeValue;
  onRangeChange: (value: RangeValue) => void;
  children: ReactNode;
};

export default function ChartCard({
  title,
  subtitle,
  ranges,
  activeRange,
  onRangeChange,
  children,
}: ChartCardProps) {
  return (
    <SectionCard
      title={title}
      subtitle={subtitle}
      right={
        <div className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 text-xs font-semibold text-gray-600 shadow-inner">
          {ranges.map((range) => {
            const active = range.value === activeRange;
            return (
              <button
                key={range.value}
                type="button"
                onClick={() => onRangeChange(range.value)}
                className={[
                  "rounded-lg px-3 py-1.5 transition",
                  active
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100",
                ].join(" ")}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      }
    >
      {children}
    </SectionCard>
  );
}
