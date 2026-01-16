"use client";

import {
  CaretSortIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon,
} from "@radix-ui/react-icons";
import { ReactNode, useMemo, useState } from "react";

export type Column<T> = {
  key: string;
  header?: string;
  width?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
};

type SortDir = "asc" | "desc";

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  pageSize?: number;
  rowKey: (row: T) => string;
  emptyText?: string;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string;
};

export default function DataTable<T>({
  rows,
  columns,
  pageSize = 8,
  rowKey,
  emptyText = "Không có dữ liệu",
  onRowClick,
  getRowClassName,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((column) => column.key === sortKey);
    if (!col) return rows;

    const getVal =
      col.sortValue ??
      ((record: T) => {
        const value = (record as unknown as Record<string, unknown>)[sortKey];
        if (typeof value === "number" || typeof value === "string") return value;
        return String(value ?? "");
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

  function toggleSort(key: string) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
      setPage(1);
      return;
    }
    setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    setPage(1);
  }

  const startRow = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRow = Math.min(sorted.length, safePage * pageSize);
  const clickable = Boolean(onRowClick);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full table-fixed border-separate border-spacing-0 text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
            <tr>
              {columns.map((column) => {
                const isActive = sortKey === column.key;
                const alignClass =
                  column.align === "center"
                    ? "text-center"
                    : column.align === "right"
                      ? "text-right"
                      : "text-left";
                return (
                  <th
                    key={column.key}
                    style={{ width: column.width }}
                    className={`px-4 py-3 font-semibold ${alignClass}`}
                  >
                    {column.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="inline-flex items-center gap-1.5 text-gray-700 hover:text-gray-900"
                      >
                        <span>{column.header}</span>
                        {isActive ? (
                          <span className="text-[11px]">
                            {sortDir === "asc" ? "↑" : "↓"}
                          </span>
                        ) : (
                          <CaretSortIcon className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {paged.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={columns.length}>
                  {emptyText}
                </td>
              </tr>
            ) : (
              paged.map((row) => {
                const baseRowClass = clickable
                  ? "cursor-pointer hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-900/10"
                  : "hover:bg-gray-50/60";
                const extraClass = getRowClassName ? getRowClassName(row) : "";
                return (
                  <tr
                    key={rowKey(row)}
                    onClick={() => (onRowClick ? onRowClick(row) : undefined)}
                    onKeyDown={(event) => {
                      if (!onRowClick) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onRowClick(row);
                      }
                    }}
                    tabIndex={onRowClick ? 0 : undefined}
                    className={`${baseRowClass} ${extraClass}`}
                  >
                    {columns.map((column) => {
                      const alignClass =
                        column.align === "center"
                          ? "text-center"
                          : column.align === "right"
                            ? "text-right"
                            : "text-left";
                      return (
                        <td key={column.key} className={`px-4 py-3 align-middle ${alignClass}`}>
                          {column.render
                            ? column.render(row)
                            : String((row as unknown as Record<string, unknown>)[column.key] ?? "")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-3 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-gray-500">
          Hiển thị{" "}
          <span className="font-medium text-gray-900">
            {startRow}-{endRow}
          </span>{" "}
          / {sorted.length} dòng
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(1)}
            disabled={safePage === 1}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <DoubleArrowLeftIcon className="h-3.5 w-3.5" />
            Đầu
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeftIcon className="h-3.5 w-3.5" />
            Trước
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sau
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={safePage === totalPages}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cuối
            <DoubleArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
