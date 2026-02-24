"use client";

import { useEffect, useState } from "react";
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
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [amenities, setAmenities] = useState<AmenityItem[]>([]);
  const [catName, setCatName] = useState("");
  const [amenityName, setAmenityName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingAmenityId, setEditingAmenityId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [loading, setLoading] = useState(true);
  const token = session?.user?.accessToken;
  const isLoading = status === "loading" || (!!token && loading);

  useEffect(() => {
    if (status === "loading") return;
    if (!token) return;

    let active = true;
    Promise.all([getAdminCategories(token), getAdminAmenities(token)])
      .then(([cats, ams]) => {
        if (!active) return;
        setCategories(cats);
        setAmenities(ams);
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
    const token = session?.user?.accessToken;
    if (!token || !catName.trim()) return;
    const created = await createAdminCategory(token, { name: catName.trim() });
    setCategories((prev) => [...prev, created]);
    setCatName("");
  };

  const handleCreateAmenity = async () => {
    const token = session?.user?.accessToken;
    if (!token || !amenityName.trim()) return;
    const created = await createAdminAmenity(token, { name: amenityName.trim() });
    setAmenities((prev) => [...prev, created]);
    setAmenityName("");
  };

  const handleDeleteCategory = async (id: number) => {
    const token = session?.user?.accessToken;
    if (!token) return;
    await deleteAdminCategory(token, id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleDeleteAmenity = async (id: number) => {
    const token = session?.user?.accessToken;
    if (!token) return;
    await deleteAdminAmenity(token, id);
    setAmenities((prev) => prev.filter((a) => a.id !== id));
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
    const token = session?.user?.accessToken;
    if (!token || !editingName.trim()) return;
    const updated = await updateAdminCategory(token, id, { name: editingName.trim() });
    setCategories((prev) => prev.map((item) => (item.id === id ? updated : item)));
    cancelEdit();
  };

  const handleUpdateAmenity = async (id: number) => {
    const token = session?.user?.accessToken;
    if (!token || !editingName.trim()) return;
    const updated = await updateAdminAmenity(token, id, { name: editingName.trim() });
    setAmenities((prev) => prev.map((item) => (item.id === id ? updated : item)));
    cancelEdit();
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Quản lý danh mục" subtitle="CRUD danh mục phòng cho admin">
        <div className="flex gap-2">
          <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Tên danh mục mới" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <button onClick={handleCreateCategory} className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white">Thêm</button>
        </div>
        {isLoading ? <p className="mt-4 text-sm text-gray-500">Đang tải...</p> : (
          <div className="mt-4 space-y-2">
            {categories.map((item) => {
              const isEditing = editingCategoryId === item.id;
              return (
                <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2">
                  {isEditing ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className="text-sm text-gray-800">#{item.id} - {item.name}</span>
                  )}
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button onClick={() => handleUpdateCategory(item.id)} className="text-xs font-semibold text-blue-600">Lưu</button>
                        <button onClick={cancelEdit} className="text-xs font-semibold text-gray-500">Hủy</button>
                      </>
                    ) : (
                      <button onClick={() => startEditCategory(item)} className="text-xs font-semibold text-blue-600">Sửa</button>
                    )}
                    <button onClick={() => handleDeleteCategory(item.id)} className="text-xs font-semibold text-red-600">Xóa</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Quản lý tiện ích" subtitle="CRUD tiện ích cho admin">
        <div className="flex gap-2">
          <input value={amenityName} onChange={(e) => setAmenityName(e.target.value)} placeholder="Tên tiện ích mới" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <button onClick={handleCreateAmenity} className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white">Thêm</button>
        </div>
        {isLoading ? <p className="mt-4 text-sm text-gray-500">Đang tải...</p> : (
          <div className="mt-4 space-y-2">
            {amenities.map((item) => {
              const isEditing = editingAmenityId === item.id;
              return (
                <div key={item.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 px-3 py-2">
                  {isEditing ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
                    />
                  ) : (
                    <span className="text-sm text-gray-800">#{item.id} - {item.name}</span>
                  )}
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button onClick={() => handleUpdateAmenity(item.id)} className="text-xs font-semibold text-blue-600">Lưu</button>
                        <button onClick={cancelEdit} className="text-xs font-semibold text-gray-500">Hủy</button>
                      </>
                    ) : (
                      <button onClick={() => startEditAmenity(item)} className="text-xs font-semibold text-blue-600">Sửa</button>
                    )}
                    <button onClick={() => handleDeleteAmenity(item.id)} className="text-xs font-semibold text-red-600">Xóa</button>
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
