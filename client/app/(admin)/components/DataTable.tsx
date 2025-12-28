"use client"

import { useMemo, useState } from "react";

export type Column<T> = {
  key: string;
  header?: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
};

type SortDir = "asc" | "desc";

export default function DataTable<T>({
  rows,
  columns, 
  pageSize = 8,
  rowKey,
  emptyText = "No data",
}: {
  rows: T[];
  columns: Column<T>[];
  pageSize?: number;
  rowKey: (row: T) => string;
  emptyText?: string;
}) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return rows;

    const getVal = 
      col.sortValue ??
      ((r: T) => {
        const x = (r as unknown as Record<string, unknown>)[sortKey];
        if (typeof x === "number" || typeof x === "string") return x;
        return String(x ?? "");
      });

    const copy = [...rows];
    copy.sort((a, b) => {
      const va = getVal(a);
      const vb = getVal(b);
      const na = typeof va === "number";
      const nb = typeof vb === "number";
      if (na && nb) return (va as number) - (vb as number);
      return String(va).localeCompare(String(vb));
    });

    return sortDir === "asc" ? copy : copy.reverse();
  }, [rows, columns, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, safePage, pageSize]);

  function toggleSort(k: string) {
    if (sortKey !== k) {
      setSortKey(k);
      setSortDir("asc");
      setPage(1)
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    setPage(1);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <div className="overflow-x-auto bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              {columns.map((c) => {
                const isActive = sortKey === c.key;
                return (
                  <th 
                    key={c.key}
                    style={{ width: c.width }}
                    className="px-4 py-3 font-semibold"
                  >
                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex items-center gap-2 hover:text-gray-900"
                      >
                        {c.header}
                        <span className="text-[10px]">
                          {isActive ? (sortDir === "asc" ? "▲" : "▼"): "↕"}
                        </span>
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {paged.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan = {columns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={rowKey(row)} className="hover:bg-gray-50/60">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 align-middle">
                      {c.render ? c.render(row) : String((row as unknown as Record<string, unknown>)[c.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex items-center justify-between gap-3 bg-white px-4 py-3">
        <div className="text-xs text-gray-500">
          Page <span className="font-medium text-gray-900">{safePage}</span> / {totalPages} •{" "} {sorted.length} rows
        </div>
      
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={safePage === 1}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            First
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Next
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={safePage === totalPages}
            className="rounded-xl border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  )
}