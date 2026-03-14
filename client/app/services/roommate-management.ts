import api from './api';

export type RoommateMode = 'LANDLORD_ASSIST' | 'TENANT_SELF';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type RoommateListingOption = {
  id: number;
  title: string;
  address: string;
  landlordName: string | null;
  currentOccupancy: number;
  maxOccupancy: number;
};

export type RoommateRequest = {
  id: number;
  title: string;
  listingPostId: number;
  studentId: number;
  landlordId: number | null;
  mode: RoommateMode;
  approvalStatus: ApprovalStatus;
  requestedSlots: number;
  notifyLandlord: boolean;
  landlordConsent: boolean;
  listingTitle: string;
  listingAddress: string;
  landlordName: string | null;
  currentOccupancy: number;
  maxOccupancy: number;
  publicPostId: number | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: number;
    email?: string | null;
    username?: string | null;
    profile?: {
      full_name?: string | null;
    };
  };
  landlord?: {
    id: number;
    email?: string | null;
    username?: string | null;
    profile?: {
      full_name?: string | null;
    };
  };
};

export type CreateRoommateRequestPayload = {
  listingPostId: number;
  requestedSlots: number;
  mode: RoommateMode;
  currentOccupancy: number;
  maxOccupancy: number;
  notifyLandlord?: boolean;
  landlordConsent?: boolean;
};

export type UpdateRoommateTrackingPayload = {
  notifyLandlord?: boolean;
  landlordConsent?: boolean;
};

export type ReviewRoommateRequestPayload = {
  approvalStatus: ApprovalStatus;
};

export async function getRoommateListingOptions(): Promise<
  RoommateListingOption[]
> {
  const res = await api.get<RoommateListingOption[]>(
    '/roommate-management/listing-options',
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function getMyRoommateRequests(): Promise<RoommateRequest[]> {
  const res = await api.get<RoommateRequest[]>('/roommate-management/me');
  return Array.isArray(res.data) ? res.data : [];
}

export async function createRoommateRequest(
  payload: CreateRoommateRequestPayload,
): Promise<RoommateRequest> {
  const res = await api.post<RoommateRequest>('/roommate-management', payload);
  return res.data;
}

export async function updateRoommateTracking(
  id: number,
  payload: UpdateRoommateTrackingPayload,
): Promise<RoommateRequest> {
  const res = await api.patch<RoommateRequest>(
    `/roommate-management/${id}/tracking`,
    payload,
  );
  return res.data;
}

export async function getAdminRoommateRequests(
  status?: ApprovalStatus | "all",
): Promise<RoommateRequest[]> {
  const res = await api.get<RoommateRequest[]>('/roommate-management/admin', {
    params: status && status !== "all" ? { status } : undefined,
  });
  return Array.isArray(res.data) ? res.data : [];
}

export async function reviewRoommateRequest(
  id: number,
  payload: ReviewRoommateRequestPayload,
): Promise<RoommateRequest> {
  const res = await api.patch<RoommateRequest>(
    `/roommate-management/admin/${id}/review`,
    payload,
  );
  return res.data;
}

export async function deleteRoommateRequest(id: number) {
  const res = await api.delete(`/roommate-management/${id}`);
  return res.data;
}
