"use client";

import { useMemo, useState } from "react";
import SectionCard from "../../components/SectionCard";
import FiltersBar from "../../components/FiltersBar";
import DataTable, { Column } from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { users, type UserRow } from "../../components/mock/data";

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const statusOptions = [
    { value: "all", label: "All status"},
    { value: "ACTIVE", label: "Active" },
    { value: "PENDING", label: "Pending" },
    { value: "BLOCKED", label: "Blocked" },
  ];

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return users.filter((u) => {
      const okQ =
        !qq || u.username.toLowerCase().includes(qq) || u.email.toLowerCase().includes(qq);
      const okS = status === "all" ? true : u.status === status;
      return okQ && okS;
    });
  }, [q, status]);
  
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
      key: "stauts",
      header: "Status",
      sortable: true,
      render: (r) => (
        <StatusBadge
          label={r.status}
          tone={r.status === "ACTIVE" ? "green" : r.status === "PENDING" ? "yellow" : "red"}
        />
      ),
    },
    { key: "createdAt", header: "Created", sortable: true },
  ];
  
  return (
    <div className="space-y-6">
      <SectionCard
        title="Users"
        subtitle="Manage accounts, roles, and status"
        right={
          <button className="rounded-xl bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800">
            Add user
          </button>
        }
      >
        <FiltersBar q={q} onQ={setQ} status={status} onStatus={setStatus} statusOptions={statusOptions} />
      </SectionCard>

      <SectionCard title="User List" subtitle={`${filtered.length}results`}>
        <DataTable<UserRow> rows={filtered} columns={cols} pageSize={8} rowKey={(r) => r.id} />
      </SectionCard>
    </div>
  );
}