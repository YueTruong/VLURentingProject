"use client";

import { useSession } from "next-auth/react";
import { type ChangeEvent, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import SectionCard from "../../components/SectionCard";
import FiltersBar from "../../components/FiltersBar";
import LineTrend from "../../components/charts/LineTrend";
import BarKpi from "../../components/charts/BarKpi";
import DataTable, { type Column } from "../../components/DataTable";
import StatusBadge, { type BadgeTone } from "../../components/StatusBadge";
import {
  getAdminDashboardOverview,
  type AdminDashboardOverview,
  type DashboardListingRow,
  type DashboardListingStatus,
  type DashboardUserRow,
  type DashboardUserStatus,
} from "@/app/services/admin-dashboard";

type LoadErrorType = "auth_failed" | "forbidden" | "load_failed" | null;
type UserStatusFilter = "all" | DashboardUserStatus;
type ListingStatusFilter = "all" | DashboardListingStatus;

type UserFilterable = Pick<DashboardUserRow, "username" | "email" | "status">;
type ListingFilterable = Pick<DashboardListingRow, "title" | "owner" | "city" | "status">;

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
  { value: "HIDDEN", label: "Hidden" },
  { value: "RENTED", label: "Rented" },
] satisfies { value: ListingStatusFilter; label: string }[];

const STATUS_TONE_MAP: Record<DashboardUserStatus | DashboardListingStatus, BadgeTone> = {
  ACTIVE: "green",
  APPROVED: "green",
  PENDING: "yellow",
  BLOCKED: "red",
  REJECTED: "red",
  HIDDEN: "gray",
  RENTED: "blue",
};

function isUserStatusFilter(value: string): value is UserStatusFilter {
  return value === "all" || value === "ACTIVE" || value === "PENDING" || value === "BLOCKED";
}

function isListingStatusFilter(value: string): value is ListingStatusFilter {
  return (
    value === "all" ||
    value === "APPROVED" ||
    value === "PENDING" ||
    value === "REJECTED" ||
    value === "HIDDEN" ||
    value === "RENTED"
  );
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

function mapStatusToTone(status: DashboardUserStatus | DashboardListingStatus): BadgeTone {
  return STATUS_TONE_MAP[status];
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("vi-VN");
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

function EmptyPanel({
  message,
  tone = "neutral",
}: {
  message: string;
  tone?: "neutral" | "danger";
}) {
  const className =
    tone === "danger"
      ? "flex h-[260px] items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm text-rose-700"
      : "flex h-[260px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 text-sm text-gray-500";

  return <div className={className}>{message}</div>;
}

export default function AnalyticsPage() {
  const [q, setQ] = useState("");
  const [userStatus, setUserStatus] = useState<UserStatusFilter>("all");
  const [listingStatus, setListingStatus] = useState<ListingStatusFilter>("all");
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadErrorType>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.user?.accessToken;
  const role = session?.user?.role;
  const normalizedRole = typeof role === "string" ? role.toLowerCase() : undefined;

  const authError = useMemo<LoadErrorType>(() => {
    if (sessionStatus === "loading") return null;
    if (!accessToken) return "auth_failed";
    if (normalizedRole && normalizedRole !== "admin") return "forbidden";
    return null;
  }, [accessToken, normalizedRole, sessionStatus]);

  const fetchOverview = useCallback(async () => {
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setOverview(null);
      setLoadError("auth_failed");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await getAdminDashboardOverview(accessToken);
      setOverview(data);
    } catch (error) {
      const statusCode =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      if (statusCode === 401) {
        setLoadError("auth_failed");
      } else if (statusCode === 403) {
        setLoadError("forbidden");
      } else {
        console.error("Failed to load analytics overview:", error);
        setLoadError("load_failed");
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, sessionStatus]);

  useEffect(() => {
    if (authError) {
      setOverview(null);
      setIsLoading(false);
      return;
    }

    void fetchOverview();
  }, [authError, fetchOverview, refreshKey]);

  const userStatusOptions = useMemo(() => USER_STATUS_OPTIONS, []);
  const listingStatusOptions = useMemo(() => LISTING_STATUS_OPTIONS, []);
  const deferredQ = useDeferredValue(q);
  const users = useMemo(() => overview?.users ?? [], [overview]);
  const listings = useMemo(() => overview?.listings ?? [], [overview]);
  const filteredUsers = useMemo(
    () => filterUsers(users, deferredQ, userStatus),
    [deferredQ, userStatus, users],
  );
  const filteredListings = useMemo(
    () => filterListings(listings, deferredQ, listingStatus),
    [deferredQ, listingStatus, listings],
  );

  const userCols = useMemo<Column<DashboardUserRow>[]>(
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
      {
        key: "createdAt",
        header: "Created",
        sortable: true,
        render: (row) => formatDate(row.createdAt),
        sortValue: (row) => new Date(row.createdAt).getTime(),
      },
    ],
    [],
  );

  const listingCols = useMemo<Column<DashboardListingRow>[]>(
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
      {
        key: "createdAt",
        header: "Created",
        sortable: true,
        render: (row) => formatDate(row.createdAt),
        sortValue: (row) => new Date(row.createdAt).getTime(),
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
        trendUsers: overview?.trendSeries.users["7d"] ?? [],
        trendListings: overview?.trendSeries.listings["7d"] ?? [],
        userRoleBreakdown: overview?.userRoleBreakdown ?? [],
        listingStatusBreakdown: overview?.listingStatusBreakdown ?? [],
      },
    });
  }

  const resolvedLoadError = authError ?? loadError;
  const usersEmptyText = isLoading
    ? "Loading users..."
    : resolvedLoadError
      ? "Users are unavailable."
      : "No users found.";
  const listingsEmptyText = isLoading
    ? "Loading listings..."
    : resolvedLoadError
      ? "Listings are unavailable."
      : "No listings found.";

  return (
    <div className="space-y-6">
      <SectionCard
        title="Analytics Dashboard"
        subtitle="Live trends and operational health from current website data"
        right={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRefreshKey((prev) => prev + 1)}
              disabled={isLoading || sessionStatus === "loading"}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Reload
            </button>
            <button
              type="button"
              onClick={handleExportReport}
              disabled={!overview}
              className="rounded-xl bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Export report
            </button>
          </div>
        }
      >
        <FiltersBar
          q={q}
          onQ={setQ}
          status={userStatus}
          onStatus={handleUserStatusChange}
          statusOptions={userStatusOptions}
          placeholder="Search users, listings, or locations"
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
        {resolvedLoadError === "auth_failed" ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem analytics.
          </div>
        ) : null}
        {resolvedLoadError === "forbidden" ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Tài khoản hiện tại không có quyền truy cập trang analytics.
          </div>
        ) : null}
        {resolvedLoadError === "load_failed" ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Không thể tải dữ liệu analytics. Dùng Reload để thử lại.
          </div>
        ) : null}
      </SectionCard>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="User Trends" subtitle="New users in the last 7 days">
          {resolvedLoadError ? (
            <EmptyPanel message="Không thể tải biểu đồ người dùng." tone="danger" />
          ) : isLoading && !overview ? (
            <EmptyPanel message="Đang tải biểu đồ người dùng..." />
          ) : (
            <LineTrend data={overview?.trendSeries.users["7d"] ?? []} />
          )}
        </SectionCard>

        <SectionCard title="Listings Trends" subtitle="New listings in the last 7 days">
          {resolvedLoadError ? (
            <EmptyPanel message="Không thể tải biểu đồ tin đăng." tone="danger" />
          ) : isLoading && !overview ? (
            <EmptyPanel message="Đang tải biểu đồ tin đăng..." />
          ) : (
            <LineTrend data={overview?.trendSeries.listings["7d"] ?? []} />
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="User Roles" subtitle="Breakdown by account role">
          {resolvedLoadError ? (
            <EmptyPanel message="Không thể tải phân bố vai trò người dùng." tone="danger" />
          ) : isLoading && !overview ? (
            <EmptyPanel message="Đang tải phân bố vai trò người dùng..." />
          ) : (
            <BarKpi data={overview?.userRoleBreakdown ?? []} />
          )}
        </SectionCard>

        <SectionCard title="Listing Statuses" subtitle="Breakdown by moderation status">
          {resolvedLoadError ? (
            <EmptyPanel message="Không thể tải phân bố trạng thái tin đăng." tone="danger" />
          ) : isLoading && !overview ? (
            <EmptyPanel message="Đang tải phân bố trạng thái tin đăng..." />
          ) : (
            <BarKpi data={overview?.listingStatusBreakdown ?? []} />
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="Users" subtitle="Filtered by your search">
          <DataTable<DashboardUserRow>
            rows={filteredUsers}
            columns={userCols}
            pageSize={6}
            rowKey={(row) => row.id}
            emptyText={usersEmptyText}
          />
        </SectionCard>

        <SectionCard title="Listings" subtitle="Filtered operational queue">
          <DataTable<DashboardListingRow>
            rows={filteredListings}
            columns={listingCols}
            pageSize={6}
            rowKey={(row) => row.id}
            emptyText={listingsEmptyText}
          />
        </SectionCard>
      </div>
    </div>
  );
}
