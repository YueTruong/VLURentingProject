"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import SectionCard from "../../components/SectionCard";
import FiltersBar from "../../components/FiltersBar";
import DataTable, { type Column } from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { deleteAdminReview, getAdminReviews, type AdminReviewItem } from "@/app/services/reviews";

type AdminReviewRow = {
  id: number;
  reviewer: string;
  listing: string;
  rating: number;
  comment: string;
  createdAt: string;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const mapReview = (item: AdminReviewItem): AdminReviewRow => ({
  id: Number(item?.id ?? 0),
  reviewer:
    item?.user?.profile?.full_name ||
    item?.user?.username ||
    item?.user?.email ||
    "Ẩn danh",
  listing: item?.post?.title || "Đánh giá hệ thống",
  rating: Number(item?.rating ?? 0),
  comment: (item?.comment ?? "").trim() || "(không có nội dung)",
  createdAt: formatDateTime(item?.createdAt),
});

export default function AdminReviewsPage() {
  const { data: session, status } = useSession();
  const [rows, setRows] = useState<AdminReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (status === "loading") return;
    const token = session?.user?.accessToken;
    if (!token) {
      setRows([]);
      setLoading(false);
      return;
    }

    let active = true;
    getAdminReviews(token, 100)
      .then((data) => {
        if (!active) return;
        setRows(data.map(mapReview));
      })
      .catch((error) => {
        if (!active) return;
        console.error("Lỗi tải reviews admin:", error);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session, status]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const byStatus = filterStatus === "low" ? rows.filter((item) => item.rating <= 2) : rows;
    if (!term) return byStatus;
    return byStatus.filter((item) =>
      item.reviewer.toLowerCase().includes(term) ||
      item.listing.toLowerCase().includes(term) ||
      item.comment.toLowerCase().includes(term),
    );
  }, [q, rows, filterStatus]);

  const handleDelete = async (id: number) => {
    const token = session?.user?.accessToken;
    if (!token) return;
    if (!confirm("Bạn chắc chắn muốn xóa review này?")) return;

    setActionId(id);
    try {
      await deleteAdminReview(id, token);
      setRows((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Xóa review thất bại:", error);
      alert("Không thể xóa review. Vui lòng thử lại.");
    } finally {
      setActionId(null);
    }
  };

  const columns: Column<AdminReviewRow>[] = [
    { key: "id", header: "ID", width: "72px", sortable: true, render: (row) => <span className="font-medium text-gray-700">#{row.id}</span> },
    { key: "reviewer", header: "Người đánh giá", sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.reviewer}</span> },
    { key: "listing", header: "Tin đăng", sortable: true, render: (row) => <span className="text-gray-800">{row.listing}</span> },
    { key: "rating", header: "Điểm", sortable: true, render: (row) => <StatusBadge tone={row.rating >= 4 ? "green" : row.rating >= 3 ? "yellow" : "red"} label={`${row.rating}/5`} /> },
    { key: "comment", header: "Nội dung", render: (row) => <p className="line-clamp-2 max-w-lg text-sm text-gray-600">{row.comment}</p> },
    { key: "createdAt", header: "Thời gian", sortable: true, render: (row) => <span className="text-sm text-gray-600">{row.createdAt}</span> },
    {
      key: "actions",
      header: "Thao tác",
      width: "120px",
      render: (row) => (
        <button
          onClick={() => handleDelete(row.id)}
          disabled={actionId === row.id}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
        >
          {actionId === row.id ? "Đang xóa..." : "Xóa"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <SectionCard title="Quản lý đánh giá" subtitle="Admin kiểm duyệt và xóa review vi phạm/spam.">
        <FiltersBar
          q={q}
          onQ={setQ}
          status={filterStatus}
          onStatus={setFilterStatus}
          statusOptions={[
            { value: "all", label: "Tất cả" },
            { value: "low", label: "Điểm thấp (<=2)" },
          ]}
          placeholder="Tìm theo người dùng, tin đăng hoặc nội dung..."
          right={<div className="text-sm text-gray-500">Tổng: {filtered.length} review</div>}
        />
      </SectionCard>

      <SectionCard title="Danh sách review" subtitle="Các review mới nhất trong hệ thống.">
        {loading ? (
          <div className="py-8 text-center text-sm text-gray-500">Đang tải dữ liệu...</div>
        ) : (
          <DataTable<AdminReviewRow>
            rows={filtered}
            columns={columns}
            rowKey={(row) => String(row.id)}
            emptyText="Không có review phù hợp."
          />
        )}
      </SectionCard>
    </div>
  );
}
