"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import UserPageShell from "@/app/homepage/components/UserPageShell";
import {
  deletePost,
  getMyPosts,
  updatePost,
  uploadImages,
  type Post,
  type UpdatePostPayload,
} from "@/app/services/posts";

type EditDraft = {
  title: string;
  price: string;
  area: string;
  address: string;
  description: string;
  maxOccupancy: string;
  campus: "CS1" | "CS2" | "CS3";
  availability: "available" | "rented";
  videoUrl: string;
  existingImages: string[];
  newImages: File[];
  imagesTouched: boolean;
};

// Định nghĩa kiểu dữ liệu cho User có thêm accessToken để dùng lại
type UserWithToken = {
  accessToken?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

const formatPriceVnd = (value: number | string | undefined) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "--";
  return `${numeric.toLocaleString("vi-VN")} đ`;
};

const formatDate = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "--";
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const statusLabel = (status?: string) => {
  const normalized = (status ?? "pending").toLowerCase();
  if (normalized === "approved") return "Đã duyệt";
  if (normalized === "pending") return "Chờ duyệt";
  if (normalized === "rejected") return "Từ chối";
  if (normalized === "hidden") return "Cân nhắc";
  if (normalized === "rented") return "Đã cho thuê";
  return status ?? "Chờ duyệt";
};

const statusClass = (status?: string) => {
  const normalized = (status ?? "pending").toLowerCase();
  if (normalized === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized === "rejected") return "border-rose-200 bg-rose-50 text-rose-700";
  if (normalized === "hidden") return "border-gray-200 bg-gray-50 text-gray-700";
  if (normalized === "rented") return "border-indigo-200 bg-indigo-50 text-indigo-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
};

const parseNumberInput = (value: string) => {
  const cleaned = value.replace(/[^\d.]/g, "").trim();
  if (!cleaned) return undefined;
  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : undefined;
};

export default function MyPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  
  const { data: session, status } = useSession();


  useEffect(() => {
    // 1. Nếu session chưa sẵn sàng, không làm gì cả
    if (status === "loading") return;

    // 2. Lấy token an toàn
    const accessToken = session?.user?.accessToken;

    // 3. Nếu load xong mà không có token => Người dùng chưa đăng nhập
    if (!accessToken) {
      setLoadError("load_failed");
      setLoading(false);
      return;
    }
    let active = true;
    
    // 4. Gọi API kèm Token
    getMyPosts(accessToken)
      .then((data) => {
        if (!active) return;
        setPosts(data);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Lỗi tải tin:", err);
        setLoadError("load_failed");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session, status]);

  const editingPost = useMemo(
    () => posts.find((post) => post.id === editingId) ?? null,
    [posts, editingId],
  );


  const mapPreviewQuery = useMemo(() => {
    if (!editDraft?.address) return "";
    return editDraft.address.trim();
  }, [editDraft?.address]);

  const openEdit = (post: Post) => {
    const existingImages = (post.images ?? [])
      .map((image) => image?.image_url ?? "")
      .filter(Boolean);
    setEditingId(post.id);
    setEditDraft({
      title: post.title ?? "",
      price: post.price !== undefined && post.price !== null ? String(post.price) : "",
      area: post.area !== undefined && post.area !== null ? String(post.area) : "",
      address: post.address ?? "",
      description: post.description ?? "",
      maxOccupancy:
        post.max_occupancy !== undefined && post.max_occupancy !== null
          ? String(post.max_occupancy)
          : "",
      campus: post.campus ?? "CS1",
      availability: post.availability ?? "available",
      videoUrl: post.videoUrl ?? "",
      existingImages,
      newImages: [],
      imagesTouched: false,
    });
    setEditError(null);
  };

  const closeEdit = () => {
    setEditingId(null);
    setEditDraft(null);
    setEditError(null);
  };

  const handleSave = async () => {
    if (!editDraft || !editingId) return;

    // ✅ FIX 1: Ép kiểu tường minh thay vì dùng 'any'
    const user = session?.user as UserWithToken | undefined;
    const accessToken = user?.accessToken;

    if (!accessToken) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
        return;
    }

    const payload: UpdatePostPayload = {};

    const title = editDraft.title.trim();
    const address = editDraft.address.trim();
    const description = editDraft.description.trim();
    if (title) payload.title = title;
    if (address) payload.address = address;
    if (description) payload.description = description;

    const price = parseNumberInput(editDraft.price);
    if (price !== undefined) payload.price = price;

    const area = parseNumberInput(editDraft.area);
    if (area !== undefined) payload.area = area;

    const maxOcc = parseNumberInput(editDraft.maxOccupancy);
    if (maxOcc !== undefined) payload.max_occupancy = Math.max(1, Math.floor(maxOcc));

    payload.campus = editDraft.campus;
    payload.availability = editDraft.availability;
    payload.videoUrl = editDraft.videoUrl.trim() || undefined;

    if (Object.keys(payload).length === 0 && !editDraft.imagesTouched) {
      setEditError("Vui lòng nhập ít nhất một thông tin để cập nhật.");
      return;
    }

    setEditError(null);
    setSavingId(editingId);
    try {
      if (editDraft.imagesTouched) {
        const uploaded = editDraft.newImages.length > 0 ? await uploadImages(editDraft.newImages) : [];
        payload.imageUrls = [...editDraft.existingImages, ...uploaded];
      }
      
      const result = await updatePost(editingId, payload, accessToken);
      
      const updated = (result as { data?: Post })?.data ?? (result as Post);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === editingId
            ? { ...post, ...updated, status: "pending", rejectionReason: null }
            : post,
        ),
      );
      closeEdit();
      setNotice("Đã cập nhật và gửi lại cho admin duyệt.");
    } catch (error) {
      console.error(error);
      setEditError("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setSavingId(null);
    }
  };

  const addImages = (files: FileList | null) => {
    if (!files || !editDraft) return;
    const limit = 10;
    const current = editDraft.existingImages.length + editDraft.newImages.length;
    const available = Math.max(0, limit - current);
    const nextFiles = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, available);
    if (nextFiles.length === 0) return;
    setEditDraft((prev) =>
      prev
        ? {
            ...prev,
            newImages: [...prev.newImages, ...nextFiles],
            imagesTouched: true,
          }
        : prev,
    );
  };

  const removeExistingImage = (index: number) => {
    setEditDraft((prev) =>
      prev
        ? {
            ...prev,
            existingImages: prev.existingImages.filter((_, i) => i !== index),
            imagesTouched: true,
          }
        : prev,
    );
  };

  const removeNewImage = (index: number) => {
    setEditDraft((prev) =>
      prev
        ? {
            ...prev,
            newImages: prev.newImages.filter((_, i) => i !== index),
            imagesTouched: true,
          }
        : prev,
    );
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Bạn chắc chắn muốn xóa bài đăng này?");
    if (!confirmed) return;

    // ✅ FIX 2: Ép kiểu tường minh cho hàm xóa
    const user = session?.user as UserWithToken | undefined;
    const accessToken = user?.accessToken;

    if (!accessToken) {
        alert("Bạn cần đăng nhập để thực hiện thao tác này!");
        return;
    }

    setDeletingId(id);
    try {
      await deletePost(id); 
      setPosts((prev) => prev.filter((post) => post.id !== id));
    } catch (error) {
      console.error(error);
      setLoadError("delete_failed");
    } finally {
      setDeletingId(null);
    }
  };

  const statusCounts = useMemo(() => {
    return posts.reduce(
      (acc, post) => {
        const key = (post.status ?? "pending").toLowerCase();
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [posts]);

  return (
    <UserPageShell
      title="Tin đăng của tôi"
      description="Theo dõi trạng thái duyệt, chỉnh sửa hoặc xóa bài đăng nhanh chóng."
      actions={
        <Link
          href="/post"
          className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/20"
        >
          Đăng tin mới
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Tổng tin</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">{posts.length}</div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Chờ duyệt</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {statusCounts.pending ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Đã duyệt</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {statusCounts.approved ?? 0}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Từ chối</div>
            <div className="mt-1 text-2xl font-bold text-gray-900">
              {statusCounts.rejected ?? 0}
            </div>
          </div>
        </div>

        {notice ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </div>
        ) : null}

        {statusCounts.rejected ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Có {statusCounts.rejected} bài đăng bị từ chối. Vui lòng chỉnh sửa để gửi lại duyệt.
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách bài đăng</h2>
            {loading ? (
              <span className="text-sm text-gray-500">Đang tải...</span>
            ) : null}
          </div>

          {loadError ? (
            <div className="mt-4 text-sm text-rose-600">
              {loadError === "load_failed"
                ? "Không thể tải dữ liệu. Vui lòng đăng nhập lại."
                : "Không thể xóa bài đăng. Vui lòng thử lại."}
            </div>
          ) : null}

          {!loading && posts.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
              Bạn chưa có tin đăng nào.
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">{post.title}</div>
                      <div className="mt-1 text-sm text-gray-600">{post.address}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span>Giá: {formatPriceVnd(post.price)}</span>
                        <span>Diện tích: {post.area ?? "--"} m²</span>
                        <span>Ngày tạo: {formatDate(post.createdAt)}</span>
                        <span>Cơ sở: {post.campus ?? "--"}</span>
                        <span>Trạng thái phòng: {post.availability === "rented" ? "Đã cho thuê" : "Còn phòng"}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                          post.status,
                        )}`}
                      >
                        {statusLabel(post.status)}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(post)}
                          className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id)}
                          disabled={deletingId === post.id}
                          className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === post.id ? "Đang xóa..." : "Xóa"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {post.status === "rejected" ? (
                    <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      <span className="font-semibold">Lý do từ chối:</span>{" "}
                      {post.rejectionReason || "Chưa có lý do cụ thể."}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingId && editDraft ? (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-100 px-5 pb-3 pt-5">
              <div className="text-lg font-semibold text-gray-900">Cập nhật bài đăng</div>
              <div className="mt-1 text-sm text-gray-500">
                {editingPost?.title || "Bài đăng"} • Các thay đổi sẽ được gửi lại để duyệt nếu cần.
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700" htmlFor="edit-title">
                  Tiêu đề
                </label>
                <input
                  id="edit-title"
                  value={editDraft.title}
                  onChange={(event) =>
                    setEditDraft((prev) => (prev ? { ...prev, title: event.target.value } : prev))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700" htmlFor="edit-price">
                  Giá (VND/tháng)
                </label>
                <input
                  id="edit-price"
                  value={editDraft.price}
                  onChange={(event) =>
                    setEditDraft((prev) => (prev ? { ...prev, price: event.target.value } : prev))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700" htmlFor="edit-area">
                  Diện tích (m²)
                </label>
                <input
                  id="edit-area"
                  value={editDraft.area}
                  onChange={(event) =>
                    setEditDraft((prev) => (prev ? { ...prev, area: event.target.value } : prev))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700" htmlFor="edit-max">
                  Số người tối đa
                </label>
                <input
                  id="edit-max"
                  value={editDraft.maxOccupancy}
                  onChange={(event) =>
                    setEditDraft((prev) =>
                      prev ? { ...prev, maxOccupancy: event.target.value } : prev,
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300"
                  inputMode="numeric"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700" htmlFor="edit-campus">
                  Cơ sở VLU
                </label>
                <select
                  id="edit-campus"
                  value={editDraft.campus}
                  onChange={(event) =>
                    setEditDraft((prev) =>
                      prev ? { ...prev, campus: event.target.value as "CS1" | "CS2" | "CS3" } : prev,
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300"
                >
                  <option value="CS1">CS1</option>
                  <option value="CS2">CS2</option>
                  <option value="CS3">CS3</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700" htmlFor="edit-availability">
                  Tình trạng phòng
                </label>
                <select
                  id="edit-availability"
                  value={editDraft.availability}
                  onChange={(event) =>
                    setEditDraft((prev) =>
                      prev
                        ? { ...prev, availability: event.target.value as "available" | "rented" }
                        : prev,
                    )
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300"
                >
                  <option value="available">Còn phòng</option>
                  <option value="rented">Đã cho thuê</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700" htmlFor="edit-video-url">
                  Video URL (không bắt buộc)
                </label>
                <input
                  id="edit-video-url"
                  value={editDraft.videoUrl}
                  onChange={(event) =>
                    setEditDraft((prev) => (prev ? { ...prev, videoUrl: event.target.value } : prev))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700" htmlFor="edit-address">
                  Địa chỉ
                </label>
                <input
                  id="edit-address"
                  value={editDraft.address}
                  onChange={(event) =>
                    setEditDraft((prev) => (prev ? { ...prev, address: event.target.value } : prev))
                  }
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Bản đồ kiểm tra địa chỉ</label>
                <div className="mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                  {mapPreviewQuery ? (
                    <iframe
                      title="Xem trước vị trí"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(mapPreviewQuery)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                      className="h-64 w-full"
                      loading="lazy"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center px-4 text-center text-sm text-gray-500">
                      Vui lòng nhập địa chỉ để hiển thị bản đồ kiểm tra vị trí.
                    </div>
                  )}
                </div>
                {mapPreviewQuery ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapPreviewQuery)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Mở Google Maps trong tab mới
                  </a>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700" htmlFor="edit-description">
                  Mô tả
                </label>
                <textarea
                  id="edit-description"
                  value={editDraft.description}
                  onChange={(event) =>
                    setEditDraft((prev) =>
                      prev ? { ...prev, description: event.target.value } : prev,
                    )
                  }
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-300"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">Hình ảnh</label>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {editDraft.existingImages.map((src, idx) => (
                    <div
                      key={`${src}-${idx}`}
                      className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Ảnh ${idx + 1}`} className="h-28 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(idx)}
                        className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-gray-700 shadow"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                  {editDraft.newImages.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="relative overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gray-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Ảnh mới ${idx + 1}`}
                        className="h-28 w-full object-cover"
                      />
                      <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-semibold text-gray-700 shadow">
                        Ảnh mới
                      </span>
                      <button
                        type="button"
                        onClick={() => removeNewImage(idx)}
                        className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-gray-700 shadow"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                  {editDraft.existingImages.length === 0 && editDraft.newImages.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                      Chưa có ảnh nào cho bài đăng này.
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                    Thêm ảnh
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => addImages(event.target.files)}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-gray-500">Tối đa 10 ảnh.</span>
                </div>
              </div>
            </div>

              {editError ? <div className="mt-3 text-sm text-rose-600">{editError}</div> : null}
            </div>

            <div className="border-t border-gray-100 px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={savingId === editingId}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingId === editingId ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </UserPageShell>
  );
}