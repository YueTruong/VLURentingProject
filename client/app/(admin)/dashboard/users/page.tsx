"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import SectionCard from "../../components/SectionCard";
import FiltersBar from "../../components/FiltersBar";
import DataTable, { Column } from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import {
  getAdminUsers,
  updateAdminUserStatus,
  type AdminUser,
} from "@/app/services/admin-users";

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

type LoadErrorType = "auth_failed" | "forbidden" | "load_failed" | null;
type UserActionType = "block" | "unblock";

const actionButtonBase =
  "inline-flex h-8 min-w-[88px] items-center justify-center rounded-lg border px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60";

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

const normalizeRole = (value?: string | null) =>
  (value?.trim() || "UNKNOWN").toUpperCase();

const normalizeUserStatus = (user: AdminUser): AdminUserRow["status"] => {
  const statusValue = (user as AdminUser & { status?: string | null }).status;
  const normalizedStatus = statusValue?.toUpperCase();
  if (
    normalizedStatus === "ACTIVE" ||
    normalizedStatus === "BLOCKED" ||
    normalizedStatus === "PENDING"
  ) {
    return normalizedStatus;
  }
  if (user.is_active === true) return "ACTIVE";
  if (user.is_active === false) return "BLOCKED";
  return "PENDING";
};

const getStatusLabel = (status: AdminUserRow["status"]) => {
  if (status === "ACTIVE") return "Đang hoạt động";
  if (status === "PENDING") return "Chờ xác minh";
  return "Đã khóa";
};

const getStatusTone = (status: AdminUserRow["status"]) => {
  if (status === "ACTIVE") return "green" as const;
  if (status === "PENDING") return "yellow" as const;
  return "red" as const;
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
  const roleName = normalizeRole(user.role?.name);
  const status = normalizeUserStatus(user);

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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadErrorType>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [rowActionError, setRowActionError] = useState<Record<number, string>>({});

  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.user?.accessToken;
  const role = session?.user?.role;
  const normalizedRole = typeof role === "string" ? role.toLowerCase() : undefined;

  const authError = useMemo(() => {
    if (sessionStatus === "loading") return null;
    if (!accessToken) return "auth_failed";
    if (normalizedRole && normalizedRole !== "admin") return "forbidden";
    return null;
  }, [accessToken, normalizedRole, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (authError) {
      setUsers([]);
      setIsLoading(false);
      return;
    }
    if (!accessToken) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setLoadError(null);

    getAdminUsers(accessToken)
      .then((data) => {
        if (!active) return;
        setUsers(data);
      })
      .catch((err) => {
        if (!active) return;
        const statusCode =
          typeof err === "object" && err !== null && "response" in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;
        if (statusCode === 403) {
          setLoadError("forbidden");
        } else if (statusCode === 401) {
          setLoadError("auth_failed");
        } else {
          console.error("Failed to load admin users:", err);
          setLoadError("load_failed");
        }
      })
      .finally(() => {
        if (!active) return;
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, authError, refreshKey, sessionStatus]);

  const rows = useMemo(
    () =>
      users
        .map(mapUserToRow)
        .sort((a, b) => b.createdAtValue - a.createdAtValue),
    [users],
  );

  const statusOptions = [
    { value: "all", label: "Tất cả trạng thái" },
    { value: "ACTIVE", label: "Đang hoạt động" },
    { value: "PENDING", label: "Chờ xác minh" },
    { value: "BLOCKED", label: "Đã khóa" },
  ];

  const filteredRows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((u) => {
      const okQ =
        !qq || u.username.toLowerCase().includes(qq) || u.email.toLowerCase().includes(qq);
      const okS = status === "all" ? true : u.status === status;
      return okQ && okS;
    });
  }, [q, status, rows]);

  const handleChangeUserStatus = async (
    id: number,
    isActive: boolean,
    action: UserActionType,
  ) => {
    if (!accessToken) {
      setLoadError("auth_failed");
      return false;
    }

    const key = `${id}:${action}`;
    setActionKey(key);
    setRowActionError((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      await updateAdminUserStatus(id, isActive, accessToken);
      setUsers((prev) =>
        prev.map((user) =>
          user.id === id
            ? {
                ...user,
                is_active: isActive,
                status: isActive ? "ACTIVE" : "BLOCKED",
              }
            : user,
        ),
      );
      return true;
    } catch (err) {
      const statusCode =
        typeof err === "object" && err !== null && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;

      const message =
        statusCode === 403
          ? "Không có quyền thực hiện thao tác này."
          : "Không thể cập nhật trạng thái.";

      setRowActionError((prev) => ({ ...prev, [id]: message }));
      return false;
    } finally {
      setActionKey(null);
    }
  };
  
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
        <StatusBadge label={getStatusLabel(r.status)} tone={getStatusTone(r.status)} />
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      sortable: true,
      sortValue: (r) => r.createdAtValue,
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (r) => {
        const isBlocking = actionKey === `${r.id}:block`;
        const isUnblocking = actionKey === `${r.id}:unblock`;
        return (
          <div className="flex flex-col items-end gap-1.5">
            {r.status === "ACTIVE" ? (
              <button
                type="button"
                onClick={() => handleChangeUserStatus(r.id, false, "block")}
                disabled={isBlocking}
                className={`${actionButtonBase} border-rose-200 text-rose-700 hover:bg-rose-50`}
              >
                {isBlocking ? "Đang khóa..." : "Khóa"}
              </button>
            ) : r.status === "BLOCKED" ? (
              <button
                type="button"
                onClick={() => handleChangeUserStatus(r.id, true, "unblock")}
                disabled={isUnblocking}
                className={`${actionButtonBase} border-emerald-200 text-emerald-700 hover:bg-emerald-50`}
              >
                {isUnblocking ? "Đang mở..." : "Mở khóa"}
              </button>
            ) : (
              <span className="text-xs text-gray-400">-</span>
            )}
            {rowActionError[r.id] ? (
              <span className="text-[11px] text-rose-600">{rowActionError[r.id]}</span>
            ) : null}
          </div>
        );
      },
    },
  ];

  const resolvedLoadError = authError ?? loadError;

  const emptyText = isLoading
    ? "Đang tải danh sách người dùng..."
    : resolvedLoadError === "auth_failed"
      ? "Vui lòng đăng nhập lại."
      : resolvedLoadError === "forbidden"
        ? "Bạn không có quyền truy cập."
      : resolvedLoadError === "load_failed"
        ? "Tải dữ liệu thất bại."
        : "Không có dữ liệu";
  
  return (
    <div className="space-y-6">
      <SectionCard
        title="Users"
        subtitle="Manage accounts, roles, and status"
      >
        <FiltersBar
          q={q}
          onQ={setQ}
          status={status}
          onStatus={setStatus}
          statusOptions={statusOptions}
          placeholder="Search by username or email"
        />
        {resolvedLoadError === "auth_failed" ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          >
            Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.
          </div>
        ) : null}
        {resolvedLoadError === "forbidden" ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            Bạn không có quyền truy cập trang này.
          </div>
        ) : null}
        {resolvedLoadError === "load_failed" ? (
          <div
            role="alert"
            className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            <span>Không thể tải danh sách người dùng.</span>
            <button
              type="button"
              onClick={() => setRefreshKey((prev) => prev + 1)}
              disabled={isLoading || sessionStatus === "loading"}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Tải lại
            </button>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="User List" subtitle={`${filteredRows.length} results`} contentClassName="p-0">
        <DataTable<AdminUserRow>
          rows={filteredRows}
          columns={cols}
          pageSize={8}
          rowKey={(r) => String(r.id)}
          emptyText={emptyText}
        />
      </SectionCard>
    </div>
  );
}
