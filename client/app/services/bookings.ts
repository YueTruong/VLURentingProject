import { createAuthHeaders, getBackendUrl } from "@/app/lib/backend";

export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled";

export type Booking = {
  id: number;
  booking_date: string;
  time_slot: string;
  note: string | null;
  status: BookingStatus;
  createdAt: string;
};

export type StudentBooking = Booking & {
  landlord: {
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
    images?: Array<{ image_url: string }>;
  };
};

export type LandlordBooking = Booking & {
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

export type CreateBookingPayload = {
  postId: number;
  landlordId: number;
  bookingDate: string;
  timeSlot: string;
  note?: string;
};

const parseJson = async <T>(response: Response): Promise<T> =>
  (await response.json()) as T;

const throwIfNotOk = (response: Response, fallbackMessage: string) => {
  if (!response.ok) {
    throw new Error(fallbackMessage);
  }
};

export async function createBooking(
  token: string,
  payload: CreateBookingPayload,
) {
  const response = await fetch(`${getBackendUrl()}/bookings`, {
    method: "POST",
    headers: createAuthHeaders(token, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  throwIfNotOk(response, "Failed to create booking");
  return parseJson(response);
}

export async function getMyBookings(token: string): Promise<StudentBooking[]> {
  const response = await fetch(`${getBackendUrl()}/bookings/my-bookings`, {
    headers: createAuthHeaders(token),
  });

  throwIfNotOk(response, "Failed to fetch my bookings");
  const data = await parseJson<unknown>(response);
  return Array.isArray(data) ? (data as StudentBooking[]) : [];
}

export async function getLandlordBookings(
  token: string,
): Promise<LandlordBooking[]> {
  const response = await fetch(`${getBackendUrl()}/bookings/landlord-bookings`, {
    headers: createAuthHeaders(token),
  });

  throwIfNotOk(response, "Failed to fetch landlord bookings");
  const data = await parseJson<unknown>(response);
  return Array.isArray(data) ? (data as LandlordBooking[]) : [];
}

export async function updateBookingStatus(
  id: number,
  status: Exclude<BookingStatus, "cancelled">,
  token: string,
) {
  const response = await fetch(`${getBackendUrl()}/bookings/${id}/status`, {
    method: "PATCH",
    headers: createAuthHeaders(token, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ status }),
  });

  throwIfNotOk(response, "Failed to update booking status");
  return parseJson(response);
}

export async function cancelBooking(id: number, token: string) {
  const response = await fetch(`${getBackendUrl()}/bookings/${id}/cancel`, {
    method: "PATCH",
    headers: createAuthHeaders(token, {
      "Content-Type": "application/json",
    }),
  });

  throwIfNotOk(response, "Failed to cancel booking");
  return parseJson(response);
}
