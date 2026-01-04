"use client";

import { useMemo, useState } from "react";
import SectionCard from "../../components/SectionCard";
import FiltersBar from "../../components/FiltersBar";
import LineTrend from "../../components/charts/LineTrend";
import BarKpi from "../../components/charts/BarKpi";
import DataTable, { Column } from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { trendUsers, trendListings, barSources, users, listings, type UserRow, type ListingRow } from "../../components/mock/data";


export default function AnalyticsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "ACTIVE", label: "Active" },
    { value: "PENDING", label: "Pending" },
    { value: "BLOCKED", label: "Blocked" },
  ];

  const filteredUsers = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return users.filter((u) => {
      const okQ = 
        !qq || u.username.toLowerCase().includes(qq) || u.email.toLowerCase().includes(qq);
      const okS = status === "all" ? true : u.status === status;
      return okQ && okS;
    });
  }, [q, status]);

  const userCols: Column<UserRow>[] = [
    { key: "username", header: "Username", sortable: true },
    { key: "email", header: "Email" },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => (
        <StatusBadge
          label={r.status}
          tone={r.status === "ACTIVE" ? "green" : r.status === "PENDING" ? "yellow" : "red"}
        />
      ),
      sortValue: (r) => r.status,
    },
    { key: "createdAt", header: "Created", sortable: true },
  ];

  const listingCols: Column<ListingRow>[] = [
    { key: "title", header: "Title" },
    { key: "owner", header: "Owner", sortable: true },
    { key: "city", header: "City", sortable: true },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (r) => <span className="font-medium">{r.price.toLocaleString("vi-VN")} ₫</span>,
      sortValue: (r) => r.price,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => (
        <StatusBadge
          label={r.status}
          tone={r.status === "APPROVED" ? "green" : r.status === "PENDING" ? "yellow" : "red"}
        />
      ),
      sortValue: (r) => r.status,
    },
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Analytics Dashboard"
        subtitle="Track trends, sources, and operational health"
        right={
          <button className="rounded-xl bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800">
            Export report
          </button>
        }
      >
        <FiltersBar q={q} onQ={setQ} status={status} onStatus={setStatus} statusOptions={statusOptions} />
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
          <DataTable<UserRow>
            rows={filteredUsers}
            columns={userCols}
            pageSize={6}
            rowKey={(r) => r.id}
          />
        </SectionCard>

        <SectionCard title="Latest Listings" subtitle="Operational queue">
          <DataTable<ListingRow>
            rows={listings}
            columns={listingCols}
            pageSize={6}
            rowKey={(r) => r.id}
          />
        </SectionCard>
      </div>
    </div>
  );
}
