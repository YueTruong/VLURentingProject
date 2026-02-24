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
} from "@/app/services/admin-catalog";

export default function CatalogPage() {
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [amenities, setAmenities] = useState<AmenityItem[]>([]);
  const [catName, setCatName] = useState("");
  const [amenityName, setAmenityName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    const token = session?.user?.accessToken;
    if (!token) {
      setLoading(false);
      return;
    }

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
  }, [session, status]);

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

  return (
    <div className="space-y-6">
      <SectionCard title="Quản lý danh mục" subtitle="CRUD danh mục phòng cho admin">
        <div className="flex gap-2">
          <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Tên danh mục mới" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <button onClick={handleCreateCategory} className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white">Thêm</button>
        </div>
        {loading ? <p className="mt-4 text-sm text-gray-500">Đang tải...</p> : (
          <div className="mt-4 space-y-2">
            {categories.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
                <span className="text-sm text-gray-800">#{item.id} - {item.name}</span>
                <button onClick={() => handleDeleteCategory(item.id)} className="text-xs font-semibold text-red-600">Xóa</button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Quản lý tiện ích" subtitle="CRUD tiện ích cho admin">
        <div className="flex gap-2">
          <input value={amenityName} onChange={(e) => setAmenityName(e.target.value)} placeholder="Tên tiện ích mới" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          <button onClick={handleCreateAmenity} className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white">Thêm</button>
        </div>
        {loading ? <p className="mt-4 text-sm text-gray-500">Đang tải...</p> : (
          <div className="mt-4 space-y-2">
            {amenities.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
                <span className="text-sm text-gray-800">#{item.id} - {item.name}</span>
                <button onClick={() => handleDeleteAmenity(item.id)} className="text-xs font-semibold text-red-600">Xóa</button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
