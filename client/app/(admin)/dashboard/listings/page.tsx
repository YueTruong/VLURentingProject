"use client";

import { useMemo, useState } from "react";
import SectionCard from "../../components/SectionCard";
import FiltersBar from "../../components/FiltersBar";
import DataTable, { Column } from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { listings, type ListingRow } from "../../components/mock/data";

export default function ListingsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "APPROVED", label: "Approved" },
    { value: "PENDING", label: "Pedning" },
    { value: "REJECTED", label: "Rejected" },
  ];

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return listings.filter((l) => {
      const okQ =
        !qq ||
        l.title.toLowerCase().includes(qq) ||
        l.owner.toLowerCase().includes(qq) ||
        l.city.toLowerCase().includes(qq);
      const okS = status === "all" ? true : l.status === status;
      return okQ && okS;
    });
  }, [q, status]);
  
  const cols: Column<ListingRow>[] = [
    { key: "title", header: "Title" },
    { key: "owner", header: "Owner", sortable: true },
    { key: "city", header: "City", sortable: true },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (r) => <span className="font-medium">₫ {r.price.toLocaleString("vi-VN")}</span>,
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
    },
    { key: "createdAt", header: "Created", sortable: true },
  ];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Listings"
        subtitle="Moderate & track property listings"
        right={
          <button className="rounded-xl bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800">
            Create listing
          </button>
        }
      >
        <FiltersBar q={q} onQ={setQ} status={status} onStatus={setStatus} statusOptions={statusOptions} />
      </SectionCard>

      <SectionCard title="Listing List" subtitle={`${filtered.length}results`}>
        <DataTable<ListingRow> rows={filtered} columns={cols} pageSize={8} rowKey={(r) => r.id} />
      </SectionCard>
    </div>
  )
}
