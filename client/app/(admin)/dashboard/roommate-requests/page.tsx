"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import SectionCard from "../../components/SectionCard";
import FiltersBar from "../../components/FiltersBar";
import DataTable, { type Column } from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import {
  getAdminRoommateRequests,
  reviewRoommateRequest,
  type ApprovalStatus,
  type RoommateRequest,
} from "@/app/services/roommate-management";

type StatusFilter = "all" | ApprovalStatus;
type LoadError = "auth_failed" | "load_failed" | null;

type AdminRoommateRow = {
  id: number;
  studentName: string;
  listingTitle: string;
  landlordName: string;
  requestedSlots: number;
  occupancy: string;
  modeLabel: string;
  status: ApprovalStatus;
  createdAt: string;
};

const actionButtonBase =
  "inline-flex h-8 min-w-[84px] items-center justify-center rounded-lg border px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60";

const modeLabelMap = {
  LANDLORD_ASSIST: "Nhờ chủ trọ hỗ trợ",
  TENANT_SELF: "Người thuê tự đăng",
} as const;

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
] satisfies Array<{ value: StatusFilter; label: string }>;

const statusTone = (status: ApprovalStatus): "yellow" | "green" | "red" => {
  if (status === "approved") return "green";
  if (status === "rejected") return "red";
  return "yellow";
};

const statusLabel = (status: ApprovalStatus) => {
  if (status === "approved") return "Đã duyệt";
  if (status === "rejected") return "Từ chối";
  return "Chờ duyệt";
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

const getStudentName = (request: RoommateRequest) =>
  request.student?.profile?.full_name ||
  request.student?.username ||
  request.student?.email ||
  "Không rõ";

const mapRequestToRow = (request: RoommateRequest): AdminRoommateRow => ({
  id: request.id,
  studentName: getStudentName(request),
  listingTitle: request.listingTitle,
  landlordName: request.landlordName ?? "Chưa cập nhật",
  requestedSlots: request.requestedSlots,
  occupancy: `${request.currentOccupancy}/${request.maxOccupancy}`,
  modeLabel: modeLabelMap[request.mode],
  status: request.approvalStatus,
  createdAt: formatDate(request.createdAt),
});

export default function AdminRoommateRequestsPage() {
  const { status: sessionStatus } = useSession();
  const [requests, setRequests] = useState<RoommateRequest[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadError>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const deferredQuery = useDeferredValue(query);

  const fetchRequests = useCallback(async () => {
    if (sessionStatus === "loading") return;
    if (sessionStatus !== "authenticated") {
      setRequests([]);
      setLoadError("auth_failed");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const data = await getAdminRoommateRequests("all");
      setRequests(data);
    } catch {
      setLoadError("load_failed");
    } finally {
      setLoading(false);
    }
  }, [sessionStatus]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const rows = useMemo(() => requests.map(mapRequestToRow), [requests]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesStatus =
        statusFilter === "all" ? true : row.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        row.studentName.toLowerCase().includes(normalizedQuery) ||
        row.listingTitle.toLowerCase().includes(normalizedQuery) ||
        row.landlordName.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [deferredQuery, rows, statusFilter]);

  const counts = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((item) => item.approvalStatus === "pending")
        .length,
      approved: requests.filter((item) => item.approvalStatus === "approved")
        .length,
      rejected: requests.filter((item) => item.approvalStatus === "rejected")
        .length,
    }),
    [requests],
  );

  const handleReview = useCallback(
    async (id: number, approvalStatus: ApprovalStatus) => {
      setActionKey(`${id}:${approvalStatus}`);
      setActionError(null);

      try {
        const updated = await reviewRoommateRequest(id, { approvalStatus });
        setRequests((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
      } catch (error) {
        setActionError(
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
            (error as { message?: string })?.message ||
            "Không thể cập nhật trạng thái yêu cầu.",
        );
      } finally {
        setActionKey(null);
      }
    },
    [],
  );

  const columns = useMemo<Column<AdminRoommateRow>[]>(
    () => [
      {
        key: "studentName",
        header: "Sinh viên",
        sortable: true,
      },
      {
        key: "listingTitle",
        header: "Phòng gốc",
        render: (row) => (
          <div className="space-y-0.5 text-left">
            <div className="font-medium text-gray-900">{row.listingTitle}</div>
            <div className="text-xs text-gray-500">
              Chủ trọ: {row.landlordName}
            </div>
          </div>
        ),
      },
      {
        key: "requestedSlots",
        header: "Nhu cầu",
        align: "center",
        render: (row) => (
          <div className="space-y-0.5">
            <div>{row.requestedSlots} người</div>
            <div className="text-xs text-gray-500">{row.occupancy}</div>
          </div>
        ),
      },
      {
        key: "modeLabel",
        header: "Hình thức",
      },
      {
        key: "status",
        header: "Trạng thái",
        align: "center",
        render: (row) => (
          <StatusBadge
            label={statusLabel(row.status)}
            tone={statusTone(row.status)}
          />
        ),
      },
      {
        key: "createdAt",
        header: "Ngày gửi",
        align: "center",
      },
      {
        key: "actions",
        header: "Xử lý",
        width: "220px",
        render: (row) => {
          const approveKey = `${row.id}:approved`;
          const rejectKey = `${row.id}:rejected`;
          const pendingKey = `${row.id}:pending`;
          return (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={actionKey === approveKey}
                onClick={() => void handleReview(row.id, "approved")}
                className={`${actionButtonBase} border-green-200 bg-white text-green-700 hover:bg-green-50`}
              >
                Duyệt
              </button>
              <button
                type="button"
                disabled={actionKey === rejectKey}
                onClick={() => void handleReview(row.id, "rejected")}
                className={`${actionButtonBase} border-red-200 bg-white text-red-700 hover:bg-red-50`}
              >
                Từ chối
              </button>
              {row.status !== "pending" ? (
                <button
                  type="button"
                  disabled={actionKey === pendingKey}
                  onClick={() => void handleReview(row.id, "pending")}
                  className={`${actionButtonBase} border-amber-200 bg-white text-amber-700 hover:bg-amber-50`}
                >
                  Đưa về chờ duyệt
                </button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [actionKey, handleReview],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="Tổng yêu cầu" value={counts.total} />
        <SummaryCard label="Chờ duyệt" value={counts.pending} />
        <SummaryCard label="Đã duyệt" value={counts.approved} />
        <SummaryCard label="Từ chối" value={counts.rejected} />
      </section>

      <SectionCard
        title="Yêu cầu ở ghép"
        subtitle="Sinh viên gửi yêu cầu và quản trị viên là người kiểm duyệt cuối cùng"
      >
        <div className="space-y-4">
          <FiltersBar
            q={query}
            onQ={setQuery}
            status={statusFilter}
            onStatus={(value) => setStatusFilter(value as StatusFilter)}
            statusOptions={statusOptions}
            placeholder="Tìm theo sinh viên, phòng gốc hoặc chủ trọ"
          />

          {loadError === "auth_failed" ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              Không thể tải dữ liệu vì phiên đăng nhập quản trị viên không hợp lệ.
            </div>
          ) : null}

          {loadError === "load_failed" ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              Không thể tải danh sách yêu cầu ở ghép.
            </div>
          ) : null}

          {actionError ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {actionError}
            </div>
          ) : null}

          <DataTable
            rows={filteredRows}
            columns={columns}
            rowKey={(row) => String(row.id)}
            emptyText={loading ? "Đang tải dữ liệu..." : "Không có yêu cầu nào"}
          />
        </div>
      </SectionCard>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
