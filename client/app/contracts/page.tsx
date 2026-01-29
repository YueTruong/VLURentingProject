"use client";

import { useMemo, useState } from "react";
import UserPageShell from "@/app/homepage/components/UserPageShell";

type ContractStatus = "active" | "ending" | "expired";
type DepositStatus = "held" | "refunded" | "forfeited";

type ContractRecord = {
  id: string;
  listingTitle: string;
  listingAddress: string;
  landlordName: string;
  tenantName: string;
  rent: number;
  deposit: number;
  serviceFees: string;
  startDate: string;
  endDate: string;
  renewalTerms: string;
  terminationTerms: string;
  status: ContractStatus;
  depositStatus: DepositStatus;
  reminderDays: number[];
};

const contractsSeed: ContractRecord[] = [
  {
    id: "CT-2025-0821",
    listingTitle: "Phòng trọ Bình Thạnh - Cổng sau VLU",
    listingAddress: "12/3 Nguyễn Gia Trí, P.25, Bình Thạnh",
    landlordName: "Nguyễn Thị Mai",
    tenantName: "Trần Minh Anh",
    rent: 4500000,
    deposit: 4500000,
    serviceFees: "Điện 3.500đ/kWh, nước 80.000đ/người, wifi 100.000đ/phòng",
    startDate: "2025-05-10",
    endDate: "2026-05-10",
    renewalTerms: "Thông báo gia hạn trước 30 ngày, giữ nguyên giá trong 12 tháng.",
    terminationTerms: "Báo trước 30 ngày, thanh toán đủ chi phí còn lại.",
    status: "active",
    depositStatus: "held",
    reminderDays: [30, 15],
  },
  {
    id: "CT-2025-0915",
    listingTitle: "Căn hộ mini Q7 - gần trạm xe buýt",
    listingAddress: "88 Nguyễn Thị Thập, Q7",
    landlordName: "Lê Văn Hải",
    tenantName: "Nguyễn Gia Hân",
    rent: 5200000,
    deposit: 5200000,
    serviceFees: "Điện 4.000đ/kWh, nước 90.000đ/người, wifi 120.000đ/phòng",
    startDate: "2025-09-15",
    endDate: "2026-03-15",
    renewalTerms: "Thông báo gia hạn trước 15 ngày, có thể điều chỉnh giá theo thỏa thuận.",
    terminationTerms: "Báo trước 20 ngày, hoàn trả phòng đúng hiện trạng.",
    status: "ending",
    depositStatus: "held",
    reminderDays: [15],
  },
  {
    id: "CT-2024-1102",
    listingTitle: "Phòng trọ Gò Vấp - yên tĩnh",
    listingAddress: "15/7 Phan Huy Ích, Gò Vấp",
    landlordName: "Trần Minh Khôi",
    tenantName: "Vũ Thanh Phương",
    rent: 3800000,
    deposit: 3800000,
    serviceFees: "Điện 3.200đ/kWh, nước 70.000đ/người, wifi 80.000đ/phòng",
    startDate: "2024-11-02",
    endDate: "2025-11-02",
    renewalTerms: "Thông báo gia hạn trước 30 ngày.",
    terminationTerms: "Báo trước 30 ngày, thanh toán đủ chi phí.",
    status: "expired",
    depositStatus: "refunded",
    reminderDays: [30],
  },
];

const statusBadge: Record<ContractStatus, { label: string; tone: string }> = {
  active: { label: "Đang hiệu lực", tone: "bg-green-100 text-green-800" },
  ending: { label: "Sắp hết hạn", tone: "bg-yellow-100 text-yellow-800" },
  expired: { label: "Đã hết hạn", tone: "bg-gray-100 text-gray-700" },
};

const depositBadge: Record<DepositStatus, { label: string; tone: string }> = {
  held: { label: "Đang giữ", tone: "bg-blue-100 text-blue-700" },
  refunded: { label: "Đã hoàn cọc", tone: "bg-green-100 text-green-800" },
  forfeited: { label: "Mất cọc", tone: "bg-red-100 text-red-700" },
};

function formatVnd(amount: number) {
  return amount.toLocaleString("vi-VN") + "đ";
}

function daysUntil(dateString: string) {
  const now = new Date();
  const target = new Date(dateString);
  const diff = Math.ceil((target.getTime() - now.getTime()) / 86400000);
  return diff;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState(contractsSeed);
  const [selectedId, setSelectedId] = useState(contractsSeed[0]?.id ?? "");
  const [reminders, setReminders] = useState<Record<string, { d15: boolean; d30: boolean }>>({
    "CT-2025-0821": { d15: true, d30: true },
    "CT-2025-0915": { d15: true, d30: false },
    "CT-2024-1102": { d15: false, d30: true },
  });

  const selected = useMemo(
    () => contracts.find((item) => item.id === selectedId) ?? contracts[0],
    [contracts, selectedId]
  );

  const stats = useMemo(() => {
    const active = contracts.filter((c) => c.status === "active").length;
    const ending = contracts.filter((c) => c.status === "ending").length;
    const holding = contracts.filter((c) => c.depositStatus === "held").length;
    const totalDeposit = contracts.reduce((sum, c) => sum + (c.depositStatus === "held" ? c.deposit : 0), 0);
    return { active, ending, holding, totalDeposit };
  }, [contracts]);

  const updateDepositStatus = (status: DepositStatus) => {
    if (!selected) return;
    setContracts((prev) =>
      prev.map((item) => (item.id === selected.id ? { ...item, depositStatus: status } : item))
    );
  };

  return (
    <UserPageShell
      title="Quản lý hợp đồng thuê"
      description="Theo dõi hợp đồng, tiền cọc và nhắc nhở gia hạn theo mẫu thuê trọ phổ biến tại Việt Nam."
      eyebrow="Hợp đồng"
      actions={
        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white">
          Nền tảng trung gian
        </span>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Hợp đồng hiệu lực", value: stats.active },
            { label: "Sắp hết hạn", value: stats.ending },
            { label: "Tiền cọc đang giữ", value: stats.holding },
            { label: "Tổng cọc đang giữ", value: formatVnd(stats.totalDeposit) },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">{item.label}</div>
              <div className="mt-2 text-xl font-bold text-gray-900">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-3">
            {contracts.map((contract) => {
              const daysLeft = daysUntil(contract.endDate);
              const badge = statusBadge[contract.status];
              return (
                <button
                  key={contract.id}
                  type="button"
                  onClick={() => setSelectedId(contract.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    contract.id === selectedId
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">
                        {contract.listingTitle}
                      </div>
                      <div className={`mt-1 text-xs ${contract.id === selectedId ? "text-white/70" : "text-gray-500"}`}>
                        {contract.listingAddress}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        contract.id === selectedId ? "bg-white/15 text-white" : badge.tone
                      }`}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <div className={`mt-3 text-xs ${contract.id === selectedId ? "text-white/70" : "text-gray-500"}`}>
                    Mã hợp đồng: {contract.id}
                  </div>
                  <div className={`mt-2 text-xs ${contract.id === selectedId ? "text-white/70" : "text-gray-500"}`}>
                    Còn {daysLeft > 0 ? `${daysLeft} ngày` : "0 ngày"} • Tiền cọc {formatVnd(contract.deposit)}
                  </div>
                </button>
              );
            })}
          </div>

          {selected ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{selected.listingTitle}</div>
                    <div className="text-sm text-gray-500">{selected.listingAddress}</div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[selected.status].tone}`}>
                    {statusBadge[selected.status].label}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm text-gray-700">
                  <div>
                    <div className="text-xs text-gray-500">Chủ trọ</div>
                    <div className="font-semibold text-gray-900">{selected.landlordName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Người thuê</div>
                    <div className="font-semibold text-gray-900">{selected.tenantName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Giá thuê</div>
                    <div className="font-semibold text-gray-900">{formatVnd(selected.rent)} / tháng</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Tiền cọc</div>
                    <div className="font-semibold text-gray-900">{formatVnd(selected.deposit)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Thời hạn</div>
                    <div className="font-semibold text-gray-900">
                      {selected.startDate} → {selected.endDate}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Chi phí dịch vụ</div>
                    <div className="font-semibold text-gray-900">{selected.serviceFees}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold text-gray-900">Điều khoản gia hạn & chấm dứt</div>
                <p className="mt-2 text-sm text-gray-700">{selected.renewalTerms}</p>
                <p className="mt-2 text-sm text-gray-700">{selected.terminationTerms}</p>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-gray-900">Quản lý tiền cọc</div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${depositBadge[selected.depositStatus].tone}`}>
                    {depositBadge[selected.depositStatus].label}
                  </span>
                </div>
                <div className="mt-3 text-sm text-gray-700">
                  Điều kiện hoàn cọc: bàn giao phòng đúng hiện trạng, thanh toán đủ chi phí, không vi phạm nội quy.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateDepositStatus("refunded")}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Đã hoàn cọc
                  </button>
                  <button
                    type="button"
                    onClick={() => updateDepositStatus("forfeited")}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Mất cọc
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="text-sm font-semibold text-gray-900">Nhắc nhở gia hạn</div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      checked={reminders[selected.id]?.d30 ?? false}
                      onChange={(e) =>
                        setReminders((prev) => ({
                          ...prev,
                          [selected.id]: { ...(prev[selected.id] || {}), d30: e.target.checked },
                        }))
                      }
                    />
                    Nhắc trước 30 ngày
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                      checked={reminders[selected.id]?.d15 ?? false}
                      onChange={(e) =>
                        setReminders((prev) => ({
                          ...prev,
                          [selected.id]: { ...(prev[selected.id] || {}), d15: e.target.checked },
                        }))
                      }
                    />
                    Nhắc trước 15 ngày
                  </label>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Thông báo sẽ được gửi cho cả chủ trọ và người thuê theo lịch nhắc nhở đã chọn.
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-xs text-gray-600">
                Hợp đồng do chủ trọ soạn thảo và ký trực tiếp với người thuê. VLU Renting chỉ lưu trữ thông tin
                để tham chiếu và quản lý, không thay thế việc ký kết pháp lý.
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </UserPageShell>
  );
}
