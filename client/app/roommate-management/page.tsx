"use client";

import { useMemo, useState } from "react";
import UserPageShell from "@/app/homepage/components/UserPageShell";

type RoommateMode = "LANDLORD_ASSIST" | "TENANT_SELF";
type ApprovalStatus = "pending" | "approved" | "rejected";

type RoommateListing = {
  id: string;
  title: string;
  address: string;
  landlordName: string;
  currentOccupancy: number;
  maxOccupancy: number;
};

type RoommatePost = {
  id: string;
  listingId: string;
  title: string;
  requestedSlots: number;
  status: ApprovalStatus;
  mode: RoommateMode;
  createdAt: string;
};

const listings: RoommateListing[] = [
  {
    id: "R-1203",
    title: "Phòng trọ Bình Thạnh - Cổng sau VLU",
    address: "12/3 Nguyễn Gia Trí, P.25, Bình Thạnh",
    landlordName: "Nguyễn Thị Mai",
    currentOccupancy: 2,
    maxOccupancy: 3,
  },
  {
    id: "R-2041",
    title: "Căn hộ mini Q7 - gần trạm xe buýt",
    address: "88 Nguyễn Thị Thập, Q7",
    landlordName: "Lê Văn Hải",
    currentOccupancy: 3,
    maxOccupancy: 4,
  },
];

const roommatePostsSeed: RoommatePost[] = [
  {
    id: "RM-001",
    listingId: "R-1203",
    title: "Tìm bạn nữ ở ghép gần VLU",
    requestedSlots: 1,
    status: "approved",
    mode: "TENANT_SELF",
    createdAt: "2026-01-10",
  },
  {
    id: "RM-002",
    listingId: "R-2041",
    title: "Tìm 1 bạn ở ghép Q7",
    requestedSlots: 1,
    status: "pending",
    mode: "LANDLORD_ASSIST",
    createdAt: "2026-01-12",
  },
];

const statusBadge: Record<ApprovalStatus, { label: string; tone: string }> = {
  approved: { label: "Đã xác nhận", tone: "bg-green-100 text-green-800" },
  pending: { label: "Chờ xác nhận", tone: "bg-yellow-100 text-yellow-800" },
  rejected: { label: "Bị từ chối", tone: "bg-red-100 text-red-700" },
};

export default function RoommateManagementPage() {
  const [selectedId, setSelectedId] = useState(listings[0]?.id ?? "");
  const [mode, setMode] = useState<RoommateMode>("TENANT_SELF");
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>("pending");
  const [notifyLandlord, setNotifyLandlord] = useState(false);
  const [landlordConsent, setLandlordConsent] = useState(false);
  const [requestedSlots, setRequestedSlots] = useState("1");
  const [requestSent, setRequestSent] = useState(false);

  const selected = useMemo(
    () => listings.find((item) => item.id === selectedId) ?? listings[0],
    [selectedId]
  );

  const capacityLeft = Math.max(0, (selected?.maxOccupancy ?? 0) - (selected?.currentOccupancy ?? 0));
  const requestedCount = Number(requestedSlots || "0");
  const hasCapacity = capacityLeft > 0 && requestedCount > 0 && requestedCount <= capacityLeft;
  const canSubmit =
    selected &&
    hasCapacity &&
    (mode === "LANDLORD_ASSIST" || (notifyLandlord && landlordConsent && approvalStatus === "approved"));

  return (
    <UserPageShell
      title="Quản lý ở ghép"
      description="Liên kết bài đăng ở ghép với phòng trọ gốc và theo dõi xác nhận của chủ trọ."
      eyebrow="Ở ghép"
      actions={
        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white">
          Bài đăng cần xác nhận
        </span>
      }
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
          Hệ thống hỗ trợ người thuê tìm người ở ghép sau khi đã ký hợp đồng. Bài đăng phải liên kết với phòng trọ
          gốc, quản lý số người ở và chỉ hiển thị khi được chủ trọ xác nhận.
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Liên kết phòng trọ gốc</div>
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setRequestSent(false);
                }}
                className="mt-3 h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-800"
              >
                {listings.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              {selected && (
                <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-600">
                  <div className="font-semibold text-gray-800">{selected.title}</div>
                  <div className="mt-1">{selected.address}</div>
                  <div className="mt-1">Chủ trọ: {selected.landlordName}</div>
                  <div className="mt-2 text-gray-700">
                    Số người: {selected.currentOccupancy}/{selected.maxOccupancy} • Trống {capacityLeft}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Hình thức đăng</div>
              <div className="mt-3 grid gap-2">
                {[
                  { value: "LANDLORD_ASSIST", label: "Nhờ chủ trọ hỗ trợ đăng" },
                  { value: "TENANT_SELF", label: "Người thuê tự đăng (cần xác nhận)" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setMode(item.value as RoommateMode);
                      setRequestSent(false);
                    }}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                      mode === item.value
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Số người cần thêm</div>
              <input
                type="number"
                min={1}
                className="mt-3 h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-800"
                value={requestedSlots}
                onChange={(e) => {
                  setRequestedSlots(e.target.value);
                  setRequestSent(false);
                }}
              />
              {!hasCapacity && (
                <div className="mt-2 text-xs text-red-600">
                  Số người cần thêm vượt quá chỗ trống còn lại.
                </div>
              )}
            </div>

            {mode === "TENANT_SELF" ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold text-gray-900">Xác nhận chủ trọ</div>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900"
                      checked={notifyLandlord}
                      onChange={(e) => setNotifyLandlord(e.target.checked)}
                    />
                    <span>Đã thông báo cho chủ trọ về nhu cầu ở ghép.</span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900"
                      checked={landlordConsent}
                      onChange={(e) => setLandlordConsent(e.target.checked)}
                    />
                    <span>Đã nhận được sự đồng ý của chủ trọ.</span>
                  </label>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[approvalStatus].tone}`}>
                    {statusBadge[approvalStatus].label}
                  </span>
                  <button
                    type="button"
                    onClick={() => setApprovalStatus("approved")}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Giả lập xác nhận
                  </button>
                  <button
                    type="button"
                    onClick={() => setApprovalStatus("rejected")}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Giả lập từ chối
                  </button>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Bài đăng chỉ hiển thị công khai khi chủ trọ xác nhận.
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-sm text-gray-600">
                Chủ trọ sẽ chủ động đăng bài hoặc phản hồi về yêu cầu ở ghép của bạn.
              </div>
            )}

            <button
              type="button"
              onClick={() => setRequestSent(true)}
              disabled={!canSubmit}
              className={`w-full rounded-full px-5 py-3 text-sm font-semibold transition ${
                canSubmit ? "bg-[#D51F35] text-white hover:bg-[#b01628]" : "cursor-not-allowed bg-gray-200 text-gray-500"
              }`}
            >
              {mode === "LANDLORD_ASSIST" ? "Gửi yêu cầu cho chủ trọ" : "Tạo bài đăng ở ghép"}
            </button>
            {requestSent && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                {mode === "LANDLORD_ASSIST"
                  ? "Đã gửi yêu cầu đến chủ trọ."
                  : "Bài đăng đang chờ chủ trọ xác nhận."}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Bài đăng ở ghép liên kết</div>
              <div className="mt-4 space-y-3">
                {roommatePostsSeed.map((post) => {
                  const listing = listings.find((item) => item.id === post.listingId);
                  return (
                    <div key={post.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{post.title}</div>
                          <div className="text-xs text-gray-500">
                            Phòng gốc: {listing?.title ?? post.listingId}
                          </div>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge[post.status].tone}`}>
                          {statusBadge[post.status].label}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Yêu cầu {post.requestedSlots} người • {post.mode === "LANDLORD_ASSIST" ? "Chủ trọ hỗ trợ" : "Tự đăng"}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">Tạo ngày {post.createdAt}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-xs text-gray-600">
              Bài đăng ở ghép phải được chủ trọ xác nhận trước khi công khai. Hệ thống chỉ lưu thông tin để hỗ trợ
              quản lý và giảm rủi ro tranh chấp.
            </div>
          </div>
        </div>
      </div>
    </UserPageShell>
  );
}
