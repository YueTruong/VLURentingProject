"use client";

export type FilterOption = { value: string, label: string};

export default function FiltersBar({
  q, onQ,
  status,
  onStatus,
  statusOptions,
  right,
}: {
  q: string;
  onQ: (v: string) => void;
  status: string,
  onStatus: (v: string) => void;
  statusOptions: FilterOption[];
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-3 md: md:flex-row md:items-center">
        <input
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="Search..."
          className="w-full md:w-[320px] rounded-xl border borderg-gray-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-900/10"
        />

        <select 
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          className="w-full md:w-[220px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outlie-none focus:ring-2 focus:ring-gray-900/10"
        >
          {statusOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {right ? <div className="flex justify-end">{right}</div> : null}
    </div>
  );
}