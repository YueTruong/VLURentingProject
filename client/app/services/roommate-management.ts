"use client";

import api from "./api";

export type RoommateMode = "LANDLORD_ASSIST" | "TENANT_SELF";
export type ApprovalStatus = "pending" | "approved" | "rejected";

export type RoommateListing = {
  id: number;
  title: string;
  address: string;
  landlordName: string;
  currentOccupancy: number;
  maxOccupancy: number;
};

export type RoommatePost = {
  id: string;
  listingId: number;
  title: string;
  requestedSlots: number;
  status: ApprovalStatus;
  mode: RoommateMode;
  createdAt: string;
};

export type CreateRoommateRequestPayload = {
  listingId: number;
  title: string;
  requestedSlots: number;
  mode: RoommateMode;
};

export async function getRoommateListings() {
  const res = await api.get<RoommateListing[]>('/roommate-management/listings');
  return Array.isArray(res.data) ? res.data : [];
}

export async function getRoommatePosts(listingId?: number) {
  const res = await api.get<RoommatePost[]>('/roommate-management/posts', {
    params: listingId ? { listingId } : undefined,
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function createRoommateRequest(payload: CreateRoommateRequestPayload) {
  const res = await api.post<RoommatePost>('/roommate-management/requests', payload);
  return res.data;
}