import axios from 'axios';
import api from '@/app/services/api';
import { createAuthHeaders, getBackendUrl } from '@/app/lib/backend';

export type Notification = {
  id: number;
  title: string;
  message: string;
  type: "listing" | "message" | "system" | "booking" | "roommate";
  isRead: boolean;
  createdAt: string;
  relatedId?: number;
};

// Helper lấy URL
function normalizeNotificationText(text: string) {
  if (!text) return text;

  return text
    .replace(/Yeu cau xac nhan o ghep/gi, 'Yêu cầu xác nhận ở ghép')
    .replace(/Yeu cau o ghep moi can duyet/gi, 'Yêu cầu ở ghép mới cần duyệt')
    .replace(/Yeu cau o ghep da duoc duyet/gi, 'Yêu cầu ở ghép đã được duyệt')
    .replace(/Yeu cau o ghep bi tu choi/gi, 'Yêu cầu ở ghép bị từ chối')
    .replace(/Yeu cau o ghep dang cho duyet/gi, 'Yêu cầu ở ghép đang chờ duyệt')
    .replace(/Yeu cau o ghep cho phong/gi, 'Yêu cầu ở ghép cho phòng')
    .replace(/Mot sinh vien da tao nhu cau o ghep/gi, 'Một sinh viên đã tạo nhu cầu ở ghép')
    .replace(/gan voi phong/gi, 'gắn với phòng')
    .replace(/da duoc admin chap nhan va da hien thi trong listings/gi, 'đã được quản trị viên chấp nhận và đã hiển thị công khai')
    .replace(/da duoc admin chap nhan/gi, 'đã được quản trị viên chấp nhận')
    .replace(/da bi admin tu choi/gi, 'đã bị quản trị viên từ chối')
    .replace(/dang cho admin xac nhan/gi, 'đang chờ quản trị viên duyệt')
    .replace(/va dang cho xac nhan/gi, 'và đang chờ xác nhận')
    .replace(/da duoc chuyen ve trang thai cho duyet/gi, 'đã được chuyển về trạng thái chờ duyệt')
    .replace(/Tin nhan moi tu/gi, 'Tin nhắn mới từ')
    .replace(/Dang cho ban phan hoi/gi, 'Đang chờ bạn phản hồi')
    .replace(/Yeu cau xem phong moi/gi, 'Yêu cầu xem phòng mới')
    .replace(/Cap nhat lich xem phong/gi, 'Cập nhật lịch xem phòng')
    .replace(/Lich hen da bi huy/gi, 'Lịch hẹn đã bị hủy')
    .replace(/lich hen xem phong/gi, 'lịch hẹn xem phòng')
    .replace(/bai dang/gi, 'bài đăng')
    .replace(/Nha tro/gi, 'Nhà trọ')
    .replace(/Can ho/gi, 'Căn hộ');
}

export async function getNotifications(token: string) {
  const res = await axios.get<Notification[]>(`${getBackendUrl()}/notifications`, {
    headers: createAuthHeaders(token),
  });
  return res.data.map((item) => ({
    ...item,
    title: normalizeNotificationText(item.title),
    message: normalizeNotificationText(item.message),
  }));
}

export async function markNotificationAsRead(id: number, token: string) {
  const res = await axios.patch(
    `${getBackendUrl()}/notifications/${id}/read`,
    {},
    { headers: createAuthHeaders(token) }
  );
  return res.data;
}

export async function markAllNotificationsAsRead(token: string) {
  const res = await axios.patch(
    `${getBackendUrl()}/notifications/read-all`,
    {},
    { headers: createAuthHeaders(token) }
  );
  return res.data;
}

export async function getUnreadNotificationCount(token: string): Promise<number> {
  const response = await api.get<{ count?: number }>('/notifications/unread-count', {
    headers: createAuthHeaders(token),
  });
  return response.data.count ?? 0;
}
