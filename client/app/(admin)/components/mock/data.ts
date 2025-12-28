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

export const kpis = {
  revenue: "128,400,000 ₫",
  newUsers: "1,248",
  listings: "692",
  conversion: "3.4%",
};

export const trendUsers = [
  { label: "W1", value: 180 },
  { label: "W2", value: 240 },
  { label: "W3", value: 210 },
  { label: "W4", value: 320 },
  { label: "W5", value: 410 },
  { label: "W6", value: 380 },
];

export const trendListings = [
  { label: "W1", value: 48 },
  { label: "W2", value: 65 },
  { label: "W3", value: 62 },
  { label: "W4", value: 80 },
  { label: "W5", value: 96 },
  { label: "W6", value: 90 },
];

export const barSources = [
  { label: "Organic", value: 420 },
  { label: "Ads", value: 260 },
  { label: "Referral", value: 180 },
  { label: "Social", value: 140 },
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
