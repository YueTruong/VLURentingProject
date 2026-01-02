export type UserRow = {
  id: string;
  username: string;
  email: string;
  role: "STUDENT" | "LANDLORD" | "ADMIN";
  status: "ACTIVE" | "BLOCKED" | "PENDING";
  createdAt: string;
};

export type ListingRow = {
  id: string;
  title: string;
  owner: string;
  city: string;
  price: number;
  status: "APPROVED" | "PENDING" | "REJECTED";
  createdAt: string;
};

export type TrendPoint = {
  label: string;
  value: number;
};

export type TrendRange = "7d" | "30d";

export type ActivityLogStatus = "success" | "failed";

export type ActivityLog = {
  id: string;
  time: string;
  user: string;
  action: string;
  status: ActivityLogStatus;
  channel: "web" | "mobile" | "api";
  details?: string;
};

export type KpiDatum = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  delta?: { value: string; trend: "up" | "down" };
};

export const kpiCards: KpiDatum[] = [
  {
    id: "total-users",
    label: "Total Users",
    value: "12,480",
    hint: "vs last month",
    delta: { value: "+8.2%", trend: "up" },
  },
  {
    id: "total-listings",
    label: "Total Listings",
    value: "694",
    hint: "All time",
    delta: { value: "+5.1%", trend: "up" },
  },
  {
    id: "active-listings",
    label: "Active Listings",
    value: "541",
    hint: "Live now",
    delta: { value: "+2.4%", trend: "up" },
  },
  {
    id: "monthly-revenue",
    label: "Monthly Revenue",
    value: "128.4M VND",
    hint: "Oct (mock)",
    delta: { value: "+12%", trend: "up" },
  },
  {
    id: "new-users",
    label: "New Users (7d)",
    value: "248",
    hint: "Last 7 days",
    delta: { value: "+14%", trend: "up" },
  },
  {
    id: "success-rate",
    label: "Success Rate",
    value: "92%",
    hint: "Booking conversion",
    delta: { value: "-1.2%", trend: "down" },
  },
];

export const trendSeries: {
  users: Record<TrendRange, TrendPoint[]>;
  listings: Record<TrendRange, TrendPoint[]>;
} = {
  users: {
    "7d": [
      { label: "Mon", value: 42 },
      { label: "Tue", value: 58 },
      { label: "Wed", value: 61 },
      { label: "Thu", value: 70 },
      { label: "Fri", value: 64 },
      { label: "Sat", value: 75 },
      { label: "Sun", value: 80 },
    ],
    "30d": [
      { label: "W1", value: 320 },
      { label: "W2", value: 410 },
      { label: "W3", value: 465 },
      { label: "W4", value: 520 },
    ],
  },
  listings: {
    "7d": [
      { label: "Mon", value: 18 },
      { label: "Tue", value: 20 },
      { label: "Wed", value: 24 },
      { label: "Thu", value: 26 },
      { label: "Fri", value: 28 },
      { label: "Sat", value: 30 },
      { label: "Sun", value: 33 },
    ],
    "30d": [
      { label: "W1", value: 120 },
      { label: "W2", value: 150 },
      { label: "W3", value: 165 },
      { label: "W4", value: 190 },
    ],
  },
};

export const trendUsers = trendSeries.users["7d"];
export const trendListings = trendSeries.listings["7d"];

export const barSources = [
  { label: "Organic", value: 420 },
  { label: "Ads", value: 260 },
  { label: "Referral", value: 180 },
  { label: "Social", value: 140 },
];

export const activities: ActivityLog[] = [
  {
    id: "a1",
    time: "2025-12-30 09:21",
    user: "thu.tran",
    action: "Created listing #482 (District 7)",
    status: "success",
    channel: "web",
    details: "Room 25m2, 3.2M VND/mo",
  },
  {
    id: "a2",
    time: "2025-12-30 08:58",
    user: "minh.le",
    action: "Booking request for #412",
    status: "success",
    channel: "mobile",
    details: "Check-in 05 Jan, 2 tenants",
  },
  {
    id: "a3",
    time: "2025-12-30 08:30",
    user: "hoa.nguyen",
    action: "Login attempt (password)",
    status: "failed",
    channel: "web",
    details: "2FA required after 3 attempts",
  },
  {
    id: "a4",
    time: "2025-12-30 07:50",
    user: "admin.hang",
    action: "Approved listing #476",
    status: "success",
    channel: "web",
    details: "Verified ownership documents",
  },
  {
    id: "a5",
    time: "2025-12-30 07:20",
    user: "khoi.pham",
    action: "Updated pricing for #441",
    status: "success",
    channel: "api",
    details: "From 3.6M -> 3.45M VND",
  },
  {
    id: "a6",
    time: "2025-12-30 06:44",
    user: "vy.dinh",
    action: "Rejected listing #438",
    status: "success",
    channel: "web",
    details: "Missing campus proximity proof",
  },
  {
    id: "a7",
    time: "2025-12-30 06:10",
    user: "loc.do",
    action: "Booking payment failed for #401",
    status: "failed",
    channel: "mobile",
    details: "Card declined by issuer",
  },
  {
    id: "a8",
    time: "2025-12-30 05:55",
    user: "thao.bui",
    action: "Created listing #483 (Thu Duc)",
    status: "success",
    channel: "web",
    details: "Studio 20m2, 2.8M VND/mo",
  },
  {
    id: "a9",
    time: "2025-12-30 05:40",
    user: "quang.ngo",
    action: "Support ticket: noisy room #377",
    status: "success",
    channel: "web",
    details: "Assigned to CS team",
  },
  {
    id: "a10",
    time: "2025-12-30 05:05",
    user: "admin.hang",
    action: "Adjusted success rate baseline",
    status: "success",
    channel: "api",
    details: "Applied new calculation rule",
  },
  {
    id: "a11",
    time: "2025-12-29 22:10",
    user: "son.huynh",
    action: "Login attempt (OTP)",
    status: "failed",
    channel: "mobile",
    details: "Expired OTP code",
  },
  {
    id: "a12",
    time: "2025-12-29 21:33",
    user: "huy.nguyen",
    action: "Booking request for #405",
    status: "success",
    channel: "web",
    details: "Check-in 04 Jan, 1 tenant",
  },
  {
    id: "a13",
    time: "2025-12-29 20:12",
    user: "nhan.tran",
    action: "Updated profile and KYC",
    status: "success",
    channel: "mobile",
    details: "ID + student card",
  },
  {
    id: "a14",
    time: "2025-12-29 19:42",
    user: "anh.dao",
    action: "Removed listing #399",
    status: "success",
    channel: "web",
    details: "Owner request",
  },
];

export const users: UserRow[] = Array.from({ length: 23 }).map((_, i) => ({
  id: String(i + 1),
  username: `user_${i + 1}`,
  email: `user${i + 1}@mail.com`,
  role: i % 8 === 0 ? "ADMIN" : i % 3 === 0 ? "LANDLORD" : "STUDENT",
  status: i % 9 === 0 ? "BLOCKED" : i % 5 === 0 ? "PENDING" : "ACTIVE",
  createdAt: new Date(Date.now() - i * 86400000).toISOString().slice(0, 10),
}));

export const listings: ListingRow[] = Array.from({ length: 19 }).map((_, i) => ({
  id: String(i + 101),
  title: `Listing ${i + 1} near campus`,
  owner: `user_${(i % 12) + 1}`,
  city: i % 2 === 0 ? "HCM" : "Hanoi",
  price: 2500000 + i * 150000,
  status: i % 7 === 0 ? "REJECTED" : i % 4 === 0 ? "PENDING" : "APPROVED",
  createdAt: new Date(Date.now() - i * 43200000).toISOString().slice(0, 10),
}));
