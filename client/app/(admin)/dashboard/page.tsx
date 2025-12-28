"use client";

import KpiCard from "../components/KpiCard";
import SectionCard from "../components/SectionCard";
import DataTable, { Column } from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import LineTrend from "../components/charts/LineTrend";
import { kpis, trendUsers, trendListings, users, type UserRow } from "../components/mock/data";

export default function AdminDashboardPage() {
  const cols: Column<UserRow>[] = [
    { key: "username", header: "Username", sortable: true },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (r) => <StatusBadge label={r.role} tone={r.role === "ADMIN" ? "blue" : "gray"} />,
      sortValue: (r) => r.role,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => {
        const tone =
          r.status === "ACTIVE" ? "green" : r.status === "PENDING" ? "yellow" : "red";
        return <StatusBadge label={r.status} tone={tone} />;
      },
      sortValue: (r) => r.status,
    },
    { key: "createdAt", header: "Created", sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue" value={kpis.revenue} delta="+12%" hint="Last 30 days" icon="💰" />
        <KpiCard label="New Users" value={kpis.newUsers} delta="+8%" hint="Last 30 days" icon="👤" />
        <KpiCard label="Listings" value={kpis.listings} delta="+5%" hint="Active listings" icon="🏠" />
        <KpiCard label="Conversion" value={kpis.conversion} delta="+0.4%" hint="Visit → Lead" icon="⚡" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SectionCard title="User Trends" subtitle="Weekly new users">
          <LineTrend data={trendUsers} yLabel="Users / week" />
        </SectionCard>

        <SectionCard title="Listings Trends" subtitle="Weekly created listings">
          <LineTrend data={trendListings} yLabel="Listings / week" />
        </SectionCard>
      </div>

      <SectionCard title="Recent Users" subtitle="Newest accounts created recently">
        <DataTable<UserRow>
          rows={users.slice(0, 12)}
          columns={cols}
          pageSize={6}
          rowKey={(r) => r.id}
        />
      </SectionCard>
    </div>
  );
}
