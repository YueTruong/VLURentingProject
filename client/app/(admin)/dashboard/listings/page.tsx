"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import SectionCard from "../../components/SectionCard";
import FiltersBar from "../../components/FiltersBar";
import DataTable, { type Column } from "../../components/DataTable";
import StatusBadge from "../../components/StatusBadge";
import { getAdminPosts, updatePostStatus, type Post } from "@/app/services/posts";

type ListingStatus = "approved" | "pending" | "rejected" | "hidden" | "rented";
type ListingStatusFilter = "all" | ListingStatus;
type LoadErrorType = "auth_failed" | "load_failed" | null;

type AdminPostRow = {
  id: number;
  title: string;
  owner: string;
  city: string;
  price: number;
  status: ListingStatus;
  resubmittedAt?: string | null;
  createdAt: string;
  createdAtValue: number;
};

const LISTING_STATUSES: ListingStatus[] = [
  "approved",
  "pending",
  "rejected",
  "hidden",
  "rented",
];

const actionButtonBase =
  "inline-flex h-8 w-full min-w-[96px] items-center justify-center rounded-lg border px-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60";

const rejectReasonPresets = [
  "Ảnh không rõ/thiếu ảnh",
  "Thiếu địa chỉ cụ thể",
  "Thiếu thông tin giá/diện tích",
  "Nội dung không phù hợp/quảng cáo",
];

const toNumberValue = (value: number | string | undefined | null) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toOptionalNumber = (value: number | string | undefined | null) => {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatCategoryName = (value?: string) => {
  if (!value) return "Chưa rõ";
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const lookup: Record<string, string> = {
    "phong tro": "Phòng trọ",
    "can ho": "Căn hộ",
    "nha nguyen can": "Nhà nguyên căn",
  };
  return lookup[normalized] ?? value;
};

const formatAmenityName = (value?: string) => {
  if (!value) return "-";
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const lookup: Record<string, string> = {
    wifi: "Wi-Fi",
    "may lanh": "Máy lạnh",
    "gio giac tu do": "Giờ giấc tự do",
    "giu xe": "Giữ xe",
    "gac lung": "Gác lửng",
    "wc rieng": "WC riêng",
  };
  return lookup[normalized] ?? value;
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

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString("vi-VN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatPriceVnd = (value: number) => `${value.toLocaleString("vi-VN")} đ`;

const isListingStatus = (value: string): value is ListingStatus =>
  LISTING_STATUSES.includes(value as ListingStatus);

const isListingStatusFilter = (value: string): value is ListingStatusFilter =>
  value === "all" || isListingStatus(value);

const normalizeStatus = (status?: string | null): ListingStatus => {
  const normalized = status?.trim().toLowerCase();
  return normalized && isListingStatus(normalized) ? normalized : "pending";
};

const statusTone = (status: ListingStatus): "green" | "yellow" | "red" | "gray" => {
  if (status === "approved" || status === "rented") return "green";
  if (status === "pending") return "yellow";
  if (status === "rejected") return "red";
  return "gray";
};

const statusLabel = (status: ListingStatus, resubmittedAt?: string | null) => {
  if (status === "approved") return "Đã duyệt";
  if (status === "pending") return resubmittedAt ? "Chờ duyệt lại" : "Chờ duyệt";
  if (status === "rejected") return "Từ chối";
  if (status === "hidden") return "Cân nhắc";
  return "Đã cho thuê";
};

const mapPostToRow = (post: Post): AdminPostRow => {
  const owner =
    post.user?.profile?.full_name ||
    post.user?.username ||
    post.user?.email ||
    "Không rõ";
  const createdSource = post.createdAt ?? post.updatedAt ?? "";

  return {
    id: post.id,
    title: post.title,
    owner,
    city: post.address || "-",
    price: toNumberValue(post.price),
    status: normalizeStatus(post.status),
    resubmittedAt: post.resubmittedAt ?? null,
    createdAt: formatDate(createdSource),
    createdAtValue: createdSource ? new Date(createdSource).getTime() : 0,
  };
};

export default function ListingsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ListingStatusFilter>("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadErrorType>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.user?.accessToken;
  const qDeferred = useDeferredValue(q);

  const fetchPosts = useCallback(async () => {
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setPosts([]);
      setLoadError("auth_failed");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(null);

    try {
      const data = await getAdminPosts(undefined, accessToken);
      setPosts(data);
    } catch (err) {
      console.error("Lỗi load admin posts:", err);
      setLoadError("load_failed");
    } finally {
      setLoading(false);
    }
  }, [accessToken, sessionStatus]);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts]);

  const rows = useMemo(
    () =>
      posts
        .map(mapPostToRow)
        .sort((a, b) => b.createdAtValue - a.createdAtValue),
    [posts],
  );

  const statusOptions = useMemo(
    () =>
      [
        { value: "all", label: "Tất cả trạng thái" },
        { value: "approved", label: "Đã duyệt" },
        { value: "pending", label: "Chờ duyệt" },
        { value: "rejected", label: "Từ chối" },
        { value: "hidden", label: "Cân nhắc" },
        { value: "rented", label: "Đã cho thuê" },
      ] satisfies { value: ListingStatusFilter; label: string }[],
    [],
  );

  const filteredRows = useMemo(() => {
    const normalizedQ = qDeferred.trim().toLowerCase();

    return rows.filter((row) => {
      const okQ =
        !normalizedQ ||
        row.title.toLowerCase().includes(normalizedQ) ||
        row.owner.toLowerCase().includes(normalizedQ) ||
        row.city.toLowerCase().includes(normalizedQ);
      const okS = status === "all" ? true : row.status === status;

      return okQ && okS;
    });
  }, [qDeferred, rows, status]);

  useEffect(() => {
    const nextSelectedId =
      filteredRows.length === 0
        ? null
        : filteredRows.some((row) => row.id === selectedId)
          ? selectedId
          : filteredRows[0].id;

    if (nextSelectedId !== selectedId) {
      setSelectedId(nextSelectedId);
    }
  }, [filteredRows, selectedId]);

  useEffect(() => {
    setLightboxIndex((current) => (current === null ? current : null));
  }, [selectedId]);

  const selectedPost = useMemo(
    () => (selectedId === null ? null : posts.find((post) => post.id === selectedId) ?? null),
    [posts, selectedId],
  );
  const selectedNormalizedStatus = normalizeStatus(selectedPost?.status);
  const rejectTargetPost = useMemo(
    () => (rejectTargetId === null ? null : posts.find((post) => post.id === rejectTargetId) ?? null),
    [posts, rejectTargetId],
  );
  const selectedImages = useMemo(
    () =>
      (selectedPost?.images ?? [])
        .map((img) => img?.image_url ?? "")
        .filter(Boolean),
    [selectedPost],
  );
  const mapQuery = useMemo(() => {
    if (!selectedPost) return "";
    const lat = toOptionalNumber(selectedPost.latitude ?? null);
    const lng = toOptionalNumber(selectedPost.longitude ?? null);
    if (lat !== undefined && lng !== undefined) {
      return `${lat},${lng}`;
    }
    return selectedPost.address || selectedPost.title || "";
  }, [selectedPost]);
  const mapSrc = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&hl=vi&output=embed`
    : "";
  const imageCount = selectedImages.length;
  const activeImageSrc = lightboxIndex !== null ? selectedImages[lightboxIndex] ?? null : null;

  const updateLocalStatus = useCallback(
    (id: number, nextStatus: ListingStatus, rejectionReasonValue?: string | null) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === id
            ? {
                ...post,
                status: nextStatus,
                rejectionReason:
                  nextStatus === "rejected"
                    ? rejectionReasonValue ?? post.rejectionReason ?? null
                    : null,
              }
            : post,
        ),
      );
    },
    [],
  );

  const handleFilterStatusChange = useCallback((value: string) => {
    if (!isListingStatusFilter(value)) return;
    setStatus(value);
  }, []);

  const handleRowSelect = useCallback((row: AdminPostRow) => {
    setSelectedId((current) => (current === row.id ? current : row.id));
  }, []);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const showPrevImage = useCallback(() => {
    if (imageCount <= 1) return;
    setLightboxIndex((current) => {
      if (current === null) return null;
      return (current - 1 + imageCount) % imageCount;
    });
  }, [imageCount]);

  const showNextImage = useCallback(() => {
    if (imageCount <= 1) return;
    setLightboxIndex((current) => {
      if (current === null) return null;
      return (current + 1) % imageCount;
    });
  }, [imageCount]);

  useEffect(() => {
    if (!activeImageSrc) return;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrevImage();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeImageSrc, closeLightbox, showNextImage, showPrevImage]);

  const handleStatusChange = useCallback(
    async (id: number, nextStatus: ListingStatus, rejectionReasonValue?: string): Promise<boolean> => {
      if (!accessToken) {
        setLoadError("auth_failed");
        setActionError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        return false;
      }

      const key = `${id}:${nextStatus}`;
      setActionKey(key);
      setActionError(null);

      try {
        await updatePostStatus(id, nextStatus, accessToken, rejectionReasonValue);
        updateLocalStatus(id, nextStatus, rejectionReasonValue);
        return true;
      } catch (error) {
        console.error(error);
        setActionError("Không thể cập nhật trạng thái. Vui lòng thử lại.");
        return false;
      } finally {
        setActionKey(null);
      }
    },
    [accessToken, updateLocalStatus],
  );

  const openRejectDialog = useCallback(
    (id: number) => {
      const current = posts.find((post) => post.id === id);
      setRejectTargetId(id);
      setRejectReason(current?.rejectionReason ?? "");
      setRejectError(null);
      setActionError(null);
    },
    [posts],
  );

  const closeRejectDialog = useCallback(() => {
    setRejectTargetId(null);
    setRejectReason("");
    setRejectError(null);
  }, []);

  const appendRejectPreset = useCallback((preset: string) => {
    setRejectReason((current) => {
      if (!current.trim()) return `- ${preset}`;
      return `${current}\n- ${preset}`;
    });
    setRejectError(null);
  }, []);

  const confirmReject = useCallback(async () => {
    if (rejectTargetId === null) return;

    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setRejectError("Vui lòng nhập lý do từ chối.");
      return;
    }

    setRejectError(null);
    const ok = await handleStatusChange(rejectTargetId, "rejected", trimmed);

    if (ok) {
      closeRejectDialog();
      return;
    }

    setRejectError("Không thể cập nhật trạng thái. Vui lòng thử lại.");
  }, [closeRejectDialog, handleStatusChange, rejectReason, rejectTargetId]);

  const emptyText = loading
    ? "Đang tải dữ liệu..."
    : loadError === "auth_failed"
      ? "Phiên đăng nhập hết hạn."
      : loadError === "load_failed"
        ? "Tải dữ liệu thất bại"
        : "Không có dữ liệu";

  const cols = useMemo<Column<AdminPostRow>[]>(
    () => [
      { key: "title", header: "Tiêu đề", width: "24%" },
      { key: "owner", header: "Người đăng", sortable: true, width: "14%" },
      { key: "city", header: "Địa chỉ", sortable: true, width: "22%" },
      {
        key: "price",
        header: "Giá",
        sortable: true,
        width: "10%",
        render: (row) => <span className="font-medium">{formatPriceVnd(row.price)}</span>,
        sortValue: (row) => row.price,
      },
      {
        key: "status",
        header: "Trạng thái",
        sortable: true,
        width: "10%",
        render: (row) => (
          <StatusBadge label={statusLabel(row.status, row.resubmittedAt)} tone={statusTone(row.status)} />
        ),
      },
      {
        key: "createdAt",
        header: "Ngày tạo",
        sortable: true,
        width: "10%",
        sortValue: (row) => row.createdAtValue,
      },
      {
        key: "actions",
        header: "Thao tác",
        align: "right",
        width: "10%",
        render: (row) => (
          <div className="flex flex-col items-stretch gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void handleStatusChange(row.id, "approved");
              }}
              disabled={row.status === "approved" || actionKey === `${row.id}:approved`}
              className={`${actionButtonBase} border-emerald-200 text-emerald-700 hover:bg-emerald-50`}
            >
              {actionKey === `${row.id}:approved` ? "Đang duyệt..." : "Duyệt"}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openRejectDialog(row.id);
              }}
              disabled={actionKey === `${row.id}:rejected`}
              className={`${actionButtonBase} border-rose-200 text-rose-700 hover:bg-rose-50`}
            >
              {actionKey === `${row.id}:rejected` ? "Đang từ chối..." : "Từ chối"}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void handleStatusChange(row.id, "hidden");
              }}
              disabled={row.status === "hidden" || actionKey === `${row.id}:hidden`}
              className={`${actionButtonBase} border-gray-200 text-gray-700 hover:bg-gray-50`}
            >
              {actionKey === `${row.id}:hidden` ? "Đang cập nhật..." : "Cân nhắc"}
            </button>
          </div>
        ),
      },
    ],
    [actionKey, handleStatusChange, openRejectDialog],
  );

  return (
    <div className="space-y-6">
      <SectionCard
        title="Listings"
        subtitle="Review, approve, and manage user listings"
      >
        <FiltersBar
          q={q}
          onQ={setQ}
          status={status}
          onStatus={handleFilterStatusChange}
          statusOptions={statusOptions}
          placeholder="Search by title, owner, address"
        />
        {loadError === "auth_failed" ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
          >
            Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.
          </div>
        ) : null}
        {loadError === "load_failed" ? (
          <div
            role="alert"
            className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            <span>Không thể tải dữ liệu. Thử lại.</span>
            <button
              type="button"
              onClick={() => void fetchPosts()}
              disabled={loading || sessionStatus === "loading"}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Tải lại
            </button>
          </div>
        ) : null}
        {actionError ? (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {actionError}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Bảng danh sách"
        subtitle={`${filteredRows.length} kết quả`}
        contentClassName="p-0"
      >
        <DataTable<AdminPostRow>
          rows={filteredRows}
          columns={cols}
          pageSize={8}
          rowKey={(row) => String(row.id)}
          emptyText={emptyText}
          onRowClick={handleRowSelect}
          getRowClassName={(row) =>
            row.id === selectedId ? "bg-gray-50/80" : ""
          }
        />
      </SectionCard>

      <SectionCard
        title="Chi tiết bài đăng"
        subtitle={selectedPost ? `#${selectedPost.id}` : "Chọn một bài đăng để xem chi tiết"}
        contentClassName="space-y-6"
      >
        {!selectedPost ? (
          <div className="text-sm text-gray-500">Chưa có bài đăng nào được chọn.</div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[2.2fr,1fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-gray-100 bg-white p-5">
                <div className="text-xs font-semibold uppercase text-gray-500">Thông tin chính</div>
                <div className="mt-3 space-y-3">
                  <div className="text-xl font-semibold text-gray-900">{selectedPost.title}</div>
                  <p className="text-sm leading-6 text-gray-700">
                    {selectedPost.description || "Chưa có mô tả chi tiết."}
                  </p>
                </div>
              </div>
              {selectedNormalizedStatus === "pending" && selectedPost.resubmittedAt ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <div className="text-xs font-semibold uppercase text-amber-600">Thông báo gửi lại</div>
                  <p className="mt-2 text-sm text-amber-700">
                    Bài đăng đã được chỉnh sửa và gửi lại lúc{" "}
                    {formatDateTime(selectedPost.resubmittedAt ?? undefined)}.
                  </p>
                </div>
              ) : null}
              {selectedNormalizedStatus === "rejected" ? (
                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                  <div className="text-xs font-semibold uppercase text-rose-500">Lý do từ chối</div>
                  <p className="mt-2 text-sm text-rose-700">
                    {selectedPost.rejectionReason || "Chưa có lý do từ chối."}
                  </p>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <div className="text-xs font-semibold uppercase text-gray-500">Địa chỉ & phân loại</div>
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    <div>
                      <span className="font-semibold text-gray-900">Địa chỉ: </span>
                      {selectedPost.address || "Chưa có"}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">Danh mục: </span>
                      {formatCategoryName(selectedPost.category?.name)}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-4">
                  <div className="text-xs font-semibold uppercase text-gray-500">Giá & diện tích</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="text-[11px] font-semibold uppercase text-gray-500">Giá</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatPriceVnd(toNumberValue(selectedPost.price))} / tháng
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="text-[11px] font-semibold uppercase text-gray-500">Diện tích</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {toNumberValue(selectedPost.area)} m²
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 sm:col-span-2">
                      <div className="text-[11px] font-semibold uppercase text-gray-500">Số người tối đa</div>
                      <div className="text-sm font-semibold text-gray-900">
                        {selectedPost.max_occupancy ?? "Chưa rõ"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <div className="text-xs font-semibold uppercase text-gray-500">Bản đồ vị trí</div>
                  <div className="text-xs text-gray-500">Ưu tiên theo tọa độ</div>
                </div>
                {mapSrc ? (
                  <div className="relative h-72 w-full">
                    <iframe
                      title="Bản đồ"
                      src={mapSrc}
                      className="h-full w-full"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                    <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="absolute inset-0 rounded-full bg-[#D51F35]/25 animate-ping" />
                      <span className="block h-10 w-10 rounded-full bg-[#D51F35]/40 ring-2 ring-[#D51F35]/80 shadow-[0_0_18px_rgba(213,31,53,0.6)]" />
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-6 text-sm text-gray-500">Chưa có vị trí bản đồ.</div>
                )}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="text-xs font-semibold uppercase text-gray-500">Tiện ích</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(selectedPost.amenities ?? []).length > 0 ? (
                    selectedPost.amenities?.map((amenity, idx) => (
                      <span
                        key={`${amenity.name ?? "amenity"}-${idx}`}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700"
                      >
                        {formatAmenityName(amenity.name)}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Không có thông tin tiện ích.</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase text-gray-500">Hình ảnh</div>
                  <div className="text-xs text-gray-500">Bấm vào ảnh để phóng to</div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {selectedImages.length > 0 ? (
                    selectedImages.map((src, idx) => (
                      <button
                        key={`${src}-${idx}`}
                        type="button"
                        onClick={() => openLightbox(idx)}
                        aria-label={`Xem ảnh ${idx + 1}`}
                        className="relative h-32 cursor-zoom-in overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
                      >
                        <Image
                          src={src}
                          alt={`Ảnh ${idx + 1}`}
                          fill
                          sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 100vw"
                          className="object-cover"
                        />
                      </button>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">Không có hình ảnh.</div>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase text-gray-500">Trạng thái</div>
                  <StatusBadge
                    label={statusLabel(selectedNormalizedStatus, selectedPost.resubmittedAt)}
                    tone={statusTone(selectedNormalizedStatus)}
                  />
                </div>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => void handleStatusChange(selectedPost.id, "approved")}
                    disabled={
                      selectedNormalizedStatus === "approved" ||
                      actionKey === `${selectedPost.id}:approved`
                    }
                    className={`${actionButtonBase} border-emerald-200 text-emerald-700 hover:bg-emerald-50`}
                  >
                    {actionKey === `${selectedPost.id}:approved` ? "Đang duyệt..." : "Duyệt"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openRejectDialog(selectedPost.id)}
                    disabled={actionKey === `${selectedPost.id}:rejected`}
                    className={`${actionButtonBase} border-rose-200 text-rose-700 hover:bg-rose-50`}
                  >
                    {actionKey === `${selectedPost.id}:rejected` ? "Đang từ chối..." : "Từ chối"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleStatusChange(selectedPost.id, "hidden")}
                    disabled={
                      selectedNormalizedStatus === "hidden" ||
                      actionKey === `${selectedPost.id}:hidden`
                    }
                    className={`${actionButtonBase} border-gray-200 text-gray-700 hover:bg-gray-50`}
                  >
                    {actionKey === `${selectedPost.id}:hidden` ? "Đang cập nhật..." : "Cân nhắc"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="text-xs font-semibold uppercase text-gray-500">Người đăng</div>
                <div className="mt-2 text-sm font-semibold text-gray-900">
                  {selectedPost.user?.profile?.full_name ||
                    selectedPost.user?.username ||
                    selectedPost.user?.email ||
                    "Chưa rõ"}
                </div>
                <div className="text-xs text-gray-500">{selectedPost.user?.email || ""}</div>
                {selectedPost.user?.profile?.phone_number ? (
                  <div className="text-xs text-gray-500">{selectedPost.user.profile.phone_number}</div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="text-xs font-semibold uppercase text-gray-500">Thời gian</div>
                <div className="mt-2 space-y-2 text-sm text-gray-700">
                  <div>
                    <span className="font-semibold text-gray-900">Tạo lúc: </span>
                    {formatDateTime(selectedPost.createdAt ?? selectedPost.updatedAt)}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900">Cập nhật: </span>
                    {formatDateTime(selectedPost.updatedAt)}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </SectionCard>

      {rejectTargetId !== null ? (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
          onClick={closeRejectDialog}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-lg font-semibold text-gray-900">Từ chối bài đăng</div>
            <div className="mt-1 text-sm text-gray-500">
              {rejectTargetPost?.title || "Bài đăng"} • Vui lòng nhập lý do rõ ràng để người dùng chỉnh sửa.
            </div>
            <div className="mt-4 space-y-2">
              <label className="text-sm font-semibold text-gray-700" htmlFor="reject-reason">
                Lý do từ chối
              </label>
              <div className="flex flex-wrap gap-2">
                {rejectReasonPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => appendRejectPreset(preset)}
                    className="inline-flex h-7 items-center rounded-full border border-gray-200 bg-gray-50 px-3 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                rows={4}
                placeholder="Ví dụ: Ảnh không rõ, thiếu thông tin giá thuê, địa chỉ chưa đầy đủ..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300"
              />
              {rejectError ? <div className="text-xs text-rose-600">{rejectError}</div> : null}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeRejectDialog}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void confirmReject()}
                disabled={actionKey === `${rejectTargetId}:rejected`}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionKey === `${rejectTargetId}:rejected` ? "Đang gửi..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeImageSrc ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closeLightbox}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="relative h-full w-full max-w-6xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={activeImageSrc}
              alt="Ảnh phóng to"
              fill
              sizes="100vw"
              className="object-contain"
            />
            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Đóng ảnh"
              className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-2 text-sm font-semibold text-white hover:bg-black/80"
            >
              Đóng
            </button>
            {imageCount > 1 ? (
              <>
                <button
                  type="button"
                  onClick={showPrevImage}
                  aria-label="Ảnh trước"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-sm font-semibold text-white hover:bg-black/80"
                >
                  Trước
                </button>
                <button
                  type="button"
                  onClick={showNextImage}
                  aria-label="Ảnh sau"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-sm font-semibold text-white hover:bg-black/80"
                >
                  Sau
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                  {lightboxIndex === null ? 0 : lightboxIndex + 1}/{imageCount}
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
