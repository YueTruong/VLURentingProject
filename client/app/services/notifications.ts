import axios from 'axios';

export type Notification = {
  id: number;
  title: string;
  message: string;
  type: "listing" | "message" | "system";
  isRead: boolean;
  createdAt: string;
  relatedId?: number;
};

// Helper lấy URL
const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function getNotifications(token: string) {
  const res = await axios.get<Notification[]>(`${getBaseUrl()}/notifications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
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