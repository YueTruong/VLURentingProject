"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; // 👈 1. Import Router
import UserTopBar from "@/app/homepage/components/UserTopBar";
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  type Notification 
} from "@/app/services/notifications";

// --- Utility: Format thời gian ---
function parseNotificationDate(dateString: string) {
  const normalized = dateString.includes("T") ? dateString : dateString.replace(" ", "T");
  const safe = /[zZ]|[+-]\d\d:?\d\d$/.test(normalized) ? normalized : `${normalized}Z`;
  const date = new Date(safe);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatTimeAgo(dateString: string) {
  const date = parseNotificationDate(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "Vừa xong";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string }> = {
    system: { label: "Hệ thống", color: "bg-(--theme-surface-muted) text-(--theme-text-muted)" },
    message: { label: "Tin nhắn", color: "bg-(--brand-primary-soft) text-(--brand-primary-text)" },
    listing: { label: "Tin phòng", color: "bg-(--brand-accent-soft) text-(--brand-accent)" },
  };
  const chosen = map[type] || map.system;
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${chosen.color}`}>{chosen.label}</span>;
}

// 👈 Thêm prop onOpenDetail
function NotificationCard({ 
  item, 
  onMarkRead, 
  onOpenDetail 
}: { 
  item: Notification; 
  onMarkRead: (id: number) => void;
  onOpenDetail: (item: Notification) => void;
}) {
  const isUnread = !item.isRead;
  const border = isUnread
    ? "border-[color:var(--brand-accent-soft)] bg-[color:var(--brand-accent-soft)]/35"
    : "border-(--theme-border) bg-(--theme-surface)";

  return (
    <article className={`rounded-2xl border ${border} p-4 shadow-sm transition-all duration-300 hover:shadow-md`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 cursor-pointer" onClick={() => onOpenDetail(item)}>
          <h3 className={`text-base text-(--theme-text) ${isUnread ? 'font-bold' : 'font-medium'}`}>{item.title}</h3>
          <p className="mt-1 text-sm text-(--theme-text-muted)">{item.message}</p>
          <p className="mt-2 text-xs text-(--theme-text-subtle)">{formatTimeAgo(item.createdAt)}</p>
        </div>
        <TypeBadge type={item.type} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {isUnread && (
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Tránh kích hoạt click của thẻ cha
              onMarkRead(item.id);
            }}
            className="rounded-full border border-(--theme-border) bg-(--theme-surface) px-3 py-2 text-xs font-semibold text-(--theme-text) hover:bg-(--theme-surface-muted) active:scale-95"
          >
            Đánh dấu đã đọc
          </button>
        )}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(item);
          }}
          className="rounded-full bg-(--surface-navy-900) px-3 py-2 text-xs font-semibold text-white hover:bg-(--surface-navy-800) active:scale-95"
        >
          Mở chi tiết
        </button>
      </div>
    </article>
  );
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter(); // 👈 Init Router
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      if (status === "loading") return;
      const token = session?.user?.accessToken;

      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await getNotifications(token);
        setNotifications(data);
      } catch (err) {
        console.error("Lỗi tải thông báo:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session, status]);

  // Xử lý đọc 1 tin
  const handleMarkAsRead = async (id: number) => {
    const token = session?.user?.accessToken;
    if (!token) return;

    setNotifications((prev) => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );

    try {
      await markNotificationAsRead(id, token);
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
    }
  };

  // Xử lý đọc hết
  const handleMarkAll = async () => {
    const token = session?.user?.accessToken;
    if (!token) return;

    if (confirm("Bạn muốn đánh dấu tất cả là đã đọc?")) {
       setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
       try {
         await markAllNotificationsAsRead(token);
       } catch (error) {
         console.error("Lỗi đánh dấu tất cả:", error);
       }
    }
  };

  // 👈 LOGIC MỞ CHI TIẾT
  const handleOpenDetail = async (item: Notification) => {
    // 1. Nếu chưa đọc thì đánh dấu đã đọc trước
    if (!item.isRead) {
       await handleMarkAsRead(item.id);
    }

    // 2. Điều hướng dựa theo loại thông báo
    if (item.type === 'listing' && item.relatedId) {
      if (item.title.includes("từ chối")) {
        // Nếu bị từ chối, dẫn về trang Quản lý tin để sửa
        router.push('/my-posts'); 
      } else {
        // Nếu được duyệt, dẫn về trang xem chi tiết công khai
        router.push(`/listings/${item.relatedId}`);
      }
    }
    else if (item.type === 'message') {
      // Chuyển sang trang tin nhắn và ưu tiên mở đúng người chat nếu có relatedId
      const chatUrl = item.relatedId ? `/chat?partnerId=${item.relatedId}` : '/chat';
      router.push(chatUrl);
    }
    else {
      // Mặc định reload hoặc không làm gì nếu là system notif không có link
      alert(item.message); 
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-(--theme-bg)">
      <UserTopBar />

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <div className="overflow-hidden rounded-3xl border border-(--theme-border) bg-(--theme-surface) shadow-md">
          <div className="flex items-center gap-4 border-b border-(--theme-border) px-6 pt-6">
            <button className="rounded-t-xl border-b-2 border-(--brand-primary) px-3 pb-3 text-sm font-semibold text-(--brand-primary-text)">
              Thông báo
            </button>
          </div>

          <div className="bg-linear-to-r from-(--surface-navy-900) to-(--surface-navy-700) text-white px-6 py-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded-full bg-white/15 px-2 py-1 text-xs font-semibold uppercase">Thông báo</span>
              </div>
              <h1 className="text-2xl font-bold">Trung tâm thông báo</h1>
              <p className="text-sm text-gray-100">
                Tổng hợp cập nhật mới về tin nhắn, lịch xem phòng và thay đổi từ các tin bạn quan tâm.
              </p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-100">
                {loading ? "Đang tải..." : `${unreadCount} thông báo chưa đọc`}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={handleMarkAll}
                  disabled={unreadCount === 0}
                  className="rounded-full bg-(--brand-accent) px-4 py-2 text-xs font-semibold text-white hover:bg-(--brand-accent-strong) disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Đọc hết
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3 bg-(--theme-surface) px-6 py-5">
            {loading ? (
              <div className="py-10 text-center text-(--theme-text-subtle)">Đang tải dữ liệu...</div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center text-(--theme-text-subtle)">Bạn chưa có thông báo nào.</div>
            ) : (
              notifications.map((n) => (
                <NotificationCard 
                  key={n.id} 
                  item={n} 
                  onMarkRead={handleMarkAsRead} 
                  onOpenDetail={handleOpenDetail} // 👈 Truyền hàm xuống
                />
              ))
            )}
            
            {notifications.length > 0 && (
              <div className="flex justify-center py-2">
                <button className="text-sm font-semibold text-(--brand-primary-text) hover:underline">
                  Xem các thông báo cũ hơn
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
