"use client";

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { ChangeEvent, ReactNode } from "react";

export type FilterOption = { value: string; label: string };

type FiltersBarProps = {
  q: string;
  onQ: (v: string) => void;
  status: string;
  onStatus: (v: string) => void;
  statusOptions: FilterOption[];
  right?: ReactNode;
  placeholder?: string;
};

export default function FiltersBar({
  q,
  onQ,
  status,
  onStatus,
  statusOptions,
  right,
  placeholder = "Tìm kiếm...",
}: FiltersBarProps) {
  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    onStatus(event.target.value);
  }

  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    onQ(event.target.value);
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:w-[320px]">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={handleSearch}
            placeholder={placeholder}
            className="w-full rounded-xl border border-gray-200 bg-white px-10 py-2 text-sm outline-none ring-1 ring-transparent transition focus:border-gray-300 focus:ring-gray-900/10"
          />
        </div>

        <div className="flex w-full items-center gap-2 md:w-60">
          <label className="text-sm text-gray-600" htmlFor="status-filter">
            Trạng thái
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={handleStatusChange}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-1 ring-transparent transition focus:border-gray-300 focus:ring-gray-900/10"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {right ? <div className="flex justify-end">{right}</div> : null}
    </div>
  );
}
