"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import SectionCard from "../../components/SectionCard";
import {
  AmenityItem,
  CategoryItem,
  createAdminAmenity,
  createAdminCategory,
  deleteAdminAmenity,
  deleteAdminCategory,
  getAdminAmenities,
  getAdminCategories,
  updateAdminAmenity,
  updateAdminCategory,
} from "@/app/services/admin-catalog";

export default function CatalogPage() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [amenities, setAmenities] = useState<AmenityItem[]>([]);
  const [catName, setCatName] = useState("");
  const [amenityName, setAmenityName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingAmenityId, setEditingAmenityId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoading = status === "loading" || (!!token && loading);
  const isEditing = editingCategoryId !== null || editingAmenityId !== null;

  useEffect(() => {
    if (status === "loading") return;

    if (!token) {
      setCategories([]);
      setAmenities([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([getAdminCategories(token), getAdminAmenities(token)])
      .then(([cats, ams]) => {
        if (!active) return;
        setCategories(cats);
        setAmenities(ams);
      })
      .catch(() => {
        if (!active) return;
        setError("Không thể tải dữ liệu danh mục/tiện ích. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [status, token]);

  const handleCreateCategory = async () => {
    if (!token || !catName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createAdminCategory(token, { name: catName.trim() });
      setCategories((prev) => [...prev, created]);
      setCatName("");
    } catch {
      setError("Không thể thêm danh mục. Vui lòng kiểm tra dữ liệu nhập.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAmenity = async () => {
    if (!token || !amenityName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createAdminAmenity(token, { name: amenityName.trim() });
      setAmenities((prev) => [...prev, created]);
      setAmenityName("");
    } catch {
      setError("Không thể thêm tiện ích. Vui lòng kiểm tra dữ liệu nhập.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteAdminCategory(token, id);
      setCategories((prev) => prev.filter((item) => item.id !== id));
      if (editingCategoryId === id) cancelEdit();
    } catch {
      setError("Không thể xóa danh mục. Danh mục có thể đang được sử dụng.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAmenity = async (id: number) => {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteAdminAmenity(token, id);
      setAmenities((prev) => prev.filter((item) => item.id !== id));
      if (editingAmenityId === id) cancelEdit();
    } catch {
      setError("Không thể xóa tiện ích. Tiện ích có thể đang được sử dụng.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEditCategory = (item: CategoryItem) => {
    setEditingCategoryId(item.id);
    setEditingAmenityId(null);
    setEditingName(item.name);
  };

  const startEditAmenity = (item: AmenityItem) => {
    setEditingAmenityId(item.id);
    setEditingCategoryId(null);
    setEditingName(item.name);
  };

  const cancelEdit = () => {
    setEditingCategoryId(null);
    setEditingAmenityId(null);
    setEditingName("");
  };

  const handleUpdateCategory = async (id: number) => {
    if (!token || !editingName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await updateAdminCategory(token, id, { name: editingName.trim() });
      setCategories((prev) => prev.map((item) => (item.id === id ? updated : item)));
      cancelEdit();
    } catch {
      setError("Không thể cập nhật danh mục. Vui lòng kiểm tra dữ liệu nhập.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateAmenity = async (id: number) => {
    if (!token || !editingName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await updateAdminAmenity(token, id, { name: editingName.trim() });
      setAmenities((prev) => prev.map((item) => (item.id === id ? updated : item)));
      cancelEdit();
    } catch {
      setError("Không thể cập nhật tiện ích. Vui lòng kiểm tra dữ liệu nhập.");
    } finally {
      setSubmitting(false);
    }
  };

  const emptyState = useMemo(() => {
    if (isLoading) return null;
    if (!token) return "Bạn cần đăng nhập tài khoản admin để quản lý catalog.";
    if (categories.length === 0 && amenities.length === 0) {
      return "Chưa có dữ liệu danh mục hoặc tiện ích.";
    }
    return null;
  }, [amenities.length, categories.length, isLoading, token]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {emptyState && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {emptyState}
        </div>
      )}

      <SectionCard title="Quản lý danh mục" subtitle="CRUD danh mục phòng cho admin">
        <div className="flex gap-2">
          <input
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            placeholder="Tên danh mục mới"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            disabled={submitting || !token}
          />
          <button
            onClick={handleCreateCategory}
            disabled={submitting || !token}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Thêm
          </button>
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-gray-500">Đang tải...</p>
        ) : (
          <div className="mt-4 space-y-2">
            {categories.map((item) => {
              const itemEditing = editingCategoryId === item.id;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2"
                >
                  {itemEditing ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
                      disabled={submitting}
                    />
                  ) : (
                    <span className="text-sm text-gray-800">
                      #{item.id} - {item.name}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    {itemEditing ? (
                      <>
                        <button
                          onClick={() => handleUpdateCategory(item.id)}
                          disabled={submitting}
                          className="text-xs font-semibold text-blue-600 disabled:opacity-60"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={submitting}
                          className="text-xs font-semibold text-gray-500 disabled:opacity-60"
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditCategory(item)}
                        disabled={submitting || isEditing}
                        className="text-xs font-semibold text-blue-600 disabled:opacity-60"
                      >
                        Sửa
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteCategory(item.id)}
                      disabled={submitting}
                      className="text-xs font-semibold text-red-600 disabled:opacity-60"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Quản lý tiện ích" subtitle="CRUD tiện ích cho admin">
        <div className="flex gap-2">
          <input
            value={amenityName}
            onChange={(e) => setAmenityName(e.target.value)}
            placeholder="Tên tiện ích mới"
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            disabled={submitting || !token}
          />
          <button
            onClick={handleCreateAmenity}
            disabled={submitting || !token}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Thêm
          </button>
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-gray-500">Đang tải...</p>
        ) : (
          <div className="mt-4 space-y-2">
            {amenities.map((item) => {
              const itemEditing = editingAmenityId === item.id;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2"
                >
                  {itemEditing ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
                      disabled={submitting}
                    />
                  ) : (
                    <span className="text-sm text-gray-800">
                      #{item.id} - {item.name}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    {itemEditing ? (
                      <>
                        <button
                          onClick={() => handleUpdateAmenity(item.id)}
                          disabled={submitting}
                          className="text-xs font-semibold text-blue-600 disabled:opacity-60"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={submitting}
                          className="text-xs font-semibold text-gray-500 disabled:opacity-60"
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditAmenity(item)}
                        disabled={submitting || isEditing}
                        className="text-xs font-semibold text-blue-600 disabled:opacity-60"
                      >
                        Sửa
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAmenity(item.id)}
                      disabled={submitting}
                      className="text-xs font-semibold text-red-600 disabled:opacity-60"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
