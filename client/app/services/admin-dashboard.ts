"use client";

import axios from "axios";
import { createAuthHeaders, getBackendUrl } from "@/app/lib/backend";

export type DashboardTrendRange = "7d" | "30d";

export type DashboardTrendPoint = {
  label: string;
  value: number;
};

export type DashboardKpiCard = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  delta?: { value: string; trend: "up" | "down" };
};

export type DashboardActivityLog = {
  id: string;
  time: string;
  user: string;
  action: string;
  status: "success" | "failed";
  channel: "web" | "api";
  details?: string;
};

export type DashboardUserStatus = "ACTIVE" | "BLOCKED" | "PENDING";

export type DashboardUserRow = {
  id: string;
  username: string;
  email: string;
  role: string;
  status: DashboardUserStatus;
  verified: boolean;
  createdAt: string;
};

export type DashboardListingStatus =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "HIDDEN"
  | "RENTED";

export type DashboardListingRow = {
  id: string;
  title: string;
  owner: string;
  city: string;
  price: number;
  status: DashboardListingStatus;
  createdAt: string;
};

export type DashboardBarPoint = {
  label: string;
  value: number;
};

export type AdminDashboardOverview = {
  generatedAt: string;
  kpiCards: DashboardKpiCard[];
  trendSeries: {
    users: Record<DashboardTrendRange, DashboardTrendPoint[]>;
    listings: Record<DashboardTrendRange, DashboardTrendPoint[]>;
  };
  activities: DashboardActivityLog[];
  users: DashboardUserRow[];
  listings: DashboardListingRow[];
  userRoleBreakdown: DashboardBarPoint[];
  listingStatusBreakdown: DashboardBarPoint[];
};

export async function getAdminDashboardOverview(
  token: string,
): Promise<AdminDashboardOverview> {
  const response = await axios.get<AdminDashboardOverview>(
    `${getBackendUrl()}/admin/dashboard/overview`,
    {
      headers: createAuthHeaders(token),
    },
  );

  return response.data;
}
