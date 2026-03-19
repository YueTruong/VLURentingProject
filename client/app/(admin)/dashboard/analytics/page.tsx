"use client";

import { type ChangeEvent, useDeferredValue, useMemo, useState } from "react";
import SectionCard from "../../components/SectionCard";
import FiltersBar from "../../components/FiltersBar";
import LineTrend from "../../components/charts/LineTrend";
import BarKpi from "../../components/charts/BarKpi";
import DataTable, { type Column } from "../../components/DataTable";
import StatusBadge, { type BadgeTone } from "../../components/StatusBadge";
import {
  trendUsers,
  trendListings,
  barSources,
  users,
  listings,
  type UserRow,
  type ListingRow,
} from "../../components/mock/data";

type UserStatus = "ACTIVE" | "PENDING" | "BLOCKED";
type ListingStatus = "APPROVED" | "PENDING" | "REJECTED";
type UserStatusFilter = "all" | UserStatus;
type ListingStatusFilter = "all" | ListingStatus;

type UserFilterable = {
  username: string;
  email: string;
  status: UserStatus;
};

type ListingFilterable = {
  title: string;
  owner: string;
  city: string;
  status: ListingStatus;
};

const USER_STATUS_OPTIONS = [
  { value: "all", label: "All users" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "BLOCKED", label: "Blocked" },
] satisfies { value: UserStatusFilter; label: string }[];

const LISTING_STATUS_OPTIONS = [
  { value: "all", label: "All listings" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
] satisfies { value: ListingStatusFilter; label: string }[];

const STATUS_TONE_MAP: Record<UserStatus | ListingStatus, BadgeTone> = {
  ACTIVE: "green",
  APPROVED: "green",
  PENDING: "yellow",
  BLOCKED: "red",
  REJECTED: "red",
};

function isUserStatusFilter(value: string): value is UserStatusFilter {
  return value === "all" || value === "ACTIVE" || value === "PENDING" || value === "BLOCKED";
}

function isListingStatusFilter(value: string): value is ListingStatusFilter {
  return value === "all" || value === "APPROVED" || value === "PENDING" || value === "REJECTED";
}

function includesQ(value: string, q: string) {
  const normalizedValue = value.trim().toLowerCase();
  const normalizedQ = q.trim().toLowerCase();
  return normalizedValue.includes(normalizedQ);
}

function exportJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function mapStatusToTone(status: UserStatus | ListingStatus): BadgeTone {
  return STATUS_TONE_MAP[status];
}

function filterUsers<T extends UserFilterable>(rows: readonly T[], q: string, status: UserStatusFilter) {
  const normalizedQ = q.trim();

  return rows.filter((row) => {
    const matchesQ =
      normalizedQ.length === 0 || includesQ(row.username, normalizedQ) || includesQ(row.email, normalizedQ);
    const matchesStatus = status === "all" || row.status === status;

    return matchesQ && matchesStatus;
  });
}

function filterListings<T extends ListingFilterable>(rows: readonly T[], q: string, status: ListingStatusFilter) {
  const normalizedQ = q.trim();

  return rows.filter((row) => {
    const matchesQ =
      normalizedQ.length === 0 ||
      includesQ(row.title, normalizedQ) ||
      includesQ(row.owner, normalizedQ) ||
      includesQ(row.city, normalizedQ);
    const matchesStatus = status === "all" || row.status === status;

    return matchesQ && matchesStatus;
  });
}

function useUserFilters<T extends UserFilterable>({
  rows,
  q,
  status,
}: {
  rows: readonly T[];
  q: string;
  status: UserStatusFilter;
}) {
  return useMemo(() => filterUsers(rows, q, status), [q, rows, status]);
}

function useListingFilters<T extends ListingFilterable>({
  rows,
  q,
  status,
}: {
  rows: readonly T[];
  q: string;
  status: ListingStatusFilter;
}) {
  return useMemo(() => filterListings(rows, q, status), [q, rows, status]);
}

export default function AnalyticsPage() {
  const [q, setQ] = useState("");
  const [userStatus, setUserStatus] = useState<UserStatusFilter>("all");
  const [listingStatus, setListingStatus] = useState<ListingStatusFilter>("all");

  const userStatusOptions = useMemo(() => USER_STATUS_OPTIONS, []);
  const listingStatusOptions = useMemo(() => LISTING_STATUS_OPTIONS, []);
  const deferredQ = useDeferredValue(q);
  const filteredUsers = useUserFilters({
    rows: users,
    q: deferredQ,
    status: userStatus,
  });
  const filteredListings = useListingFilters({
    rows: listings,
    q: deferredQ,
    status: listingStatus,
  });

  const userCols = useMemo<Column<UserRow>[]>(
    () => [
      { key: "username", header: "Username", sortable: true },
      { key: "email", header: "Email" },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => <StatusBadge label={row.status} tone={mapStatusToTone(row.status)} />,
        sortValue: (row) => row.status,
      },
      { key: "createdAt", header: "Created", sortable: true },
    ],
    [],
  );

  const listingCols = useMemo<Column<ListingRow>[]>(
    () => [
      { key: "title", header: "Title" },
      { key: "owner", header: "Owner", sortable: true },
      { key: "city", header: "City", sortable: true },
      {
        key: "price",
        header: "Price",
        sortable: true,
        render: (row) => (
          <span className="font-medium">
            {row.price.toLocaleString("vi-VN")} {"\u20ab"}
          </span>
        ),
        sortValue: (row) => row.price,
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (row) => <StatusBadge label={row.status} tone={mapStatusToTone(row.status)} />,
        sortValue: (row) => row.status,
      },
    ],
    [],
  );

  function handleUserStatusChange(value: string) {
    if (!isUserStatusFilter(value)) return;
    setUserStatus(value);
  }

  function handleListingStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    if (!isListingStatusFilter(event.target.value)) return;
    setListingStatus(event.target.value);
  }

  function handleExportReport() {
    const exportedAt = new Date().toISOString();
    const safeTimestamp = exportedAt.replace(/[:.]/g, "-");
    const exportedUsers = filterUsers(users, q, userStatus);
    const exportedListings = filterListings(listings, q, listingStatus);

    exportJson(`analytics-report-${safeTimestamp}.json`, {
      exportedAt,
      filters: {
        q,
        userStatus,
        listingStatus,
      },
      summary: {
        users: {
          total: users.length,
          filtered: exportedUsers.length,
        },
        listings: {
          total: listings.length,
          filtered: exportedListings.length,
        },
      },
      data: {
        filteredUsers: exportedUsers,
        filteredListings: exportedListings,
        trendUsers,
        trendListings,
        barSources,
      },
    });
  }

  return (
    <div className="space-y-6">
      <SectionCard
        title="Analytics Dashboard"
        subtitle="Track trends, sources, and operational health"
        right={
          <button
            type="button"
            onClick={handleExportReport}
            className="rounded-xl bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
          >
            Export report
          </button>
        }
      >
        <FiltersBar
          q={q}
          onQ={setQ}
          status={userStatus}
          onStatus={handleUserStatusChange}
          statusOptions={userStatusOptions}
          right={
            <div className="flex w-full items-center gap-2 md:w-60">
              <label className="text-sm text-gray-600" htmlFor="listing-status-filter">
                Listing status
              </label>
              <select
                id="listing-status-filter"
                value={listingStatus}
                onChange={handleListingStatusChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-1 ring-transparent transition focus:border-gray-300 focus:ring-gray-900/10"
              >
                {listingStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          }
        />
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="User Trends" subtitle="Weekly new users">
          <LineTrend data={trendUsers} />
        </SectionCard>

        <SectionCard title="Listings Trends" subtitle="Weekly created listings">
          <LineTrend data={trendListings} />
        </SectionCard>
      </div>

      <SectionCard title="Acquisition Sources" subtitle="Where users come from">
        <BarKpi data={barSources} />
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="Users" subtitle="Filtered by your search">
          <DataTable<UserRow> rows={filteredUsers} columns={userCols} pageSize={6} rowKey={(row) => row.id} />
        </SectionCard>

        <SectionCard title="Latest Listings" subtitle="Operational queue">
          <DataTable<ListingRow>
            rows={filteredListings}
            columns={listingCols}
            pageSize={6}
            rowKey={(row) => row.id}
          />
        </SectionCard>
      </div>
    </div>
  );
}
