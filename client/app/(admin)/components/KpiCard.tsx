import { ArrowDownIcon, ArrowUpIcon } from "@radix-ui/react-icons";
import { ReactNode } from "react";

type KpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  delta?: { value: string; trend: "up" | "down" };
};

export default function KpiCard({ label, value, delta, hint, icon }: KpiCardProps) {
  const DeltaIcon = delta?.trend === "down" ? ArrowDownIcon : ArrowUpIcon;
  const iconNode = icon ?? <span className="text-lg font-semibold text-gray-800">•</span>;
  const deltaStyle =
    delta?.trend === "down"
      ? "bg-red-50 text-red-700 ring-1 ring-red-100"
      : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";

  return (
    <div className="flex items-start justify-between rounded-2xl border border-gray-200 bg-white/80 p-5 shadow-sm ring-1 ring-gray-100/60">
      <div className="space-y-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
        {hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
      </div>

      <div className="flex flex-col items-end gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white shadow-inner">
          {iconNode}
        </div>
        {delta ? (
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${deltaStyle}`}>
            <DeltaIcon className="h-3.5 w-3.5" />
            {delta.value}
          </span>
        ) : null}
      </div>
    </div>
  );
}
