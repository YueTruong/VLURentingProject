"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import SectionCard from "../../components/SectionCard";
import FiltersBar from "../../components/FiltersBar";
import DataTable, { Column } from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { getAdminUsers, type AdminUser } from "@/app/services/admin-users";

type AdminUserRow = {
  id: number;
  username: string;
  email: string;
  role: string;
  status: "ACTIVE" | "BLOCKED" | "PENDING";
  verified: boolean | null;
  createdAt: string;
  createdAtValue: number;
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const mapUserToRow = (user: AdminUser): AdminUserRow => {
  const displayName =
    user.profile?.full_name?.trim() ||
    user.username?.trim() ||
    user.email?.trim() ||
    "Unknown";
  const email = user.email?.trim() || "-";
  const createdSource = user.createdAt ?? user.updatedAt ?? "";
  const createdAtValue = createdSource ? new Date(createdSource).getTime() : 0;
  const roleName = (user.role?.name || "unknown").toUpperCase();
  const status = user.is_active === false ? "BLOCKED" : "ACTIVE";

  return {
    id: user.id,
    username: displayName,
    email,
    role: roleName,
    status,
    verified: null,
    createdAt: formatDate(createdSource),
    createdAtValue,
  };
};

const getRoleTone = (role: string) => {
  if (role === "ADMIN") return "blue";
  if (role === "LANDLORD") return "yellow";
  if (role === "STUDENT") return "green";
  return "gray";
};

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastFetchToken, setLastFetchToken] = useState<string | null>(null);

  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.user?.accessToken;
  const role = session?.user?.role;

  const authError = useMemo(() => {
    if (sessionStatus === "loading") return null;
    if (!accessToken) return "auth_failed";
    if (role && role !== "admin") return "forbidden";
    return null;
  }, [accessToken, role, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (authError || !accessToken) return;
    let active = true;
    getAdminUsers(accessToken)
      .then((data) => {
        if (!active) return;
        const mapped = data
          .map(mapUserToRow)
          .sort((a, b) => b.createdAtValue - a.createdAtValue);
        setRows(mapped);
        setFetchError(null);
        setLastFetchToken(accessToken);
      })
      .catch((err) => {
        if (!active) return;
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setFetchError("forbidden");
        } else {
          console.error("Failed to load admin users:", err);
          setFetchError("load_failed");
        }
        setLastFetchToken(accessToken);
      })

    return () => {
      active = false;
    };
  }, [accessToken, authError, sessionStatus]);

  const statusOptions = [
    { value: "all", label: "All status"},
    { value: "ACTIVE", label: "Active" },
    { value: "PENDING", label: "Pending" },
    { value: "BLOCKED", label: "Blocked" },
  ];

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((u) => {
      const okQ =
        !qq || u.username.toLowerCase().includes(qq) || u.email.toLowerCase().includes(qq);
      const okS = status === "all" ? true : u.status === status;
      return okQ && okS;
    });
  }, [q, status, rows]);
  
  const cols: Column<AdminUserRow>[] = [
    { key: "username", header: "Username", sortable: true },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (r) => <StatusBadge label={r.role} tone={getRoleTone(r.role)} />,
      sortValue: (r) => r.role,
    },
    {
      key: "verified",
      header: "Verification",
      render: (r) => {
        if (r.role !== "LANDLORD" || r.verified === null) {
          return <StatusBadge label="N/A" tone="gray" />;
        }
        return (
          <StatusBadge
            label={r.verified ? "Verified" : "Unverified"}
            tone={r.verified ? "green" : "yellow"}
          />
        );
      },
      sortValue: (r) =>
        r.role === "LANDLORD" && r.verified !== null
          ? r.verified
            ? "verified"
            : "unverified"
          : "na",
    },
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
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      sortValue: (r) => r.createdAtValue,
    },
  ];

  const loading =
    sessionStatus === "loading" ? true : authError ? false : lastFetchToken !== accessToken;
  const loadError =
    authError ?? (lastFetchToken === accessToken ? fetchError : null);

  const emptyText = loading
    ? "Loading users..."
    : loadError === "auth_failed"
      ? "Please sign in again."
      : loadError === "forbidden"
        ? "Access denied."
      : loadError
        ? "Failed to load users."
        : "No data";
  
  return (
    <div className="space-y-6">
      <SectionCard
        title="Users"
        subtitle="Manage accounts, roles, and status"
      >
        <FiltersBar q={q} onQ={setQ} status={status} onStatus={setStatus} statusOptions={statusOptions} />
      </SectionCard>

      <SectionCard title="User List" subtitle={`${filtered.length} results`} contentClassName="p-0">
        <DataTable<AdminUserRow>
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
