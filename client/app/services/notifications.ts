import axios from 'axios';

export type Notification = {
  id: number;
  title: string;
  message: string;
  type: "listing" | "message" | "system" | "booking";
  isRead: boolean;
  createdAt: string;
  relatedId?: number;
};

// Helper lấy URL
const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

function normalizeNotificationText(text: string) {
  if (!text) return text;

  return text
    .replace(/Yeu cau o ghep moi can duyet/gi, 'Yêu cầu ở ghép mới cần duyệt')
    .replace(/Yeu cau o ghep da duoc duyet/gi, 'Yêu cầu ở ghép đã được duyệt')
    .replace(/Yeu cau o ghep bi tu choi/gi, 'Yêu cầu ở ghép bị từ chối')
    .replace(/Yeu cau o ghep dang cho duyet/gi, 'Yêu cầu ở ghép đang chờ duyệt')
    .replace(/Yeu cau o ghep cho phong/gi, 'Yêu cầu ở ghép cho phòng')
    .replace(/da duoc admin chap nhan va da hien thi trong listings/gi, 'đã được quản trị viên chấp nhận và đã hiển thị công khai')
    .replace(/da duoc admin chap nhan/gi, 'đã được quản trị viên chấp nhận')
    .replace(/da bi admin tu choi/gi, 'đã bị quản trị viên từ chối')
    .replace(/dang cho admin xac nhan/gi, 'đang chờ quản trị viên duyệt')
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
  const res = await axios.get<Notification[]>(`${getBaseUrl()}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.map((item) => ({
    ...item,
    title: normalizeNotificationText(item.title),
    message: normalizeNotificationText(item.message),
  }));
}

export async function markNotificationAsRead(id: number, token: string) {
  const res = await axios.patch(
    `${getBaseUrl()}/notifications/${id}/read`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function markAllNotificationsAsRead(token: string) {
  const res = await axios.patch(
    `${getBaseUrl()}/notifications/read-all`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
