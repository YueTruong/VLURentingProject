"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import UserPageShell from "@/app/homepage/components/UserPageShell";
import toast from "react-hot-toast";

interface CustomSession {
  user?: {
    accessToken?: string;
    role?: string;
  };
}

// --- Types ---
type Booking = {
  id: number;
  booking_date: string;
  time_slot: string;
  note: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  student: {
    id: number;
    email: string;
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
  };
};

export default function ManageBookingsPage() {
    const { data: session } = useSession();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const fetchBookings = useCallback(async () => {
        try {
            const customSession = session as CustomSession;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
            const res = await fetch(`${apiUrl}/bookings/landlord-bookings`, {
                headers: {
                Authorization: `Bearer ${customSession?.user?.accessToken}`,
                },
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setBookings(data);
        } catch {
            toast.error("Không thể tải danh sách lịch hẹn.");
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (session?.user) fetchBookings();
    }, [session, fetchBookings]);

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            const customSession = session as CustomSession;
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
            const res = await fetch(`${apiUrl}/bookings/${id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${customSession?.user?.accessToken}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error();

            toast.success(newStatus === "approved" ? "Đã duyệt lịch hẹn!" : "Đã từ chối lịch hẹn.");
            // Cập nhật lại state tại chỗ để UI thay đổi ngay lập tức
            setBookings((prev) =>
                prev.map((b) => (b.id === id ? { ...b, status: newStatus as Booking["status"] } : b))
            );
        } catch{
            toast.error("Thao tác thất bại.");
        }
    };

  return (
    <UserPageShell
      title="Quản lý lịch hẹn xem phòng"
      description="Xem và phản hồi các yêu cầu hẹn xem phòng từ sinh viên."
    >
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
        ) : bookings.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-12 text-center dark:bg-gray-900 dark:border-gray-800">
            <p className="text-gray-500">Chưa có sinh viên nào đặt lịch xem phòng của bạn.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="group relative flex flex-col md:flex-row md:items-center gap-6 rounded-4xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                {/* Avatar SV */}
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-gray-100">
                  <Image
                    src={booking.student.profile.avatar_url || "/images/Admins.png"}
                    alt="Student"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Thông tin chính */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {booking.student.profile.full_name}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                        booking.status === "approved"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
                          : booking.status === "rejected"
                          ? "bg-red-50 text-red-600 dark:bg-red-900/20"
                          : "bg-blue-50 text-blue-600 dark:bg-blue-900/20"
                      }`}
                    >
                      {booking.status === "pending" ? "Đang chờ" : booking.status === "approved" ? "Đã duyệt" : "Đã từ chối"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    📍 {booking.post.title}
                  </p>
                  <div className="flex flex-wrap gap-4 pt-1 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-gray-200">
                      📅 {new Date(booking.booking_date).toLocaleDateString("vi-VN")}
                    </span>
                    <span className="flex items-center gap-1.5 font-semibold text-gray-900 dark:text-gray-200">
                      ⏰ {booking.time_slot}
                    </span>
                  </div>
                  {booking.note && (
                    <p className="mt-2 rounded-xl bg-gray-50 p-3 text-xs italic text-gray-500 dark:bg-gray-800/50">
                      &quot; {booking.note} &quot;
                    </p>
                  )}
                </div>

                {/* Nút hành động */}
                <div className="flex shrink-0 gap-2">
                  {booking.status === "pending" ? (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(booking.id, "rejected")}
                        className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      >
                        Từ chối
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(booking.id, "approved")}
                        className="rounded-full bg-[#d51f35] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-[#b01628] active:scale-95"
                      >
                        Duyệt ngay
                      </button>
                    </>
                  ) : (
                    <button
                      disabled
                      className="rounded-full bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-400 dark:bg-gray-800"
                    >
                      Đã xử lý
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserPageShell>
  );
}