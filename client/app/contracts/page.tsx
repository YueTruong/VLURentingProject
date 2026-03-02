"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import UserPageShell from "@/app/homepage/components/UserPageShell";

type ContractStatus = "active" | "ending" | "expired";
type DepositStatus = "held" | "refunded" | "forfeited";
type UserRole = "admin" | "landlord" | "student";
type StableWorkflowStatus =
  | "draft"
  | "sent_to_student"
  | "student_signed"
  | "landlord_verified"
  | "admin_approved";
type WorkflowStatus = StableWorkflowStatus | "revision_requested" | "rejected";
type SignatureParty = "landlord" | "tenant";
type ContractActionKey =
  | "create"
  | "delete"
  | "update_deposit"
  | "send_to_student"
  | "student_sign"
  | "landlord_verify"
  | "approve"
  | "reject"
  | "request_revision"
  | "edit_resend";
type FilterStatus = "all" | ContractStatus;
type WorkflowFilter = "all" | WorkflowStatus;
type SortKey = "ending_soon" | "newest";
type ToastTone = "success" | "info" | "danger";

type SignatureInfo = {
  name?: string;
  dataUrl?: string;
  uploadedAt?: string;
};

type ReminderSelection = {
  d15: boolean;
  d30: boolean;
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
  workflowStatus: WorkflowStatus;
  createdBy: UserRole;
  signatures: {
    landlord?: SignatureInfo;
    tenant?: SignatureInfo;
  };
  workflowNote?: string;
  workflowAnchorStatus?: StableWorkflowStatus;
  createdAt?: string;
};

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ConfirmState =
  | { kind: "delete"; contractId: string }
  | { kind: "remove_signature"; contractId: string; party: SignatureParty }
  | {
      kind: "deposit";
      contractId: string;
      nextStatus: Exclude<DepositStatus, "held">;
      reason: string;
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

const workflowSteps: { key: StableWorkflowStatus; label: string }[] = [
  { key: "draft", label: "Tạo hợp đồng" },
  { key: "sent_to_student", label: "Gửi sinh viên" },
  { key: "student_signed", label: "Sinh viên ký" },
  { key: "landlord_verified", label: "Chủ trọ xác nhận" },
  { key: "admin_approved", label: "Admin duyệt" },
];

const workflowStepIndex: Record<StableWorkflowStatus, number> = {
  draft: 0,
  sent_to_student: 1,
  student_signed: 2,
  landlord_verified: 3,
  admin_approved: 4,
};

const workflowFallbackStatus: Record<"revision_requested" | "rejected", StableWorkflowStatus> = {
  revision_requested: "student_signed",
  rejected: "landlord_verified",
};

const statusFilterOptions: { key: FilterStatus; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Hiệu lực" },
  { key: "ending", label: "Sắp hết hạn" },
  { key: "expired", label: "Hết hạn" },
];

const workflowFilterOptions: { key: WorkflowFilter; label: string }[] = [
  { key: "all", label: "Tất cả workflow" },
  { key: "draft", label: workflowBadge.draft.label },
  { key: "sent_to_student", label: workflowBadge.sent_to_student.label },
  { key: "student_signed", label: workflowBadge.student_signed.label },
  { key: "landlord_verified", label: workflowBadge.landlord_verified.label },
  { key: "admin_approved", label: workflowBadge.admin_approved.label },
  { key: "revision_requested", label: workflowBadge.revision_requested.label },
  { key: "rejected", label: workflowBadge.rejected.label },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function parseDateValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : parseDateValue(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateTime(value?: string) {
  if (!value) return null;
  const date = parseDateValue(value);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(date)} ${hours}:${minutes}`;
}

function formatVnd(amount: number) {
  return `${amount.toLocaleString("vi-VN")}đ`;
}

function daysUntil(dateString: string) {
  const target = parseDateValue(dateString);
  const diff = target.getTime() - startOfToday().getTime();
  return Math.ceil(diff / 86400000);
}

function deriveContractStatus(endDate: string): ContractStatus {
  const daysLeft = daysUntil(endDate);

  if (daysLeft <= 0) return "expired";
  if (daysLeft <= 30) return "ending";
  return "active";
}

function getReminderDates(endDate: string, reminder?: ReminderSelection) {
  const end = parseDateValue(endDate);
  const reminderDates: Array<{ dateText: string; timestamp: number }> = [];

  if (reminder?.d30) {
    const date = new Date(end);
    date.setDate(date.getDate() - 30);
    reminderDates.push({ dateText: formatDate(date), timestamp: date.getTime() });
  }

  if (reminder?.d15) {
    const date = new Date(end);
    date.setDate(date.getDate() - 15);
    reminderDates.push({ dateText: formatDate(date), timestamp: date.getTime() });
  }

  return reminderDates
    .sort((left, right) => left.timestamp - right.timestamp)
    .map((item) => item.dateText);
}

function isStableWorkflowStatus(status: WorkflowStatus): status is StableWorkflowStatus {
  return status !== "revision_requested" && status !== "rejected";
}

function getWorkflowAnchorStatus(contract: ContractRecord): StableWorkflowStatus {
  if (isStableWorkflowStatus(contract.workflowStatus)) {
    return contract.workflowStatus;
  }

  return contract.workflowAnchorStatus ?? workflowFallbackStatus[contract.workflowStatus];
}

function getWorkflowIndex(contract: ContractRecord) {
  return workflowStepIndex[getWorkflowAnchorStatus(contract)];
}

function getContractStatus(contract: ContractRecord) {
  return deriveContractStatus(contract.endDate);
}

function getDaysLeftLabel(endDate: string) {
  const daysLeft = daysUntil(endDate);
  return daysLeft <= 0 ? "Đã hết hạn" : `Còn ${daysLeft} ngày`;
}

function can(actionKey: ContractActionKey, roleView: UserRole, selected?: ContractRecord) {
  if (actionKey === "create") {
    return roleView !== "student";
  }

  if (!selected) return false;

  const hasLandlordSignature = Boolean(selected.signatures.landlord?.dataUrl);
  const hasTenantSignature = Boolean(selected.signatures.tenant?.dataUrl);

  switch (actionKey) {
    case "delete":
      return roleView !== "student";
    case "update_deposit":
      return roleView !== "student";
    case "send_to_student":
      return roleView !== "student" && selected.workflowStatus === "draft" && hasLandlordSignature;
    case "student_sign":
      return roleView === "student" && selected.workflowStatus === "sent_to_student" && hasTenantSignature;
    case "landlord_verify":
      return roleView === "landlord" && selected.workflowStatus === "student_signed" && hasLandlordSignature;
    case "approve":
      return (
        roleView === "admin" &&
        selected.workflowStatus === "landlord_verified" &&
        hasLandlordSignature &&
        hasTenantSignature
      );
    case "reject":
      return roleView === "admin" && selected.workflowStatus === "landlord_verified";
    case "request_revision":
      return roleView === "landlord" && selected.workflowStatus === "student_signed";
    case "edit_resend":
      return (
        roleView !== "student" &&
        (selected.workflowStatus === "revision_requested" || selected.workflowStatus === "rejected")
      );
    default:
      return false;
  }
}

function SignatureUpload({
  label,
  value,
  uploadedAt,
  helper,
  uploadLabel,
  onChange,
  onRemove,
}: {
  label: string;
  value?: string;
  uploadedAt?: string;
  helper?: string;
  uploadLabel: string;
  onChange: (next: string) => void;
  onRemove?: () => void;
}) {
  const uploadedLabel = formatDateTime(uploadedAt);

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="text-xs font-semibold text-gray-700">{label}</div>
      {helper ? <div className="mt-1 text-[11px] text-gray-500">{helper}</div> : null}
      {uploadedLabel ? <div className="mt-1 text-[11px] text-gray-500">Tải lên lúc {uploadedLabel}</div> : null}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="relative h-16 w-40 overflow-hidden rounded-lg border border-dashed border-gray-300 bg-white">
          {value ? (
            <Image
              src={value}
              alt="Signature preview"
              fill
              unoptimized
              sizes="160px"
              className="object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] text-gray-400">
              Chưa có chữ ký
            </div>
          )}
        </div>

        <label className="inline-flex cursor-pointer items-center rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50">
          {uploadLabel}
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

        {value && onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            Xóa chữ ký
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  tone = "default",
  reason,
  onReasonChange,
  confirmDisabled = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "default" | "danger";
  reason?: string;
  onReasonChange?: (value: string) => void;
  confirmDisabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
        <div className="text-lg font-semibold text-gray-900">{title}</div>
        <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>

        {onReasonChange ? (
          <div className="mt-4">
            <label className="text-xs font-semibold text-gray-700">Lý do ngắn</label>
            <textarea
              rows={3}
              value={reason ?? ""}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Nhập lý do để lưu lại thao tác này..."
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-gray-400"
            />
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold text-white transition",
              tone === "danger" ? "bg-rose-600 hover:bg-rose-700" : "bg-gray-900 hover:bg-gray-800",
              confirmDisabled && "cursor-not-allowed bg-gray-300 hover:bg-gray-300",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastHost({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur",
            toast.tone === "success" && "border-green-200 bg-green-50 text-green-800",
            toast.tone === "info" && "border-gray-200 bg-white text-gray-800",
            toast.tone === "danger" && "border-rose-200 bg-rose-50 text-rose-800",
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function ContractsToolbar({
  roleView,
  canCreate,
  search,
  statusFilter,
  workflowFilter,
  sortBy,
  onRoleViewChange,
  onCreate,
  onSearchChange,
  onStatusFilterChange,
  onWorkflowFilterChange,
  onSortByChange,
}: {
  roleView: UserRole;
  canCreate: boolean;
  search: string;
  statusFilter: FilterStatus;
  workflowFilter: WorkflowFilter;
  sortBy: SortKey;
  onRoleViewChange: (role: UserRole) => void;
  onCreate: () => void;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: FilterStatus) => void;
  onWorkflowFilterChange: (value: WorkflowFilter) => void;
  onSortByChange: (value: SortKey) => void;
}) {
  return (
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
                  onClick={() => onRoleViewChange(role)}
                  className={cn(
                    "rounded-full px-3 py-1.5 transition",
                    active ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-white",
                  )}
                >
                  {roleLabels[role]}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onCreate}
            disabled={!canCreate}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-semibold text-white transition",
              canCreate ? "bg-gray-900 hover:bg-gray-800" : "cursor-not-allowed bg-gray-300",
            )}
          >
            + Tạo hợp đồng
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <input
          type="text"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm theo mã, tiêu đề, sinh viên hoặc chủ trọ..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:bg-white"
        />

        <div className="flex flex-wrap gap-2">
          {statusFilterOptions.map((option) => {
            const active = statusFilter === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onStatusFilterChange(option.key)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  active
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Workflow
            </span>
            <select
              value={workflowFilter}
              onChange={(event) => onWorkflowFilterChange(event.target.value as WorkflowFilter)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:bg-white"
            >
              {workflowFilterOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              Sắp xếp
            </span>
            <select
              value={sortBy}
              onChange={(event) => onSortByChange(event.target.value as SortKey)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:bg-white"
            >
              <option value="ending_soon">Gần hết hạn</option>
              <option value="newest">Mới tạo</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}

function ContractList({
  contracts,
  selectedId,
  onSelect,
}: {
  contracts: ContractRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-gray-900">Danh sách hợp đồng</div>
        <div className="text-xs text-gray-500">{contracts.length} kết quả</div>
      </div>

      {contracts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
          Không tìm thấy hợp đồng phù hợp với bộ lọc hiện tại.
        </div>
      ) : null}

      {contracts.map((contract) => {
        const derivedStatus = getContractStatus(contract);
        const selected = contract.id === selectedId;

        return (
          <button
            key={contract.id}
            type="button"
            onClick={() => onSelect(contract.id)}
            className={cn(
              "w-full rounded-2xl border p-4 text-left transition",
              selected ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white hover:border-gray-300",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{contract.listingTitle}</div>
                <div className={cn("mt-1 text-xs", selected ? "text-white/70" : "text-gray-500")}>
                  {contract.listingAddress}
                </div>
              </div>

              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-1 text-xs font-semibold",
                  selected ? "bg-white/15 text-white" : statusBadge[derivedStatus].tone,
                )}
              >
                {statusBadge[derivedStatus].label}
              </span>
            </div>

            <div className={cn("mt-3 text-xs", selected ? "text-white/70" : "text-gray-500")}>
              Mã hợp đồng: {contract.id}
            </div>

            <div className={cn("mt-2 flex flex-wrap items-center gap-2 text-xs", selected ? "text-white/70" : "text-gray-500")}>
              <span>Kết thúc {formatDate(contract.endDate)}</span>
              <span>•</span>
              <span>{getDaysLeftLabel(contract.endDate)}</span>
              <span>•</span>
              <span>Tiền cọc {formatVnd(contract.deposit)}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-1 text-[11px] font-semibold",
                  selected ? "bg-white/15 text-white" : workflowBadge[contract.workflowStatus].tone,
                )}
              >
                {workflowBadge[contract.workflowStatus].label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function WorkflowPanel({
  contract,
  roleView,
  noteValue,
  onNoteChange,
  onLandlordSignatureChange,
  onTenantSignatureChange,
  onRequestRemoveSignature,
  onSendToStudent,
  onStudentSign,
  onLandlordVerify,
  onAdminApprove,
  onRequestRevision,
  onReject,
  onEditResend,
}: {
  contract: ContractRecord;
  roleView: UserRole;
  noteValue: string;
  onNoteChange: (value: string) => void;
  onLandlordSignatureChange: (value: string) => void;
  onTenantSignatureChange: (value: string) => void;
  onRequestRemoveSignature: (party: SignatureParty) => void;
  onSendToStudent: () => void;
  onStudentSign: () => void;
  onLandlordVerify: () => void;
  onAdminApprove: () => void;
  onRequestRevision: () => void;
  onReject: () => void;
  onEditResend: () => void;
}) {
  const hasLandlordSignature = Boolean(contract.signatures.landlord?.dataUrl);
  const hasTenantSignature = Boolean(contract.signatures.tenant?.dataUrl);
  const workflowIndex = getWorkflowIndex(contract);
  const showWorkflowNote =
    contract.workflowStatus === "revision_requested" || contract.workflowStatus === "rejected";
  const warningTone =
    contract.workflowStatus === "rejected"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-amber-200 bg-amber-50 text-amber-700";
  const canSendToStudent = can("send_to_student", roleView, contract);
  const canStudentSign = can("student_sign", roleView, contract);
  const canLandlordVerify = can("landlord_verify", roleView, contract);
  const canApprove = can("approve", roleView, contract);
  const canReject = can("reject", roleView, contract);
  const canRequestRevision = can("request_revision", roleView, contract);
  const canEditResend = can("edit_resend", roleView, contract);
  const canShowLandlordUploader =
    (roleView === "landlord" || roleView === "admin") &&
    (contract.workflowStatus === "draft" ||
      contract.workflowStatus === "revision_requested" ||
      contract.workflowStatus === "student_signed");
  const canShowStudentUploader = roleView === "student" && contract.workflowStatus === "sent_to_student";
  const showNoteInput =
    (roleView === "landlord" && contract.workflowStatus === "student_signed") ||
    (roleView === "admin" && contract.workflowStatus === "landlord_verified");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-gray-900">Quy trình ký & duyệt</div>
          <div className="text-xs text-gray-500">Vai trò hiện tại: {roleLabels[roleView]}</div>
        </div>

        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", workflowBadge[contract.workflowStatus].tone)}>
          {workflowBadge[contract.workflowStatus].label}
        </span>
      </div>

      {showWorkflowNote ? (
        <div className={cn("mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold", warningTone)}>
          {contract.workflowStatus === "revision_requested" ? "Yêu cầu chỉnh sửa" : "Bị từ chối"}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-5">
        {workflowSteps.map((step, index) => {
          const completed = index < workflowIndex;
          const active = index === workflowIndex;

          return (
            <div
              key={step.key}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                completed || active
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-500",
              )}
            >
              <div className="text-[10px] uppercase opacity-70">Bước {index + 1}</div>
              <div>{step.label}</div>
            </div>
          );
        })}
      </div>

      {showWorkflowNote ? (
        <div className={cn("mt-4 rounded-xl border px-3 py-3 text-sm", warningTone)}>
          <div className="font-semibold">Ghi chú</div>
          <div className="mt-1 leading-6">{contract.workflowNote || "Chưa có ghi chú."}</div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          {canShowLandlordUploader ? (
            <SignatureUpload
              label="Chữ ký số bên cho thuê"
              value={contract.signatures.landlord?.dataUrl}
              uploadedAt={contract.signatures.landlord?.uploadedAt}
              helper="Upload chữ ký số của chủ trọ (PNG/JPG)."
              uploadLabel="Tải chữ ký số"
              onChange={onLandlordSignatureChange}
              onRemove={
                contract.signatures.landlord?.dataUrl ? () => onRequestRemoveSignature("landlord") : undefined
              }
            />
          ) : null}

          {canShowStudentUploader ? (
            <SignatureUpload
              label="Chữ ký số sinh viên"
              value={contract.signatures.tenant?.dataUrl}
              uploadedAt={contract.signatures.tenant?.uploadedAt}
              helper="Sinh viên ký bằng chữ ký số trước khi gửi lại."
              uploadLabel="Tải chữ ký số"
              onChange={onTenantSignatureChange}
              onRemove={contract.signatures.tenant?.dataUrl ? () => onRequestRemoveSignature("tenant") : undefined}
            />
          ) : null}

          <div className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs text-gray-600">
            <div className="font-semibold text-gray-700">Tình trạng chữ ký</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-1",
                  hasLandlordSignature ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500",
                )}
              >
                Chủ trọ: {hasLandlordSignature ? "Đã tải" : "Chưa có"}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-1",
                  hasTenantSignature ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500",
                )}
              >
                Sinh viên: {hasTenantSignature ? "Đã tải" : "Chưa có"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {showNoteInput ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
              <div className="text-xs font-semibold text-gray-700">Ghi chú xử lý</div>
              <textarea
                rows={3}
                value={noteValue}
                onChange={(event) => onNoteChange(event.target.value)}
                placeholder="Nhập ghi chú hoặc lý do..."
                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none transition focus:border-gray-300"
              />
            </div>
          ) : null}

          {roleView !== "student" && contract.workflowStatus === "draft" ? (
            <button
              type="button"
              onClick={onSendToStudent}
              disabled={!canSendToStudent}
              className={cn(
                "w-full rounded-xl px-4 py-2 text-xs font-semibold text-white transition",
                canSendToStudent ? "bg-gray-900 hover:bg-gray-800" : "cursor-not-allowed bg-gray-300",
              )}
            >
              Gửi hợp đồng cho sinh viên
            </button>
          ) : null}

          {roleView === "student" && contract.workflowStatus === "sent_to_student" ? (
            <button
              type="button"
              onClick={onStudentSign}
              disabled={!canStudentSign}
              className={cn(
                "w-full rounded-xl px-4 py-2 text-xs font-semibold text-white transition",
                canStudentSign ? "bg-[#D51F35] hover:bg-[#b01628]" : "cursor-not-allowed bg-gray-300",
              )}
            >
              Ký & gửi lại
            </button>
          ) : null}

          {roleView === "landlord" && contract.workflowStatus === "student_signed" ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={onLandlordVerify}
                disabled={!canLandlordVerify}
                className={cn(
                  "w-full rounded-xl px-4 py-2 text-xs font-semibold text-white transition",
                  canLandlordVerify ? "bg-emerald-600 hover:bg-emerald-700" : "cursor-not-allowed bg-gray-300",
                )}
              >
                Xác nhận & gửi admin
              </button>
              <button
                type="button"
                onClick={onRequestRevision}
                disabled={!canRequestRevision}
                className={cn(
                  "w-full rounded-xl border px-4 py-2 text-xs font-semibold transition",
                  canRequestRevision
                    ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                    : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400",
                )}
              >
                Yêu cầu chỉnh sửa
              </button>
            </div>
          ) : null}

          {roleView === "admin" && contract.workflowStatus === "landlord_verified" ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={onAdminApprove}
                disabled={!canApprove}
                className={cn(
                  "w-full rounded-xl px-4 py-2 text-xs font-semibold text-white transition",
                  canApprove ? "bg-green-600 hover:bg-green-700" : "cursor-not-allowed bg-gray-300",
                )}
              >
                Duyệt hợp đồng
              </button>
              <button
                type="button"
                onClick={onReject}
                disabled={!canReject}
                className={cn(
                  "w-full rounded-xl border px-4 py-2 text-xs font-semibold transition",
                  canReject
                    ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400",
                )}
              >
                Từ chối
              </button>
            </div>
          ) : null}

          {(contract.workflowStatus === "revision_requested" || contract.workflowStatus === "rejected") &&
          roleView !== "student" ? (
            <button
              type="button"
              onClick={onEditResend}
              disabled={!canEditResend}
              className={cn(
                "w-full rounded-xl border px-4 py-2 text-xs font-semibold transition",
                canEditResend
                  ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400",
              )}
            >
              Chỉnh sửa & gửi lại
            </button>
          ) : null}

          {roleView === "student" && contract.workflowStatus !== "sent_to_student" ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-600">
              Hợp đồng đang ở trạng thái {workflowBadge[contract.workflowStatus].label.toLowerCase()}.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DepositPanel({
  contract,
  roleView,
  depositNote,
  onOpenDepositModal,
}: {
  contract: ContractRecord;
  roleView: UserRole;
  depositNote?: string;
  onOpenDepositModal: (status: Exclude<DepositStatus, "held">) => void;
}) {
  const canUpdateDeposit = can("update_deposit", roleView, contract);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-gray-900">Quản lý tiền cọc</div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", depositBadge[contract.depositStatus].tone)}>
          {depositBadge[contract.depositStatus].label}
        </span>
      </div>

      <div className="mt-3 text-sm leading-6 text-gray-700">
        Điều kiện hoàn cọc: bàn giao phòng đúng hiện trạng, thanh toán đủ chi phí, không vi phạm nội quy.
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onOpenDepositModal("refunded")}
          disabled={!canUpdateDeposit || contract.depositStatus === "refunded"}
          className={cn(
            "rounded-full border px-4 py-2 text-xs font-semibold transition",
            canUpdateDeposit && contract.depositStatus !== "refunded"
              ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400",
          )}
        >
          Đã hoàn cọc
        </button>
        <button
          type="button"
          onClick={() => onOpenDepositModal("forfeited")}
          disabled={!canUpdateDeposit || contract.depositStatus === "forfeited"}
          className={cn(
            "rounded-full border px-4 py-2 text-xs font-semibold transition",
            canUpdateDeposit && contract.depositStatus !== "forfeited"
              ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400",
          )}
        >
          Mất cọc
        </button>
      </div>

      {depositNote ? (
        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-600">
          <span className="font-semibold text-gray-700">Ghi chú cọc:</span> {depositNote}
        </div>
      ) : null}
    </div>
  );
}

function ReminderPanel({
  contract,
  reminder,
  onToggle,
}: {
  contract: ContractRecord;
  reminder?: ReminderSelection;
  onToggle: (key: keyof ReminderSelection, checked: boolean) => void;
}) {
  const reminderDates = getReminderDates(contract.endDate, reminder);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-gray-900">Nhắc nhở gia hạn</div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-700">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            checked={reminder?.d30 ?? false}
            onChange={(event) => onToggle("d30", event.target.checked)}
          />
          Nhắc trước 30 ngày
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            checked={reminder?.d15 ?? false}
            onChange={(event) => onToggle("d15", event.target.checked)}
          />
          Nhắc trước 15 ngày
        </label>
      </div>

      <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
        Sẽ nhắc vào: {reminderDates.length > 0 ? reminderDates.join(", ") : "Chưa bật lịch nhắc."}
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Thông báo sẽ được gửi cho cả chủ trọ và người thuê theo lịch nhắc nhở đã chọn.
      </div>
    </div>
  );
}

function ContractDetail({
  selected,
  roleView,
  noteValue,
  reminder,
  depositNote,
  onNoteChange,
  onDelete,
  onLandlordSignatureChange,
  onTenantSignatureChange,
  onRequestRemoveSignature,
  onSendToStudent,
  onStudentSign,
  onLandlordVerify,
  onAdminApprove,
  onRequestRevision,
  onReject,
  onEditResend,
  onOpenDepositModal,
  onToggleReminder,
}: {
  selected?: ContractRecord;
  roleView: UserRole;
  noteValue: string;
  reminder?: ReminderSelection;
  depositNote?: string;
  onNoteChange: (value: string) => void;
  onDelete: () => void;
  onLandlordSignatureChange: (value: string) => void;
  onTenantSignatureChange: (value: string) => void;
  onRequestRemoveSignature: (party: SignatureParty) => void;
  onSendToStudent: () => void;
  onStudentSign: () => void;
  onLandlordVerify: () => void;
  onAdminApprove: () => void;
  onRequestRevision: () => void;
  onReject: () => void;
  onEditResend: () => void;
  onOpenDepositModal: (status: Exclude<DepositStatus, "held">) => void;
  onToggleReminder: (key: keyof ReminderSelection, checked: boolean) => void;
}) {
  if (!selected) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
        Không có hợp đồng nào để hiển thị trong bộ lọc hiện tại.
      </div>
    );
  }

  const derivedStatus = getContractStatus(selected);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-gray-900">{selected.listingTitle}</div>
            <div className="text-sm text-gray-500">{selected.listingAddress}</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", statusBadge[derivedStatus].tone)}>
              {statusBadge[derivedStatus].label}
            </span>
            <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", workflowBadge[selected.workflowStatus].tone)}>
              {workflowBadge[selected.workflowStatus].label}
            </span>
            <button
              type="button"
              onClick={onDelete}
              disabled={!can("delete", roleView, selected)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition",
                can("delete", roleView, selected)
                  ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400",
              )}
            >
              Xóa hợp đồng
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
          <div>
            <div className="text-xs text-gray-500">Mã hợp đồng</div>
            <div className="font-semibold text-gray-900">{selected.id}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Người tạo</div>
            <div className="font-semibold text-gray-900">{roleLabels[selected.createdBy]}</div>
          </div>
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
              {formatDate(selected.startDate)} - {formatDate(selected.endDate)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Tình trạng còn lại</div>
            <div className="font-semibold text-gray-900">{getDaysLeftLabel(selected.endDate)}</div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-gray-500">Chi phí dịch vụ</div>
            <div className="font-semibold text-gray-900">{selected.serviceFees}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-gray-900">Điều khoản gia hạn & chấm dứt</div>
        <p className="mt-2 text-sm leading-6 text-gray-700">{selected.renewalTerms}</p>
        <p className="mt-2 text-sm leading-6 text-gray-700">{selected.terminationTerms}</p>
      </div>

      <WorkflowPanel
        contract={selected}
        roleView={roleView}
        noteValue={noteValue}
        onNoteChange={onNoteChange}
        onLandlordSignatureChange={onLandlordSignatureChange}
        onTenantSignatureChange={onTenantSignatureChange}
        onRequestRemoveSignature={onRequestRemoveSignature}
        onSendToStudent={onSendToStudent}
        onStudentSign={onStudentSign}
        onLandlordVerify={onLandlordVerify}
        onAdminApprove={onAdminApprove}
        onRequestRevision={onRequestRevision}
        onReject={onReject}
        onEditResend={onEditResend}
      />

      <DepositPanel
        contract={selected}
        roleView={roleView}
        depositNote={depositNote}
        onOpenDepositModal={onOpenDepositModal}
      />

      <ReminderPanel contract={selected} reminder={reminder} onToggle={onToggleReminder} />

      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-xs leading-6 text-gray-600">
        Hợp đồng do chủ trọ soạn thảo và ký trực tiếp với người thuê. VLU Renting chỉ lưu trữ thông tin để tham
        chiếu và quản lý, không thay thế việc ký kết pháp lý.
      </div>
    </div>
  );
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRecord[]>(contractsSeed);
  const [selectedId, setSelectedId] = useState(contractsSeed[0]?.id ?? "");
  const [reminders, setReminders] = useState<Record<string, ReminderSelection>>({
    "CT-2025-0821": { d15: true, d30: true },
    "CT-2025-0915": { d15: true, d30: false },
    "CT-2024-1102": { d15: false, d30: true },
  });
  const [roleView, setRoleView] = useState<UserRole>("landlord");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [depositNotes, setDepositNotes] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [workflowFilter, setWorkflowFilter] = useState<WorkflowFilter>("all");
  const [sortBy, setSortBy] = useState<SortKey>("ending_soon");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const pushToast = (message: string, tone: ToastTone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 2500);
  };

  const updateContract = (id: string, updater: (current: ContractRecord) => ContractRecord) => {
    setContracts((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  };

  const filteredContracts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...contracts]
      .filter((contract) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          [contract.id, contract.listingTitle, contract.tenantName, contract.landlordName]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);

        const derivedStatus = getContractStatus(contract);
        const matchesStatus = statusFilter === "all" || derivedStatus === statusFilter;
        const matchesWorkflow = workflowFilter === "all" || contract.workflowStatus === workflowFilter;

        return matchesSearch && matchesStatus && matchesWorkflow;
      })
      .sort((left, right) => {
        if (sortBy === "ending_soon") {
          const leftTime = parseDateValue(left.endDate).getTime();
          const rightTime = parseDateValue(right.endDate).getTime();
          return leftTime - rightTime;
        }

        const leftTime = parseDateValue(left.createdAt ?? left.endDate).getTime();
        const rightTime = parseDateValue(right.createdAt ?? right.endDate).getTime();
        return rightTime - leftTime;
      });
  }, [contracts, search, sortBy, statusFilter, workflowFilter]);

  const activeSelectedId = useMemo(() => {
    if (filteredContracts.length === 0) return "";
    return filteredContracts.some((contract) => contract.id === selectedId)
      ? selectedId
      : filteredContracts[0].id;
  }, [filteredContracts, selectedId]);

  const updateSelected = (updater: (current: ContractRecord) => ContractRecord) => {
    if (!activeSelectedId) return;
    updateContract(activeSelectedId, updater);
  };

  const selected = useMemo(
    () => filteredContracts.find((item) => item.id === activeSelectedId) ?? filteredContracts[0],
    [activeSelectedId, filteredContracts],
  );

  const stats = useMemo(() => {
    const active = contracts.filter((contract) => getContractStatus(contract) === "active").length;
    const ending = contracts.filter((contract) => getContractStatus(contract) === "ending").length;
    const holding = contracts.filter((contract) => contract.depositStatus === "held").length;
    const totalDeposit = contracts.reduce(
      (sum, contract) => sum + (contract.depositStatus === "held" ? contract.deposit : 0),
      0,
    );

    return { active, ending, holding, totalDeposit };
  }, [contracts]);

  const noteValue = selected ? notes[selected.id] ?? "" : "";
  const selectedReminder = selected ? reminders[selected.id] : undefined;
  const selectedDepositNote = selected ? depositNotes[selected.id] : undefined;

  const createContract = () => {
    if (!can("create", roleView)) return;

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
      workflowStatus: "draft",
      workflowAnchorStatus: "draft",
      createdBy: roleView,
      signatures: {},
      createdAt: new Date().toISOString(),
    };

    setContracts((prev) => [newContract, ...prev]);
    setReminders((prev) => ({ ...prev, [newId]: { d15: true, d30: true } }));
    setSearch("");
    setStatusFilter("all");
    setWorkflowFilter("all");
    setSelectedId(newId);
    pushToast("Đã tạo hợp đồng mới.", "success");
  };

  const setSignature = (party: SignatureParty, dataUrl: string) => {
    if (!selected) return;

    const name = party === "landlord" ? selected.landlordName : selected.tenantName;
    updateSelected((current) => ({
      ...current,
      signatures: {
        ...current.signatures,
        [party]: {
          ...(current.signatures[party] ?? {}),
          name,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const openDeleteModal = () => {
    if (!selected || !can("delete", roleView, selected)) return;
    setConfirmState({ kind: "delete", contractId: selected.id });
  };

  const openDepositModal = (nextStatus: Exclude<DepositStatus, "held">) => {
    if (!selected || !can("update_deposit", roleView, selected)) return;
    setConfirmState({
      kind: "deposit",
      contractId: selected.id,
      nextStatus,
      reason: "",
    });
  };

  const openRemoveSignatureModal = (party: SignatureParty) => {
    if (!selected) return;
    setConfirmState({ kind: "remove_signature", contractId: selected.id, party });
  };

  const handleDeleteContract = (id: string) => {
    setContracts((prev) => prev.filter((item) => item.id !== id));
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
    setDepositNotes((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    pushToast(`Đã xóa hợp đồng ${id}.`, "info");
  };

  const handleSendToStudent = () => {
    if (!selected) return;

    updateSelected((current) => ({
      ...current,
      workflowStatus: "sent_to_student",
      workflowAnchorStatus: "sent_to_student",
      workflowNote: undefined,
      signatures: { ...current.signatures, tenant: undefined },
    }));
    setNotes((prev) => ({ ...prev, [selected.id]: "" }));
    pushToast("Đã gửi hợp đồng cho sinh viên.", "success");
  };

  const handleStudentSign = () => {
    if (!selected) return;

    updateSelected((current) => ({
      ...current,
      workflowStatus: "student_signed",
      workflowAnchorStatus: "student_signed",
      workflowNote: undefined,
    }));
    setNotes((prev) => ({ ...prev, [selected.id]: "" }));
    pushToast("Sinh viên đã ký và gửi lại hợp đồng.", "success");
  };

  const handleLandlordVerify = () => {
    if (!selected) return;

    updateSelected((current) => ({
      ...current,
      workflowStatus: "landlord_verified",
      workflowAnchorStatus: "landlord_verified",
      workflowNote: undefined,
    }));
    setNotes((prev) => ({ ...prev, [selected.id]: "" }));
    pushToast("Đã xác nhận và gửi hợp đồng cho admin.", "success");
  };

  const handleAdminApprove = () => {
    if (!selected) return;

    updateSelected((current) => ({
      ...current,
      workflowStatus: "admin_approved",
      workflowAnchorStatus: "admin_approved",
      workflowNote: undefined,
    }));
    setNotes((prev) => ({ ...prev, [selected.id]: "" }));
    pushToast("Admin đã duyệt hợp đồng.", "success");
  };

  const handleRequestRevision = () => {
    if (!selected) return;

    const note = (notes[selected.id] ?? "").trim();
    updateSelected((current) => ({
      ...current,
      workflowStatus: "revision_requested",
      workflowAnchorStatus: getWorkflowAnchorStatus(current),
      workflowNote: note || "Yêu cầu chỉnh sửa hợp đồng.",
      signatures: { ...current.signatures, tenant: undefined },
    }));
    setNotes((prev) => ({ ...prev, [selected.id]: "" }));
    pushToast("Đã gửi yêu cầu chỉnh sửa hợp đồng.", "info");
  };

  const handleReject = () => {
    if (!selected) return;

    const note = (notes[selected.id] ?? "").trim();
    updateSelected((current) => ({
      ...current,
      workflowStatus: "rejected",
      workflowAnchorStatus: getWorkflowAnchorStatus(current),
      workflowNote: note || "Hợp đồng bị từ chối.",
    }));
    setNotes((prev) => ({ ...prev, [selected.id]: "" }));
    pushToast("Hợp đồng đã bị từ chối.", "danger");
  };

  const handleEditResend = () => {
    if (!selected) return;

    updateSelected((current) => ({
      ...current,
      workflowStatus: "draft",
      workflowAnchorStatus: "draft",
      workflowNote: undefined,
      signatures: { ...current.signatures, tenant: undefined },
    }));
    setNotes((prev) => ({ ...prev, [selected.id]: "" }));
    pushToast("Đã chuyển hợp đồng về bản nháp để chỉnh sửa.", "info");
  };

  const handleConfirmModal = () => {
    if (!confirmState) return;

    if (confirmState.kind === "delete") {
      handleDeleteContract(confirmState.contractId);
      setConfirmState(null);
      return;
    }

    if (confirmState.kind === "remove_signature") {
      updateContract(confirmState.contractId, (current) => ({
        ...current,
        signatures: {
          ...current.signatures,
          [confirmState.party]: undefined,
        },
      }));
      pushToast(
        confirmState.party === "landlord" ? "Đã xóa chữ ký chủ trọ." : "Đã xóa chữ ký sinh viên.",
        "info",
      );
      setConfirmState(null);
      return;
    }

    const reason = confirmState.reason.trim();
    if (!reason) return;

    updateContract(confirmState.contractId, (current) => ({
      ...current,
      depositStatus: confirmState.nextStatus,
    }));
    setDepositNotes((prev) => ({ ...prev, [confirmState.contractId]: reason }));
    pushToast(
      confirmState.nextStatus === "refunded" ? "Đã ghi nhận hoàn cọc." : "Đã ghi nhận mất cọc.",
      confirmState.nextStatus === "refunded" ? "success" : "danger",
    );
    setConfirmState(null);
  };

  const modalTitle = useMemo(() => {
    if (!confirmState) return "";
    if (confirmState.kind === "delete") return `Xóa hợp đồng ${confirmState.contractId}?`;
    if (confirmState.kind === "remove_signature") {
      return confirmState.party === "landlord" ? "Xóa chữ ký chủ trọ?" : "Xóa chữ ký sinh viên?";
    }
    return confirmState.nextStatus === "refunded" ? "Xác nhận hoàn cọc?" : "Xác nhận mất cọc?";
  }, [confirmState]);

  const modalDescription = useMemo(() => {
    if (!confirmState) return "";
    if (confirmState.kind === "delete") {
      return "Thao tác này sẽ xóa hợp đồng khỏi danh sách demo hiện tại.";
    }
    if (confirmState.kind === "remove_signature") {
      return "Bạn sẽ cần tải lại chữ ký nếu muốn tiếp tục quy trình với bên này.";
    }
    return "Nhập lý do ngắn trước khi cập nhật trạng thái tiền cọc.";
  }, [confirmState]);

  const modalConfirmLabel = useMemo(() => {
    if (!confirmState) return "";
    if (confirmState.kind === "delete") return "Xóa hợp đồng";
    if (confirmState.kind === "remove_signature") return "Xóa chữ ký";
    return confirmState.nextStatus === "refunded" ? "Xác nhận hoàn cọc" : "Xác nhận mất cọc";
  }, [confirmState]);

  const modalTone: "default" | "danger" =
    confirmState?.kind === "delete" ||
    (confirmState?.kind === "deposit" && confirmState.nextStatus === "forfeited") ||
    confirmState?.kind === "remove_signature"
      ? "danger"
      : "default";

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

        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="space-y-4">
            <ContractsToolbar
              roleView={roleView}
              canCreate={can("create", roleView)}
              search={search}
              statusFilter={statusFilter}
              workflowFilter={workflowFilter}
              sortBy={sortBy}
              onRoleViewChange={setRoleView}
              onCreate={createContract}
              onSearchChange={setSearch}
              onStatusFilterChange={setStatusFilter}
              onWorkflowFilterChange={setWorkflowFilter}
              onSortByChange={setSortBy}
            />

            <ContractList contracts={filteredContracts} selectedId={activeSelectedId} onSelect={setSelectedId} />
          </div>

          <ContractDetail
            selected={selected}
            roleView={roleView}
            noteValue={noteValue}
            reminder={selectedReminder}
            depositNote={selectedDepositNote}
            onNoteChange={(value) => {
              if (!selected) return;
              setNotes((prev) => ({ ...prev, [selected.id]: value }));
            }}
            onDelete={openDeleteModal}
            onLandlordSignatureChange={(value) => setSignature("landlord", value)}
            onTenantSignatureChange={(value) => setSignature("tenant", value)}
            onRequestRemoveSignature={openRemoveSignatureModal}
            onSendToStudent={handleSendToStudent}
            onStudentSign={handleStudentSign}
            onLandlordVerify={handleLandlordVerify}
            onAdminApprove={handleAdminApprove}
            onRequestRevision={handleRequestRevision}
            onReject={handleReject}
            onEditResend={handleEditResend}
            onOpenDepositModal={openDepositModal}
            onToggleReminder={(key, checked) => {
              if (!selected) return;
              setReminders((prev) => ({
                ...prev,
                [selected.id]: {
                  ...(prev[selected.id] ?? { d15: false, d30: false }),
                  [key]: checked,
                },
              }));
            }}
          />
        </div>
      </div>

      <ConfirmModal
        open={Boolean(confirmState)}
        title={modalTitle}
        description={modalDescription}
        confirmLabel={modalConfirmLabel}
        tone={modalTone}
        reason={confirmState?.kind === "deposit" ? confirmState.reason : undefined}
        onReasonChange={
          confirmState?.kind === "deposit"
            ? (value) =>
                setConfirmState((current) =>
                  current?.kind === "deposit" ? { ...current, reason: value } : current,
                )
            : undefined
        }
        confirmDisabled={confirmState?.kind === "deposit" ? confirmState.reason.trim().length === 0 : false}
        onCancel={() => setConfirmState(null)}
        onConfirm={handleConfirmModal}
      />

      <ToastHost toasts={toasts} />
    </UserPageShell>
  );
}
