"use client";

import { useEffect, useMemo, useState } from "react";
import SectionCard from "../../components/SectionCard";
import FiltersBar from "../../components/FiltersBar";
import DataTable, { Column } from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { getAdminPosts, updatePostStatus, type Post } from "@/app/services/posts";

type AdminPostRow = {
  id: number;
  title: string;
  owner: string;
  city: string;
  price: number;
  status: string;
  createdAt: string;
  createdAtValue: number;
};

const toNumberValue = (value: number | string | undefined | null) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const formatPriceVnd = (value: number) => `${value.toLocaleString("vi-VN")} VND`;

const statusTone = (status: string): "green" | "yellow" | "red" | "gray" => {
  const normalized = status.toLowerCase();
  if (normalized === "approved") return "green";
  if (normalized === "pending") return "yellow";
  if (normalized === "rejected") return "red";
  if (normalized === "hidden") return "gray";
  return "gray";
};

const mapPostToRow = (post: Post): AdminPostRow => {
  const owner =
    post.user?.profile?.full_name ||
    post.user?.username ||
    post.user?.email ||
    "Unknown";
  const createdSource = post.createdAt ?? post.updatedAt ?? "";
  return {
    id: post.id,
    title: post.title,
    owner,
    city: post.address || "-",
    price: toNumberValue(post.price),
    status: post.status ?? "pending",
    createdAt: formatDate(createdSource),
    createdAtValue: createdSource ? new Date(createdSource).getTime() : 0,
  };
};

export default function ListingsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState<AdminPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoadError(null);
    getAdminPosts()
      .then((posts) => {
        if (!active) return;
        setRows(posts.map(mapPostToRow));
      })
      .catch(() => {
        if (!active) return;
        setLoadError("load_failed");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const statusOptions = [
    { value: "all", label: "All status" },
    { value: "approved", label: "Approved" },
    { value: "pending", label: "Pending" },
    { value: "rejected", label: "Rejected" },
    { value: "hidden", label: "Hidden" },
  ];

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((l) => {
      const okQ =
        !qq ||
        l.title.toLowerCase().includes(qq) ||
        l.owner.toLowerCase().includes(qq) ||
        l.city.toLowerCase().includes(qq);
      const okS = status === "all" ? true : l.status.toLowerCase() === status;
      return okQ && okS;
    });
  }, [q, rows, status]);

  const handleApprove = async (id: number) => {
    setActionId(id);
    try {
      await updatePostStatus(id, "approved");
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, status: "approved" } : row)),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setActionId(null);
    }
  };

  const emptyText = loading ? "Loading..." : loadError ? "Failed to load" : "No data";

  const cols: Column<AdminPostRow>[] = [
    { key: "title", header: "Title" },
    { key: "owner", header: "Owner", sortable: true },
    { key: "city", header: "Address", sortable: true },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (r) => <span className="font-medium">{formatPriceVnd(r.price)}</span>,
      sortValue: (r) => r.price,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => <StatusBadge label={r.status.toUpperCase()} tone={statusTone(r.status)} />,
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      sortValue: (r) => r.createdAtValue,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (r) => (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleApprove(r.id);
          }}
          disabled={r.status.toLowerCase() !== "pending" || actionId === r.id}
          className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionId === r.id ? "Approving..." : "Approve"}
        </button>
      ),
    },
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
        <DataTable<AdminPostRow>
          rows={filtered}
          columns={cols}
          pageSize={8}
          rowKey={(r) => String(r.id)}
          emptyText={emptyText}
        />
      </SectionCard>
    </div>
  );
}

