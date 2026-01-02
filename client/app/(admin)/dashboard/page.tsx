"use client";

import {
  BarChartIcon,
  CheckCircledIcon,
  Cross2Icon,
  HomeIcon,
  PersonIcon,
  RocketIcon,
  TargetIcon,
} from "@radix-ui/react-icons";
import { ReactNode, useMemo, useState } from "react";
import ChartCard from "../components/ChartCard";
import DataTable, { type Column } from "../components/DataTable";
import FiltersBar from "../components/FiltersBar";
import KpiCard from "../components/KpiCard";
import SectionCard from "../components/SectionCard";
import StatusBadge from "../components/StatusBadge";
import LineTrend from "../components/charts/LineTrend";
import {
  activities,
  kpiCards,
  trendSeries,
  users,
  type ActivityLog,
  type TrendRange,
  type UserRow,
} from "../components/mock/data";

const rangeOptions: { label: string; value: TrendRange }[] = [
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
  "total-listings": <HomeIcon className="h-5 w-5" />,
  "active-listings": <CheckCircledIcon className="h-5 w-5" />,
  "monthly-revenue": <BarChartIcon className="h-5 w-5" />,
  "new-users": <RocketIcon className="h-5 w-5" />,
  "success-rate": <TargetIcon className="h-5 w-5" />,
};

function formatDateTime(value: string) {
  const parsed = new Date(value.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("vi-VN", {
    hour12: false,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ActivityDetailModal({
  activity,
  onClose,
}: {
  activity: ActivityLog | null;
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
  const [range, setRange] = useState<TrendRange>("7d");
  const [activityQ, setActivityQ] = useState("");
  const [activityStatus, setActivityStatus] = useState("all");
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);

  const filteredActivities = useMemo(() => {
    const term = activityQ.trim().toLowerCase();
    return activities.filter((item) => {
      const matchesStatus = activityStatus === "all" ? true : item.status === activityStatus;
      const matchesTerm =
        !term ||
        item.user.toLowerCase().includes(term) ||
        item.action.toLowerCase().includes(term) ||
        (item.details ?? "").toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [activityQ, activityStatus]);

  const activityColumns: Column<ActivityLog>[] = [
    {
      key: "time",
      header: "Time",
      width: "160px",
      sortable: true,
      render: (row) => <span className="text-sm text-gray-700">{formatDateTime(row.time)}</span>,
      sortValue: (row) => new Date(row.time.replace(" ", "T")).getTime(),
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

  const recentUsers = useMemo(
    () => [...users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    []
  );

  const userColumns: Column<UserRow>[] = [
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
      render: (row) => (
        <StatusBadge label={row.role} tone={row.role === "ADMIN" ? "blue" : "gray"} />
      ),
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

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Modern admin view for VLU Renting. Data is mocked and ready to plug into APIs.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpiCards.map((item) => (
          <KpiCard
            key={item.id}
            label={item.label}
            value={item.value}
            hint={item.hint}
            delta={item.delta}
            icon={kpiIcons[item.id]}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard
          title="Users growth"
          subtitle="How many new users joined in the selected window"
          ranges={rangeOptions}
          activeRange={range}
          onRangeChange={setRange}
        >
          <LineTrend data={trendSeries.users[range]} yLabel="New users" />
        </ChartCard>

        <ChartCard
          title="Listings growth"
          subtitle="Creation velocity for new listings"
          ranges={rangeOptions}
          activeRange={range}
          onRangeChange={setRange}
        >
          <LineTrend data={trendSeries.listings[range]} yLabel="New listings" />
        </ChartCard>
      </div>

      <SectionCard
        title="Activity & logs"
        subtitle="Search, filter, click a row to inspect details"
        right={
          <div className="flex items-center gap-2">
            <button className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Export CSV
            </button>
            <button className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800">
              New rule
            </button>
          </div>
        }
      >
        <FiltersBar
          q={activityQ}
          onQ={setActivityQ}
          status={activityStatus}
          onStatus={setActivityStatus}
          statusOptions={activityStatusOptions}
          placeholder="Search logs by user, action, detail"
        />
        <div className="mt-4">
          <DataTable<ActivityLog>
            rows={filteredActivities}
            columns={activityColumns}
            pageSize={7}
            rowKey={(row) => row.id}
            onRowClick={setSelectedActivity}
            getRowClassName={(row) =>
              row.status === "failed" ? "bg-red-50/40 hover:bg-red-50" : ""
            }
            emptyText="No activity found"
          />
        </div>
      </SectionCard>

      <SectionCard title="Recent users" subtitle="Latest signups and account health">
        <DataTable<UserRow> rows={recentUsers} columns={userColumns} pageSize={6} rowKey={(r) => r.id} />
      </SectionCard>

      <ActivityDetailModal activity={selectedActivity} onClose={() => setSelectedActivity(null)} />
    </>
  );
}
