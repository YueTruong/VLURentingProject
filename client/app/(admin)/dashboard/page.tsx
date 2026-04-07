"use client";

import {
  BarChartIcon,
  CheckCircledIcon,
  ClockIcon,
  Cross2Icon,
  HomeIcon,
  PersonIcon,
  RocketIcon,
  TargetIcon,
} from "@radix-ui/react-icons";
import { useSession } from "next-auth/react";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import ChartCard from "../components/ChartCard";
import DataTable, { type Column } from "../components/DataTable";
import FiltersBar from "../components/FiltersBar";
import KpiCard from "../components/KpiCard";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import LineTrend from "../components/charts/LineTrend";
import {
  getAdminDashboardOverview,
  type AdminDashboardOverview,
  type DashboardActivityLog,
  type DashboardTrendRange,
  type DashboardUserRow,
} from "@/app/services/admin-dashboard";

type LoadErrorType = "auth_failed" | "forbidden" | "load_failed" | null;

const rangeOptions: { label: string; value: DashboardTrendRange }[] = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
];

const activityStatusOptions = [
  { value: "all", label: "All status" },
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
];

const kpiIcons: Record<string, ReactNode> = {
  "total-users": <PersonIcon className="h-5 w-5" />,
  "new-users": <RocketIcon className="h-5 w-5" />,
  "total-listings": <HomeIcon className="h-5 w-5" />,
  "approved-listings": <CheckCircledIcon className="h-5 w-5" />,
  "pending-listings": <ClockIcon className="h-5 w-5" />,
  "booking-approval-rate": <TargetIcon className="h-5 w-5" />,
};

const activityButtonClass =
  "rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60";

const getRoleTone = (role: string) => {
  if (role === "ADMIN") return "blue";
  if (role === "LANDLORD") return "yellow";
  if (role === "STUDENT") return "red";
  return "gray";
};

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("vi-VN", {
    hour12: false,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
      ? "flex h-60 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm text-rose-700"
      : "flex h-60 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 text-sm text-gray-500";

  return <div className={className}>{message}</div>;
}

function ActivityDetailModal({
  activity,
  onClose,
}: {
  activity: DashboardActivityLog | null;
  onClose: () => void;
}) {
  if (!activity) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">{formatDateTime(activity.time)}</p>
            <h3 className="text-lg font-semibold text-gray-900">{activity.action}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50"
            aria-label="Close"
          >
            <Cross2Icon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-3 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">User:</span>
            <span>{activity.user}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">Status:</span>
            <StatusBadge
              label={activity.status === "success" ? "Success" : "Failed"}
              tone={activity.status === "success" ? "green" : "red"}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">Channel:</span>
            <span className="uppercase">{activity.channel}</span>
          </div>
          {activity.details ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
              {activity.details}
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState<DashboardTrendRange>("7d");
  const [activityQ, setActivityQ] = useState("");
  const [activityStatus, setActivityStatus] = useState("all");
  const [selectedActivity, setSelectedActivity] = useState<DashboardActivityLog | null>(null);
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
        console.error("Failed to load admin dashboard overview:", error);
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

  const filteredActivities = useMemo(() => {
    const term = activityQ.trim().toLowerCase();
    return (overview?.activities ?? []).filter((item) => {
      const matchesStatus = activityStatus === "all" ? true : item.status === activityStatus;
      const matchesTerm =
        !term ||
        item.user.toLowerCase().includes(term) ||
        item.action.toLowerCase().includes(term) ||
        (item.details ?? "").toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [activityQ, activityStatus, overview]);

  const activityColumns: Column<DashboardActivityLog>[] = [
    {
      key: "time",
      header: "Time",
      width: "160px",
      sortable: true,
      render: (row) => <span className="text-sm text-gray-700">{formatDateTime(row.time)}</span>,
      sortValue: (row) => new Date(row.time).getTime(),
    },
    {
      key: "user",
      header: "User",
      sortable: true,
      render: (row) => <div className="font-medium text-gray-900">{row.user}</div>,
      sortValue: (row) => row.user,
    },
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900">{row.action}</div>
          {row.details ? <p className="text-xs text-gray-500">{row.details}</p> : null}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      align: "right",
      render: (row) => (
        <StatusBadge
          label={row.status === "success" ? "Success" : "Failed"}
          tone={row.status === "success" ? "green" : "red"}
        />
      ),
      sortValue: (row) => row.status,
    },
  ];

  const recentUsers = useMemo(() => (overview?.users ?? []).slice(0, 6), [overview]);

  const userColumns: Column<DashboardUserRow>[] = [
    {
      key: "username",
      header: "User",
      sortable: true,
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-gray-900">{row.username}</div>
          <div className="text-xs text-gray-500">{row.email}</div>
        </div>
      ),
      sortValue: (row) => row.username,
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (row) => <StatusBadge label={row.role} tone={getRoleTone(row.role)} />,
      sortValue: (row) => row.role,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => (
        <StatusBadge
          label={row.status}
          tone={row.status === "ACTIVE" ? "green" : row.status === "PENDING" ? "yellow" : "red"}
        />
      ),
      sortValue: (row) => row.status,
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      render: (row) => (
        <span className="text-sm text-gray-700">
          {new Date(row.createdAt).toLocaleDateString("vi-VN")}
        </span>
      ),
      sortValue: (row) => new Date(row.createdAt).getTime(),
    },
  ];

  const userTrend = overview?.trendSeries.users[range] ?? [];
  const listingTrend = overview?.trendSeries.listings[range] ?? [];
  const resolvedLoadError = authError ?? loadError;
  const activityEmptyText = isLoading
    ? "Loading activity log..."
    : resolvedLoadError === "auth_failed"
      ? "Please sign in again."
      : resolvedLoadError === "forbidden"
        ? "You do not have permission to access this dashboard."
        : resolvedLoadError === "load_failed"
          ? "Failed to load activity log."
          : "No activity found.";

  const recentUsersEmptyText = isLoading
    ? "Loading recent users..."
    : resolvedLoadError
      ? "Recent users are unavailable."
      : "No recent users found.";

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Live operational overview powered by current website data.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((prev) => prev + 1)}
          disabled={isLoading || sessionStatus === "loading"}
          className={activityButtonClass}
        >
          Reload
        </button>
      </div>

      {resolvedLoadError === "auth_failed" ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem thống kê.
        </div>
      ) : null}
      {resolvedLoadError === "forbidden" ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Tài khoản hiện tại không có quyền truy cập dashboard quản trị.
        </div>
      ) : null}
      {resolvedLoadError === "load_failed" ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Không thể tải dữ liệu thống kê. Dùng nút Reload để thử lại.
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(overview?.kpiCards ?? []).map((item) => (
          <KpiCard
            key={item.id}
            label={item.label}
            value={item.value}
            hint={item.hint}
            delta={item.delta}
            icon={kpiIcons[item.id] ?? <BarChartIcon className="h-5 w-5" />}
          />
        ))}
        {isLoading && !overview
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`kpi-skeleton-${index}`}
                className="h-[136px] animate-pulse rounded-2xl border border-gray-200 bg-gray-100/80"
              />
            ))
          : null}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Users growth"
          subtitle="New accounts created in the selected window"
          ranges={rangeOptions}
          activeRange={range}
          onRangeChange={(value) => setRange(value as DashboardTrendRange)}
        >
          {resolvedLoadError ? (
            <EmptyPanel message="Không thể tải biểu đồ người dùng." tone="danger" />
          ) : isLoading && !overview ? (
            <EmptyPanel message="Đang tải biểu đồ người dùng..." />
          ) : (
            <LineTrend data={userTrend} yLabel="New users" />
          )}
        </ChartCard>

        <ChartCard
          title="Listings growth"
          subtitle="New listings created in the selected window"
          ranges={rangeOptions}
          activeRange={range}
          onRangeChange={(value) => setRange(value as DashboardTrendRange)}
        >
          {resolvedLoadError ? (
            <EmptyPanel message="Không thể tải biểu đồ tin đăng." tone="danger" />
          ) : isLoading && !overview ? (
            <EmptyPanel message="Đang tải biểu đồ tin đăng..." />
          ) : (
            <LineTrend data={listingTrend} yLabel="New listings" />
          )}
        </ChartCard>
      </div>

      <SectionCard title="Activity & logs" subtitle="Latest actions generated from real website events">
        <FiltersBar
          q={activityQ}
          onQ={setActivityQ}
          status={activityStatus}
          onStatus={setActivityStatus}
          statusOptions={activityStatusOptions}
          placeholder="Search logs by user, action, detail"
        />
        <div className="mt-4">
          <DataTable<DashboardActivityLog>
            rows={filteredActivities}
            columns={activityColumns}
            pageSize={7}
            rowKey={(row) => row.id}
            onRowClick={setSelectedActivity}
            getRowClassName={(row) =>
              row.status === "failed" ? "bg-red-50/40 hover:bg-red-50" : ""
            }
            emptyText={activityEmptyText}
          />
        </div>
      </SectionCard>

      <SectionCard title="Recent users" subtitle="Latest accounts and account health">
        <DataTable<DashboardUserRow>
          rows={recentUsers}
          columns={userColumns}
          pageSize={6}
          rowKey={(row) => row.id}
          emptyText={recentUsersEmptyText}
        />
      </SectionCard>

      <ActivityDetailModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
    </>
  );
}
