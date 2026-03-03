"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import UserPageShell from "@/app/homepage/components/UserPageShell";
import toast from "react-hot-toast";

// Interface để tránh lỗi 'any' của ESLint
interface CustomSession {
  user?: {
    accessToken?: string;
  };
}

type Booking = {
  id: number;
  booking_date: string;
  time_slot: string;
  note: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  landlord: {
    profile: {
      full_name: string;
      avatar_url: string;
      phone_number: string;
    };
  };
  post: {
    id: number;
    title: string;
    address: string;
    images?: { image_url: string }[];
  };
};

// --- Component Skeleton ---
function BookingSkeleton() {
  return (
    <div className="animate-pulse flex flex-col md:flex-row md:items-center gap-6 rounded-4xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="h-20 w-20 rounded-2xl bg-gray-200 dark:bg-gray-800 shrink-0" />
      <div className="flex-1 space-y-3">
        <div className="flex gap-2">
          <div className="h-6 w-48 bg-gray-200 rounded-lg dark:bg-gray-800" />
          <div className="h-6 w-20 bg-gray-100 rounded-full dark:bg-gray-800" />
        </div>
        <div className="h-4 w-64 bg-gray-100 rounded-lg dark:bg-gray-800" />
        <div className="flex gap-4">
          <div className="h-4 w-24 bg-gray-50 rounded-lg dark:bg-gray-800" />
          <div className="h-4 w-24 bg-gray-50 rounded-lg dark:bg-gray-800" />
        </div>
      </div>
      <div className="h-10 w-28 bg-gray-100 rounded-full dark:bg-gray-800" />
    </div>
  );
}

export default function MyBookingsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBookings = useCallback(async () => {
    try {
      setLoading(true);
      const customSession = session as CustomSession;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/bookings/my-bookings`, {
        headers: {
          Authorization: `Bearer ${customSession?.user?.accessToken}`,
        },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBookings(data);
    } catch {
      toast.error("Không thể tải lịch hẹn của bạn.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) fetchMyBookings();
  }, [session, fetchMyBookings]);

  // ✅ LOGIC HỦY LỊCH
  const handleCancel = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn hủy lịch hẹn này không?")) return;

    try {
      const customSession = session as CustomSession;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/bookings/${id}/cancel`, {
        method: "PATCH", 
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${customSession?.user?.accessToken}` 
        },
      });

      if (!res.ok) throw new Error();

      toast.success("Đã hủy lịch hẹn.");
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
    } catch {
      toast.error("Hủy lịch thất bại.");
    }
  };

  return (
    <UserPageShell
      title="Lịch hẹn xem phòng của tôi"
      description="Theo dõi trạng thái các yêu cầu hẹn xem phòng bạn đã gửi."
    >
      <div className="space-y-4">
        {loading ? (
          // ✅ HIỂN THỊ SKELETON KHI ĐANG TẢI
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <BookingSkeleton key={i} />)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-4xl border-2 border-dashed border-gray-200 bg-white p-12 text-center dark:bg-gray-900 dark:border-gray-800">
            <p className="text-gray-500 mb-4">Bạn chưa gửi yêu cầu hẹn xem phòng nào.</p>
            <Link href="/listings" className="text-[#d51f35] font-bold hover:underline">
              Tìm phòng ngay →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className={`group relative flex flex-col md:flex-row md:items-center gap-6 rounded-4xl border p-6 shadow-sm transition-all hover:shadow-md dark:bg-gray-900 ${
                  booking.status === 'cancelled' 
                  ? "bg-gray-50/50 border-gray-100 opacity-75 dark:border-gray-800" 
                  : "bg-white border-gray-100 dark:border-gray-800"
                }`}
              >
                {/* Ảnh bài đăng */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                  <Image
                    src={booking.post.images && booking.post.images.length > 0
                      ? booking.post.images[0].image_url
                      : "/images/House.svg"
                    }
                    alt={booking.post.title}
                    fill
                    className={`object-cover ${booking.status === 'cancelled' ? 'grayscale' : ''}`}
                    unoptimized={true}
                  />
                </div>

                {/* Thông tin chính */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {booking.post.title}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                        booking.status === "approved"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                          : booking.status === "rejected"
                          ? "bg-red-50 text-red-600 dark:bg-red-900/20"
                          : booking.status === "cancelled"
                          ? "bg-gray-100 text-gray-500 dark:bg-gray-800"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                      }`}
                    >
                      {booking.status === "pending" ? "Đang chờ" : 
                       booking.status === "approved" ? "Đã duyệt" : 
                       booking.status === "cancelled" ? "Đã hủy" : "Bị từ chối"}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 font-medium">
                    👤 Chủ nhà: {booking.landlord?.profile?.full_name || "Chưa cập nhật tên"} 
                    {booking.status === "approved" && booking.landlord?.profile?.phone_number && (
                        ` - 📞 ${booking.landlord.profile.phone_number}`
                    )}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-1 text-sm">
                    <span className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-gray-200">
                      📅 {new Date(booking.booking_date).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-gray-200">
                      ⏰ {booking.time_slot}
                    </span>
                  </div>

                  {booking.status === "approved" && (
                    <div className="mt-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-900/20">
                      ✨ Chủ trọ đã đồng ý lịch hẹn. Bạn hãy chủ động liên hệ hoặc đến đúng giờ nhé!
                    </div>
                  )}
                </div>

                {/* Nút hành động */}
                <div className="flex flex-wrap md:flex-nowrap gap-2">
                  {(booking.status === "pending" || booking.status === "approved") && (
                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="rounded-full border border-red-200 px-5 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-all active:scale-95 dark:border-red-900/50 dark:hover:bg-red-900/10"
                    >
                      Hủy lịch
                    </button>
                  )}
                  
                  <Link
                    href={`/listings/${booking.post.id}`}
                    className="rounded-full border border-gray-200 px-6 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all text-center dark:border-gray-700 dark:text-gray-300 active:scale-95"
                  >
                    Xem tin gốc
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserPageShell>
  );
}