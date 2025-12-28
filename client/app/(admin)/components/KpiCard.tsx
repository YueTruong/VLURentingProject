export default function KpiCard({
  label,
  value,
  delta,
  hint,
  icon,
}: {
  label: string;
  value: string;
  delta?: string;
  hint?: string;
  icon?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-whtie p-5 shadow-sm">
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
        {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="rounded-xl bg-gray-100 px-3 py-2 text-lg">{icon ?? "✨"}</div>
        {delta ? (
          <div className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-meidum text-white">
            {delta}
          </div>
        ) : null}
      </div>
    </div>
  );
}