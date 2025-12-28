"use client";

import { useMemo, useState } from "react";
import FiltersBar from "../../components/FiltersBar";
import SectionCard from "../../components/SectionCard";
import DataTable, { type Column } from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";

type PropertyRow = {
  id: string;
  title: string;
  address: string;
  landlord: string;
  price: number; // lưu số để sort/filter dễ hơn
  created: string; // YYYY-MM-DD
  status: "Active" | "Pending" | "Rejected";
  type: "Apartment" | "Room" | "Dorm";
};

export default function PropertiesPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "Active", label: "Active" },
    { value: "Pending", label: "Pending" },
    { value: "Rejected", label: "Rejected" },
  ];

  const rows = useMemo<PropertyRow[]>(() => [
    {
      id: "p1",
      title: "Căn hộ mini 2 phòng ngủ rộng rãi",
      address: "Bình Thạnh, TP.HCM",
      landlord: "Nguyễn Huy Hoàng",
      price: 500000,
      created: "2025-11-29",
      status: "Active",
      type: "Apartment",
    },
    {
      id: "p2",
      title: "Căn hộ mini 2 phòng ngủ rộng rãi",
      address: "Bình Thạnh, TP.HCM",
      landlord: "Nguyễn Huy Hoàng",
      price: 500000,
      created: "2025-11-29",
      status: "Pending",
      type: "Room",
    },
  ], []);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      const okQ =
        !qq ||
        r.title.toLowerCase().includes(qq) ||
        r.address.toLowerCase().includes(qq) ||
        r.landlord.toLowerCase().includes(qq);

      const okS = status === "all" ? true : r.status === status;
      return okQ && okS;
    });
  }, [rows, q, status]);

  const cols: Column<PropertyRow>[] = [
    {
      key: "title",
      header: "Property",
      sortable: true,
      render: (r) => (
        <div className="min-w-[260px]">
          <div className="font-medium text-gray-900">{r.title}</div>
          <div className="mt-0.5 text-xs text-gray-500">{r.address}</div>
        </div>
      ),
      sortValue: (r) => r.title,
    },
    { key: "landlord", header: "Landlord", sortable: true, sortValue: (r) => r.landlord },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (r) => <span className="font-medium">{r.price.toLocaleString("vi-VN")} ₫</span>,
      sortValue: (r) => r.price,
    },
    { key: "created", header: "Creation Date", sortable: true, sortValue: (r) => r.created },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => (
        <StatusBadge
          label={r.status}
          tone={r.status === "Active" ? "green" : r.status === "Pending" ? "yellow" : "red"}
        />
      ),
      sortValue: (r) => r.status,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (r) => <StatusBadge label={r.type} tone="gray" />,
      sortValue: (r) => r.type,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header của trang: dùng SectionCard cho đồng bộ (Topbar đã nằm trong layout) */}
      <SectionCard
        title="Properties"
        subtitle="Oversee and manage rental listings"
        right={
          <button className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">
            + Add New Property
          </button>
        }
      >
        <FiltersBar
          q={q}
          onQ={setQ}
          status={status}
          onStatus={setStatus}
          statusOptions={statusOptions}
        />
      </SectionCard>

      <SectionCard title="Listings" subtitle="Manage approvals & visibility">
        <DataTable<PropertyRow>
          rows={filtered}
          columns={cols}
          pageSize={8}
          rowKey={(r) => r.id}
          emptyText="No properties found"
        />
      </SectionCard>
    </div>
  );
}
