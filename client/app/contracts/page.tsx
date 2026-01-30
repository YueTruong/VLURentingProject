"use client";

import { useMemo, useState } from "react";
import UserPageShell from "@/app/homepage/components/UserPageShell";

type ContractStatus = "active" | "ending" | "expired";
type DepositStatus = "held" | "refunded" | "forfeited";
type UserRole = "admin" | "landlord" | "student";
type WorkflowStatus =
  | "draft"
  | "sent_to_student"
  | "student_signed"
  | "landlord_verified"
  | "admin_approved"
  | "revision_requested"
  | "rejected";

type SignatureInfo = {
  name?: string;
  dataUrl?: string;
  uploadedAt?: string;
};

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
  workflowStatus: WorkflowStatus;
  createdBy: UserRole;
  signatures: {
    landlord?: SignatureInfo;
    tenant?: SignatureInfo;
  };
  workflowNote?: string;
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
    workflowStatus: "sent_to_student",
    createdBy: "landlord",
    signatures: {
      landlord: { name: "Nguyễn Thị Mai" },
    },
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
    workflowStatus: "student_signed",
    createdBy: "landlord",
    signatures: {
      landlord: { name: "Lê Văn Hải" },
      tenant: { name: "Nguyễn Gia Hân" },
    },
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
    workflowStatus: "admin_approved",
    createdBy: "admin",
    signatures: {
      landlord: { name: "Trần Minh Khôi" },
      tenant: { name: "Vũ Thanh Phương" },
    },
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

const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  landlord: "Chủ trọ",
  student: "Sinh viên",
};

const workflowBadge: Record<WorkflowStatus, { label: string; tone: string }> = {
  draft: { label: "Bản nháp", tone: "bg-gray-100 text-gray-700" },
  sent_to_student: { label: "Đã gửi sinh viên", tone: "bg-blue-100 text-blue-700" },
  student_signed: { label: "Sinh viên đã ký", tone: "bg-indigo-100 text-indigo-700" },
  landlord_verified: { label: "Chủ trọ đã xác nhận", tone: "bg-emerald-100 text-emerald-700" },
  admin_approved: { label: "Đã duyệt", tone: "bg-green-100 text-green-800" },
  revision_requested: { label: "Yêu cầu chỉnh sửa", tone: "bg-amber-100 text-amber-700" },
  rejected: { label: "Bị từ chối", tone: "bg-rose-100 text-rose-700" },
};

const workflowSteps: { key: WorkflowStatus; label: string }[] = [
  { key: "draft", label: "Tạo hợp đồng" },
  { key: "sent_to_student", label: "Gửi sinh viên" },
  { key: "student_signed", label: "Sinh viên ký" },
  { key: "landlord_verified", label: "Chủ trọ xác nhận" },
  { key: "admin_approved", label: "Admin duyệt" },
];

const workflowStepIndex: Record<WorkflowStatus, number> = {
  draft: 0,
  sent_to_student: 1,
  student_signed: 2,
  landlord_verified: 3,
  admin_approved: 4,
  revision_requested: 0,
  rejected: 3,
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

function SignatureUpload({
  label,
  value,
  helper,
  onChange,
}: {
  label: string;
  value?: string;
  helper?: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="text-xs font-semibold text-gray-700">{label}</div>
      {helper ? <div className="mt-1 text-[11px] text-gray-500">{helper}</div> : null}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="h-16 w-40 overflow-hidden rounded-lg border border-dashed border-gray-300 bg-white">
          {value ? (
            <img src={value} alt="Signature preview" className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] text-gray-400">
              Chưa có chữ ký
            </div>
          )}
        </div>
        <label className="inline-flex cursor-pointer items-center rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
          Tải chữ ký số
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                const result = typeof reader.result === "string" ? reader.result : "";
                if (result) onChange(result);
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>
      </div>
    </div>
  );
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState(contractsSeed);
  const [selectedId, setSelectedId] = useState(contractsSeed[0]?.id ?? "");
  const [reminders, setReminders] = useState<Record<string, { d15: boolean; d30: boolean }>>({
    "CT-2025-0821": { d15: true, d30: true },
    "CT-2025-0915": { d15: true, d30: false },
    "CT-2024-1102": { d15: false, d30: true },
  });
  const [roleView, setRoleView] = useState<UserRole>("landlord");
  const [notes, setNotes] = useState<Record<string, string>>({});

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

  const updateContract = (id: string, updater: (current: ContractRecord) => ContractRecord) => {
    setContracts((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  };

  const updateSelected = (updater: (current: ContractRecord) => ContractRecord) => {
    if (!selected) return;
    updateContract(selected.id, updater);
  };

  const setSignature = (party: "landlord" | "tenant", dataUrl: string) => {
    updateSelected((current) => ({
      ...current,
      signatures: {
        ...current.signatures,
        [party]: {
          ...(current.signatures[party] ?? {}),
          dataUrl,
          uploadedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const createContract = () => {
    if (roleView === "student") return;
    const year = new Date().getFullYear();
    const newId = `CT-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newContract: ContractRecord = {
      id: newId,
      listingTitle: "Hợp đồng mới",
      listingAddress: "Chưa cập nhật địa chỉ",
      landlordName: roleView === "admin" ? "Admin tạo thay" : "Chủ trọ mới",
      tenantName: "Sinh viên mới",
      rent: 4000000,
      deposit: 4000000,
      serviceFees: "Điện/nước theo thỏa thuận",
      startDate: "2026-02-01",
      endDate: "2027-02-01",
      renewalTerms: "Thông báo gia hạn trước 30 ngày.",
      terminationTerms: "Báo trước 30 ngày, thanh toán đủ chi phí.",
      status: "active",
      depositStatus: "held",
      reminderDays: [30, 15],
      workflowStatus: "draft",
      createdBy: roleView,
      signatures: {},
    };
    setContracts((prev) => [newContract, ...prev]);
    setSelectedId(newId);
  };

  const updateDepositStatus = (status: DepositStatus) => {
    if (!selected) return;
    setContracts((prev) =>
      prev.map((item) => (item.id === selected.id ? { ...item, depositStatus: status } : item))
    );
  };

  const handleDeleteContract = (id: string) => {
    if (roleView === "student") return;
    const shouldDelete = window.confirm(`Xoá hợp đồng ${id}?`);
    if (!shouldDelete) return;
    setContracts((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? "");
      }
      return next;
    });
    setReminders((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setNotes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSendToStudent = () => {
    if (!selected) return;
    updateSelected((current) => ({
      ...current,
      workflowStatus: "sent_to_student",
      workflowNote: undefined,
      signatures: { ...current.signatures, tenant: undefined },
    }));
  };

  const handleStudentSign = () => {
    if (!selected) return;
    updateSelected((current) => ({
      ...current,
      workflowStatus: "student_signed",
      workflowNote: undefined,
    }));
  };

  const handleLandlordVerify = () => {
    if (!selected) return;
    updateSelected((current) => ({
      ...current,
      workflowStatus: "landlord_verified",
      workflowNote: undefined,
    }));
  };

  const handleAdminApprove = () => {
    if (!selected) return;
    updateSelected((current) => ({
      ...current,
      workflowStatus: "admin_approved",
      workflowNote: undefined,
    }));
  };

  const handleRequestRevision = () => {
    if (!selected) return;
    const note = (notes[selected.id] ?? "").trim();
    updateSelected((current) => ({
      ...current,
      workflowStatus: "revision_requested",
      workflowNote: note || "Yêu cầu chỉnh sửa hợp đồng.",
      signatures: { ...current.signatures, tenant: undefined },
    }));
  };

  const handleReject = () => {
    if (!selected) return;
    const note = (notes[selected.id] ?? "").trim();
    updateSelected((current) => ({
      ...current,
      workflowStatus: "rejected",
      workflowNote: note || "Hợp đồng bị từ chối.",
    }));
  };

  const handleBackToDraft = () => {
    if (!selected) return;
    updateSelected((current) => ({
      ...current,
      workflowStatus: "draft",
      workflowNote: undefined,
      signatures: { ...current.signatures, tenant: undefined },
    }));
  };

  const noteValue = selected ? notes[selected.id] ?? "" : "";
  const workflowIndex = selected ? workflowStepIndex[selected.workflowStatus] : 0;
  const hasLandlordSignature = Boolean(selected?.signatures.landlord?.dataUrl);
  const hasTenantSignature = Boolean(selected?.signatures.tenant?.dataUrl);

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
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">Chế độ thao tác</div>
              <div className="text-xs text-gray-500">
                Demo quy trình tạo - ký - duyệt hợp đồng theo nhiều vai trò.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1 text-xs font-semibold text-gray-600">
                {(["landlord", "student", "admin"] as UserRole[]).map((role) => {
                  const active = roleView === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRoleView(role)}
                      className={`rounded-full px-3 py-1.5 transition ${
                        active ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-white"
                      }`}
                    >
                      {roleLabels[role]}
                    </button>
                  );
                })}
              </div>
              {roleView !== "student" ? (
                <button
                  type="button"
                  onClick={createContract}
                  className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800"
                >
                  + Tạo hợp đồng
                </button>
              ) : null}
            </div>
          </div>
        </div>

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
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[selected.status].tone}`}
                    >
                      {statusBadge[selected.status].label}
                    </span>
                    {roleView !== "student" ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteContract(selected.id)}
                        className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                      >
                        Xoá hợp đồng
                      </button>
                    ) : null}
                  </div>
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
                    <div className="text-xs text-gray-500">Người tạo</div>
                    <div className="font-semibold text-gray-900">{roleLabels[selected.createdBy]}</div>
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
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Quy trình ký & duyệt</div>
                    <div className="text-xs text-gray-500">Vai trò hiện tại: {roleLabels[roleView]}</div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${workflowBadge[selected.workflowStatus].tone}`}>
                    {workflowBadge[selected.workflowStatus].label}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-5">
                  {workflowSteps.map((step, index) => {
                    const completed = workflowIndex >= workflowStepIndex[step.key];
                    return (
                      <div
                        key={step.key}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                          completed
                            ? "border-gray-900 bg-gray-900 text-white"
                            : "border-gray-200 bg-white text-gray-500"
                        }`}
                      >
                        <div className="text-[10px] uppercase opacity-70">Bước {index + 1}</div>
                        <div>{step.label}</div>
                      </div>
                    );
                  })}
                </div>

                {selected.workflowStatus === "revision_requested" || selected.workflowStatus === "rejected" ? (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    <span className="font-semibold">Ghi chú:</span> {selected.workflowNote || "Chưa có ghi chú."}
                  </div>
                ) : null}

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    {(roleView === "landlord" || roleView === "admin") &&
                    (selected.workflowStatus === "draft" ||
                      selected.workflowStatus === "revision_requested" ||
                      selected.workflowStatus === "student_signed") ? (
                      <SignatureUpload
                        label="Chữ ký số bên cho thuê"
                        value={selected.signatures.landlord?.dataUrl}
                        helper="Upload chữ ký số (PNG/JPG)."
                        onChange={(dataUrl) => setSignature("landlord", dataUrl)}
                      />
                    ) : null}

                    {roleView === "student" && selected.workflowStatus === "sent_to_student" ? (
                      <SignatureUpload
                        label="Chữ ký số sinh viên"
                        value={selected.signatures.tenant?.dataUrl}
                        helper="Sinh viên ký bằng chữ ký số."
                        onChange={(dataUrl) => setSignature("tenant", dataUrl)}
                      />
                    ) : null}

                    <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
                      <div className="font-semibold text-gray-700">Tình trạng chữ ký</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-2 py-1 ${
                            hasLandlordSignature
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          Chủ trọ: {hasLandlordSignature ? "Đã tải" : "Chưa có"}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 ${
                            hasTenantSignature
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          Sinh viên: {hasTenantSignature ? "Đã tải" : "Chưa có"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(roleView === "landlord" && selected.workflowStatus === "student_signed") ||
                    (roleView === "admin" && selected.workflowStatus === "landlord_verified") ? (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                        <div className="text-xs font-semibold text-gray-700">Ghi chú xử lý</div>
                        <textarea
                          rows={3}
                          value={noteValue}
                          onChange={(event) =>
                            setNotes((prev) => ({ ...prev, [selected.id]: event.target.value }))
                          }
                          placeholder="Nhập ghi chú hoặc lý do..."
                          className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none focus:border-gray-300"
                        />
                      </div>
                    ) : null}

                    {roleView !== "student" &&
                    (selected.workflowStatus === "draft" || selected.workflowStatus === "revision_requested") ? (
                      <button
                        type="button"
                        onClick={handleSendToStudent}
                        disabled={!hasLandlordSignature}
                        className={`w-full rounded-xl px-4 py-2 text-xs font-semibold text-white transition ${
                          hasLandlordSignature ? "bg-gray-900 hover:bg-gray-800" : "bg-gray-300 cursor-not-allowed"
                        }`}
                      >
                        Gửi hợp đồng cho sinh viên
                      </button>
                    ) : null}

                    {roleView === "student" && selected.workflowStatus === "sent_to_student" ? (
                      <button
                        type="button"
                        onClick={handleStudentSign}
                        disabled={!hasTenantSignature}
                        className={`w-full rounded-xl px-4 py-2 text-xs font-semibold text-white transition ${
                          hasTenantSignature ? "bg-[#D51F35] hover:bg-[#b01628]" : "bg-gray-300 cursor-not-allowed"
                        }`}
                      >
                        Ký & gửi lại cho chủ trọ
                      </button>
                    ) : null}

                    {roleView === "landlord" && selected.workflowStatus === "student_signed" ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={handleLandlordVerify}
                          disabled={!hasLandlordSignature}
                          className={`w-full rounded-xl px-4 py-2 text-xs font-semibold text-white transition ${
                            hasLandlordSignature
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-gray-300 cursor-not-allowed"
                          }`}
                        >
                          Xác nhận & gửi admin duyệt
                        </button>
                        <button
                          type="button"
                          onClick={handleRequestRevision}
                          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          Yêu cầu chỉnh sửa
                        </button>
                      </div>
                    ) : null}

                    {roleView === "admin" && selected.workflowStatus === "landlord_verified" ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={handleAdminApprove}
                          disabled={!(hasLandlordSignature && hasTenantSignature)}
                          className={`w-full rounded-xl px-4 py-2 text-xs font-semibold text-white transition ${
                            hasLandlordSignature && hasTenantSignature
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-gray-300 cursor-not-allowed"
                          }`}
                        >
                          Duyệt hợp đồng
                        </button>
                        <button
                          type="button"
                          onClick={handleReject}
                          className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          Từ chối
                        </button>
                      </div>
                    ) : null}

                    {roleView !== "student" && selected.workflowStatus === "revision_requested" ? (
                      <button
                        type="button"
                        onClick={handleBackToDraft}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Chỉnh sửa & gửi lại
                      </button>
                    ) : null}

                    {roleView === "admin" && selected.workflowStatus === "rejected" ? (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        Hợp đồng bị từ chối. Có thể chỉnh sửa và gửi lại khi cần.
                      </div>
                    ) : null}

                    {roleView === "student" &&
                    (selected.workflowStatus === "draft" ||
                      selected.workflowStatus === "student_signed" ||
                      selected.workflowStatus === "landlord_verified") ? (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                        Hợp đồng đang ở trạng thái {workflowBadge[selected.workflowStatus].label.toLowerCase()}.
                      </div>
                    ) : null}
                  </div>
                </div>
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
