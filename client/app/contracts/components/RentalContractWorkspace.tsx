"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  RENTAL_CONTRACTS_EVENT,
  getRentalContractSortTimestamp,
  getRentalContractStatus,
  readRentalContractsFromStorage,
  upsertRentalContractToStorage,
  type RentalContractRecord,
} from "@/app/services/rental-contracts";
import { getStudentDirectory, type TenantDirectoryStudent } from "@/app/services/tenant-directory";

type UserRole = "admin" | "landlord" | "student";

type SessionUser = {
  role?: string;
  name?: string | null;
  email?: string | null;
  full_name?: string | null;
  accessToken?: string;
};

type ContractForm = {
  landlordName: string;
  landlordId: string;
  landlordPhone: string;
  landlordAddress: string;
  tenantName: string;
  tenantEmail: string;
  tenantId: string;
  tenantPhone: string;
  tenantAddress: string;
  propertyAddress: string;
  rent: string;
  deposit: string;
  termStart: string;
  termEnd: string;
  paymentDay: string;
  extraTerms: string;
};

type SignatureData = {
  dataUrl: string;
  hasSignature: boolean;
};

const emptyContractForm: ContractForm = {
  landlordName: "",
  landlordId: "",
  landlordPhone: "",
  landlordAddress: "",
  tenantName: "",
  tenantEmail: "",
  tenantId: "",
  tenantPhone: "",
  tenantAddress: "",
  propertyAddress: "",
  rent: "",
  deposit: "",
  termStart: "",
  termEnd: "",
  paymentDay: "05",
  extraTerms: "",
};

const inputClass =
  "w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-rose-300 focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-50 disabled:text-gray-500";

function generateContractId() {
  return `HD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
}

function formatVndInput(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getDisplayName(user: SessionUser) {
  const preferredName = user.full_name || user.name || "";
  if (preferredName.trim()) return preferredName;
  if (user.email?.trim()) return user.email.split("@")[0] || "Người dùng";
  return "Người dùng";
}

function normalizeText(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function matchesStudentLookup(student: TenantDirectoryStudent, query: string) {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return false;

  return String(student.id) === normalizedQuery || normalizeText(student.email) === normalizeText(normalizedQuery);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN");
}

function formatDateTime(value?: string) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function canViewContract(contract: RentalContractRecord, roleView: UserRole, displayName: string, email: string) {
  if (roleView === "admin") return true;

  const normalizedEmail = normalizeText(email);
  const normalizedName = normalizeText(displayName);

  if (roleView === "landlord") {
    if (normalizedEmail && normalizeText(contract.landlordEmail) === normalizedEmail) return true;
    return Boolean(normalizedName && normalizeText(contract.landlordName) === normalizedName);
  }

  if (normalizedEmail && normalizeText(contract.tenantEmail) === normalizedEmail) return true;
  return Boolean(normalizedName && normalizeText(contract.tenantName) === normalizedName);
}

function buildPrintHtml(contract: RentalContractRecord) {
  const termsText = escapeHtml(contract.extraTerms || "Không có điều khoản bổ sung.").replace(/\n/g, "<br />");
  const landlordSignatureBlock = contract.landlordSignatureDataUrl
    ? `<img src="${contract.landlordSignatureDataUrl}" alt="landlord-signature" style="height:90px;" />`
    : `<div style="height:90px;border-bottom:1px solid #999;"></div>`;
  const tenantSignatureBlock = contract.tenantSignatureDataUrl
    ? `<img src="${contract.tenantSignatureDataUrl}" alt="tenant-signature" style="height:90px;" />`
    : `<div style="height:90px;border-bottom:1px solid #999;"></div>`;

  return `
    <!DOCTYPE html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>Hợp đồng thuê</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 0; padding: 32px; }
          h1 { text-align: center; margin-bottom: 24px; font-size: 22px; letter-spacing: 1px; }
          h2 { font-size: 16px; margin: 18px 0 8px; }
          p, li { font-size: 13px; line-height: 1.6; }
          .muted { color: #6b7280; }
          .row { display: flex; justify-content: space-between; gap: 24px; }
          .box { border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; width: 48%; }
          .signature { margin-top: 32px; display: flex; justify-content: space-between; }
          .signature-block { width: 45%; text-align: center; }
        </style>
      </head>
      <body>
        <h1>HỢP ĐỒNG THUÊ</h1>
        <p class="muted">
          Mã hợp đồng: ${escapeHtml(contract.id)}
          <br />
          Trạng thái: ${escapeHtml(getRentalContractStatus(contract) === "fully_signed" ? "Đã ký hoàn tất" : "Chờ người thuê ký")}
        </p>

        <div class="row">
          <div class="box">
            <h2>Bên A (Chủ trọ)</h2>
            <p>Họ tên: ${escapeHtml(contract.landlordName || "--")}</p>
            <p>Email: ${escapeHtml(contract.landlordEmail || "--")}</p>
            <p>CCCD/CMND: ${escapeHtml(contract.landlordId || "--")}</p>
            <p>SĐT: ${escapeHtml(contract.landlordPhone || "--")}</p>
            <p>Địa chỉ: ${escapeHtml(contract.landlordAddress || "--")}</p>
          </div>
          <div class="box">
            <h2>Bên B (Người thuê)</h2>
            <p>Họ tên: ${escapeHtml(contract.tenantName || "--")}</p>
            <p>Email: ${escapeHtml(contract.tenantEmail || "--")}</p>
            <p>CCCD/CMND: ${escapeHtml(contract.tenantId || "--")}</p>
            <p>SĐT: ${escapeHtml(contract.tenantPhone || "--")}</p>
            <p>Địa chỉ: ${escapeHtml(contract.tenantAddress || "--")}</p>
          </div>
        </div>

        <h2>Thông tin thuê</h2>
        <ul>
          <li>Địa chỉ phòng: ${escapeHtml(contract.propertyAddress || "--")}</li>
          <li>Giá thuê: ${escapeHtml(contract.rent || "--")} VND/tháng</li>
          <li>Tiền cọc: ${escapeHtml(contract.deposit || "--")} VND</li>
          <li>Thời hạn: ${escapeHtml(contract.termStart || "--")} đến ${escapeHtml(contract.termEnd || "--")}</li>
          <li>Ngày thanh toán hàng tháng: ${escapeHtml(contract.paymentDay || "--")}</li>
        </ul>

        <h2>Điều khoản bổ sung</h2>
        <p>${termsText}</p>

        <div class="signature">
          <div class="signature-block">
            <p>BÊN A</p>
            ${landlordSignatureBlock}
            <p>${escapeHtml(contract.landlordSignatureName || contract.landlordName || "--")}</p>
            <p>${escapeHtml(formatDateTime(contract.landlordSignedAt || contract.createdAt))}</p>
          </div>
          <div class="signature-block">
            <p>BÊN B</p>
            ${tenantSignatureBlock}
            <p>${escapeHtml(contract.tenantSignatureName || contract.tenantName || "--")}</p>
            <p>${escapeHtml(formatDateTime(contract.tenantSignedAt))}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function SignaturePad({
  onChange,
  title,
  helper,
}: {
  onChange: (data: SignatureData) => void;
  title: string;
  helper: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const hasSignature = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
  }, []);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    lastPoint.current = getPoint(event);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const next = getPoint(event);
    const prev = lastPoint.current ?? next;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(next.x, next.y);
    ctx.stroke();
    lastPoint.current = next;
    hasSignature.current = true;
  };

  const handlePointerUp = () => {
    isDrawing.current = false;
    lastPoint.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;

    onChange({ dataUrl: canvas.toDataURL("image/png"), hasSignature: hasSignature.current });
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature.current = false;
    onChange({ dataUrl: "", hasSignature: false });
  };

  return (
    <div className="rounded-[26px] border border-stone-200 bg-[#fffdf8] p-4 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]">
      <div className="text-sm font-semibold text-gray-950">{title}</div>
      <div className="mt-1 text-xs leading-5 text-gray-500">{helper}</div>
      <div className="mt-4 rounded-[22px] border border-dashed border-stone-300 bg-white">
        <canvas
          ref={canvasRef}
          className="h-40 w-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-gray-500">
        <span>Có thể ký bằng chuột hoặc cảm ứng.</span>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-stone-50"
        >
          Xóa chữ ký
        </button>
      </div>
    </div>
  );
}

export default function RentalContractWorkspace({ roleView }: { roleView: UserRole }) {
  const { data: session } = useSession();
  const sessionUser = session?.user as SessionUser | undefined;
  const displayName = useMemo(
    () =>
      getDisplayName({
        name: sessionUser?.name ?? null,
        email: sessionUser?.email ?? null,
        full_name: sessionUser?.full_name ?? null,
      }),
    [sessionUser?.email, sessionUser?.full_name, sessionUser?.name],
  );
  const userEmail = sessionUser?.email?.trim() ?? "";
  const accessToken = sessionUser?.accessToken ?? "";
  const isLandlord = roleView === "landlord";
  const isStudent = roleView === "student";

  const [form, setForm] = useState<ContractForm>(() => ({
    ...emptyContractForm,
    landlordName: isLandlord ? displayName : "",
  }));
  const [contracts, setContracts] = useState<RentalContractRecord[]>([]);
  const [landlordSignature, setLandlordSignature] = useState<SignatureData>({ dataUrl: "", hasSignature: false });
  const [landlordSignatureName, setLandlordSignatureName] = useState("");
  const [landlordAgreed, setLandlordAgreed] = useState(false);
  const [tenantSignature, setTenantSignature] = useState<SignatureData>({ dataUrl: "", hasSignature: false });
  const [tenantSignatureName, setTenantSignatureName] = useState("");
  const [tenantAgreed, setTenantAgreed] = useState(false);
  const [studentDirectory, setStudentDirectory] = useState<TenantDirectoryStudent[]>([]);
  const [tenantLookupQuery, setTenantLookupQuery] = useState("");
  const [tenantOptionValue, setTenantOptionValue] = useState("");
  const [tenantLookupError, setTenantLookupError] = useState<string | null>(null);
  const [directoryError, setDirectoryError] = useState<string | null>(null);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [selectedIncomingId, setSelectedIncomingId] = useState("");
  const [currentContractId, setCurrentContractId] = useState(() => generateContractId());
  const [printableContract, setPrintableContract] = useState<RentalContractRecord | null>(null);

  useEffect(() => {
    const syncContracts = () => {
      setContracts(readRentalContractsFromStorage());
    };

    syncContracts();
    window.addEventListener("storage", syncContracts);
    window.addEventListener(RENTAL_CONTRACTS_EVENT, syncContracts as EventListener);

    return () => {
      window.removeEventListener("storage", syncContracts);
      window.removeEventListener(RENTAL_CONTRACTS_EVENT, syncContracts as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isLandlord || !accessToken) return;

    let active = true;
    const loadStudentDirectory = async () => {
      setLoadingDirectory(true);
      setDirectoryError(null);

      try {
        const data = await getStudentDirectory(accessToken);
        if (!active) return;
        setStudentDirectory(data);
      } catch {
        if (!active) return;
        setDirectoryError("Không tải được danh sách sinh viên. Chủ trọ sẽ chưa thể xác thực người thuê bằng ID hoặc email cho đến khi tải lại thành công.");
      } finally {
        if (!active) return;
        setLoadingDirectory(false);
      }
    };

    void loadStudentDirectory();

    return () => {
      active = false;
    };
  }, [accessToken, isLandlord]);

  const visibleContracts = useMemo(() => {
    return contracts
      .filter((contract) => canViewContract(contract, roleView, displayName, userEmail))
      .sort((left, right) => {
        const leftTime = new Date(getRentalContractSortTimestamp(left)).getTime();
        const rightTime = new Date(getRentalContractSortTimestamp(right)).getTime();
        return rightTime - leftTime;
      });
  }, [contracts, displayName, roleView, userEmail]);

  const landlordPendingContracts = useMemo(
    () => visibleContracts.filter((contract) => getRentalContractStatus(contract) === "pending_tenant_signature"),
    [visibleContracts],
  );

  const signedContracts = useMemo(
    () => visibleContracts.filter((contract) => getRentalContractStatus(contract) === "fully_signed"),
    [visibleContracts],
  );

  const incomingContracts = useMemo(
    () => visibleContracts.filter((contract) => getRentalContractStatus(contract) === "pending_tenant_signature"),
    [visibleContracts],
  );

  const activeIncomingId = useMemo(() => {
    if (incomingContracts.length === 0) return "";
    return incomingContracts.some((contract) => contract.id === selectedIncomingId)
      ? selectedIncomingId
      : incomingContracts[0].id;
  }, [incomingContracts, selectedIncomingId]);

  const activeIncomingContract = useMemo(
    () => incomingContracts.find((contract) => contract.id === activeIncomingId) ?? incomingContracts[0],
    [activeIncomingId, incomingContracts],
  );
  const selectedTenant = useMemo(
    () => studentDirectory.find((item) => String(item.id) === tenantOptionValue) ?? null,
    [studentDirectory, tenantOptionValue],
  );
  const tenantLookupMatch = useMemo(() => {
    const normalizedLookupQuery = tenantLookupQuery.trim();
    if (!normalizedLookupQuery) return null;
    return studentDirectory.find((item) => matchesStudentLookup(item, normalizedLookupQuery)) ?? null;
  }, [studentDirectory, tenantLookupQuery]);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (!active) return;
      setTenantSignature({ dataUrl: "", hasSignature: false });
      setTenantSignatureName("");
      setTenantAgreed(false);
      setFeedbackError(null);
      setFeedbackMessage(null);
    });

    return () => {
      active = false;
    };
  }, [activeIncomingId]);

  const resetLandlordFeedback = () => {
    setFeedbackError(null);
    setFeedbackMessage(null);
  };

  const clearSelectedTenant = useCallback(() => {
    setTenantOptionValue("");
    setForm((current) => ({
      ...current,
      tenantName: "",
      tenantEmail: "",
      tenantId: "",
      tenantPhone: "",
      tenantAddress: "",
    }));
  }, []);

  const applySelectedTenant = useCallback((student: TenantDirectoryStudent) => {
    const nextTenantId = String(student.id);
    setTenantOptionValue(nextTenantId);
    setForm((current) => ({
      ...current,
      tenantName: student.fullName || "",
      tenantEmail: student.email || "",
      tenantId: tenantOptionValue === nextTenantId ? current.tenantId : "",
      tenantPhone: tenantOptionValue === nextTenantId && current.tenantPhone.trim() ? current.tenantPhone : student.phoneNumber || "",
      tenantAddress: tenantOptionValue === nextTenantId && current.tenantAddress.trim() ? current.tenantAddress : student.address || "",
    }));
  }, [tenantOptionValue]);

  const updateFormField = (field: keyof ContractForm, value: string) => {
    resetLandlordFeedback();
    setForm((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    if (!isLandlord) return;

    const normalizedLookupQuery = tenantLookupQuery.trim();
    if (!normalizedLookupQuery) {
      if (tenantOptionValue) {
        clearSelectedTenant();
      }
      setTenantLookupError(null);
      return;
    }

    if (!tenantLookupMatch) {
      if (selectedTenant && !matchesStudentLookup(selectedTenant, normalizedLookupQuery)) {
        clearSelectedTenant();
      }
      return;
    }

    setTenantLookupError(null);
    if (!selectedTenant || selectedTenant.id !== tenantLookupMatch.id) {
      applySelectedTenant(tenantLookupMatch);
    }
  }, [applySelectedTenant, clearSelectedTenant, isLandlord, selectedTenant, tenantLookupMatch, tenantLookupQuery, tenantOptionValue]);

  const handleLookupTenant = () => {
    resetLandlordFeedback();
    setTenantLookupError(null);

    const normalizedLookupQuery = tenantLookupQuery.trim();
    if (!normalizedLookupQuery) {
      clearSelectedTenant();
      setTenantLookupError("Vui lòng nhập ID tài khoản hoặc email người thuê.");
      return;
    }

    if (!tenantLookupMatch) {
      clearSelectedTenant();
      setTenantLookupError(
        normalizedLookupQuery.includes("@")
          ? `Không tìm thấy sinh viên với email ${normalizedLookupQuery}.`
          : `Không tìm thấy sinh viên với ID ${normalizedLookupQuery}.`,
      );
      return;
    }

    applySelectedTenant(tenantLookupMatch);
  };

  const canSendContract = Boolean(
    isLandlord &&
      selectedTenant &&
      form.landlordName.trim() &&
      form.tenantName.trim() &&
      form.tenantEmail.trim() &&
      form.propertyAddress.trim() &&
      form.rent.trim() &&
      form.termStart &&
      form.termEnd &&
      landlordAgreed &&
      (landlordSignature.hasSignature || landlordSignatureName.trim()),
  );

  const canStudentSign = Boolean(
    isStudent &&
      activeIncomingContract &&
      tenantAgreed &&
      (tenantSignature.hasSignature || tenantSignatureName.trim()),
  );

  const buildContractRecord = () => {
    const now = new Date().toISOString();

    return {
      id: currentContractId,
      landlordName: form.landlordName,
      landlordEmail: userEmail,
      landlordId: form.landlordId,
      landlordPhone: form.landlordPhone,
      landlordAddress: form.landlordAddress,
      tenantName: form.tenantName,
      tenantEmail: form.tenantEmail,
      tenantUserId: tenantOptionValue || undefined,
      tenantId: form.tenantId,
      tenantPhone: form.tenantPhone,
      tenantAddress: form.tenantAddress,
      propertyAddress: form.propertyAddress,
      rent: form.rent,
      deposit: form.deposit,
      termStart: form.termStart,
      termEnd: form.termEnd,
      paymentDay: form.paymentDay,
      extraTerms: form.extraTerms,
      status: "pending_tenant_signature",
      landlordSignatureName: landlordSignatureName || form.landlordName,
      landlordSignatureDataUrl: landlordSignature.dataUrl,
      landlordSignedAt: now,
      sentAt: now,
      createdAt: now,
      signedAt: "",
    } satisfies RentalContractRecord;
  };

  const resetLandlordForm = () => {
    setForm((current) => ({
      ...emptyContractForm,
      landlordName: current.landlordName,
      landlordId: current.landlordId,
      landlordPhone: current.landlordPhone,
      landlordAddress: current.landlordAddress,
      paymentDay: current.paymentDay || "05",
    }));
    setTenantLookupQuery("");
    setTenantLookupError(null);
    setTenantOptionValue("");
    setLandlordSignature({ dataUrl: "", hasSignature: false });
    setLandlordSignatureName("");
    setLandlordAgreed(false);
    setCurrentContractId(generateContractId());
  };

  const handleSendContract = () => {
    if (!canSendContract) {
      setFeedbackError("Chủ trọ cần tra cứu đúng ID tài khoản hoặc email người thuê, nhập đủ thông tin bắt buộc và ký trước khi gửi hợp đồng.");
      return;
    }

    const contract = buildContractRecord();
    upsertRentalContractToStorage(contract);
    setPrintableContract(contract);
    setFeedbackError(null);
    setFeedbackMessage(`Đã gửi hợp đồng ${contract.id} cho ${contract.tenantName}. Người thuê sẽ thấy hợp đồng này trong trang Contracts để ký.`);
    resetLandlordForm();
  };

  const handleStudentSign = () => {
    if (!canStudentSign || !activeIncomingContract) {
      setFeedbackError("Người thuê cần xác nhận điều khoản và ký trước khi hoàn tất hợp đồng.");
      return;
    }

    const now = new Date().toISOString();
    const signedContract: RentalContractRecord = {
      ...activeIncomingContract,
      tenantName: activeIncomingContract.tenantName || displayName,
      tenantEmail: activeIncomingContract.tenantEmail || userEmail,
      tenantSignatureName: tenantSignatureName || displayName || activeIncomingContract.tenantName,
      tenantSignatureDataUrl: tenantSignature.dataUrl,
      tenantSignedAt: now,
      status: "fully_signed",
      signedAt: now,
    };

    upsertRentalContractToStorage(signedContract);
    setPrintableContract(signedContract);
    setFeedbackError(null);
    setFeedbackMessage(`Đã ký hoàn tất hợp đồng ${signedContract.id}.`);
    setTenantSignature({ dataUrl: "", hasSignature: false });
    setTenantSignatureName("");
    setTenantAgreed(false);
  };

  const handlePrintContract = () => {
    setFeedbackError(null);

    if (!printableContract) {
      setFeedbackError("Chưa có hợp đồng nào để xuất PDF.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (!printWindow) {
      setFeedbackError("Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup và thử lại.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPrintHtml(printableContract));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (roleView === "admin") {
    return (
      <div
        id="rental-contract-workspace"
        className="overflow-hidden rounded-[32px] border border-gray-200 bg-[linear-gradient(135deg,#fff8f1_0%,#ffffff_58%,#f6fff9_100%)] shadow-[0_24px_60px_-40px_rgba(15,23,42,0.4)]"
      >
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.3fr)_300px]">
          <div>
            <div className="inline-flex rounded-full border border-rose-200 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-700">
              Khu thao tác hợp đồng
            </div>
            <div className="mt-4 text-2xl font-semibold tracking-tight text-gray-950">Admin chỉ giám sát, không trực tiếp tạo hoặc ký hợp đồng.</div>
            <div className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
              Vai trò admin dùng khung tổng quan bên trên để xem tất cả hợp đồng, theo dõi trạng thái chờ ký hoặc hoàn tất. Luồng thao tác tạo, gửi và ký chỉ dành cho chủ trọ và người thuê.
            </div>
          </div>

          <div className="rounded-[28px] border border-rose-800 bg-[#881337] p-5 text-white">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Phạm vi của admin</div>
            <div className="mt-4 space-y-3 text-sm leading-6 text-white/75">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Xem toàn bộ danh sách hợp đồng trong hệ thống.</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Theo dõi trạng thái ký và thời điểm cập nhật.</div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Không can thiệp vào chữ ký hay gửi hợp đồng cho người thuê.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="rental-contract-workspace" className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-rose-100 bg-[linear-gradient(135deg,#fff8f8_0%,#ffffff_62%,#fffaf7_100%)] shadow-[0_24px_60px_-40px_rgba(159,18,57,0.24)]">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.35fr)_320px] lg:items-start">
          <div className="space-y-4">
            <div>
              <div className="inline-flex rounded-full border border-rose-200 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-700">
                Khu thao tác
              </div>
              <div className="mt-4 text-2xl font-semibold tracking-tight text-gray-950 sm:text-[30px]">
                {isLandlord ? "Tạo và gửi hợp đồng theo từng bước rõ ràng." : "Rà soát rồi ký hợp đồng ngay trong một luồng duy nhất."}
              </div>
              <div className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
                {isLandlord
                  ? "Chọn đúng người thuê, hoàn thiện nội dung rồi ký gửi ngay trên cùng một khu vực."
                  : "Chọn hợp đồng đang chờ, kiểm tra nhanh thông tin và ký xác nhận mà không phải chuyển trang."}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-rose-800 bg-[#881337] p-5 text-white">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              {isLandlord ? "Phiên tạo hợp đồng" : "Hộp ký hợp đồng"}
            </div>
            <div className="mt-4 text-3xl font-semibold">{isLandlord ? currentContractId : incomingContracts.length}</div>
            <div className="mt-2 text-sm leading-6 text-white/70">
              {isLandlord
                ? "Mã hợp đồng mới sẽ được gắn vào bản đang tạo. Sau khi gửi, người thuê sẽ thấy đúng hợp đồng này."
                : incomingContracts.length > 0
                  ? "Chọn hợp đồng chờ ký ở cột bên trái để kiểm tra và ký xác nhận."
                  : "Khi có hợp đồng mới được gửi, chúng sẽ xuất hiện ở đây để bạn xử lý."}
            </div>
            <div className="mt-6 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-white/60">{isLandlord ? "Đang chờ người thuê ký" : "Chờ bạn ký"}</div>
                <div className="mt-2 text-2xl font-semibold">{isLandlord ? landlordPendingContracts.length : incomingContracts.length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-white/60">Đã hoàn tất</div>
                <div className="mt-2 text-2xl font-semibold">{signedContracts.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLandlord ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_360px]">
          <div className="space-y-5">
            <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-[0_22px_50px_-40px_rgba(15,23,42,0.35)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Bước 1</div>
                  <h2 className="mt-2 text-xl font-semibold text-gray-950">Xác thực đúng người thuê</h2>
                  <div className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                    Nhập ID tài khoản hoặc email sinh viên để hệ thống tự lấy đúng hồ sơ người nhận. Tên và email sẽ bị khóa để tránh gửi nhầm.
                  </div>
                </div>
                <div className="rounded-full bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700">
                  {selectedTenant ? "Đã xác thực người thuê" : "Chưa chọn người thuê"}
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <div className="rounded-[24px] border border-stone-200 bg-[#fffaf5] p-4">
                  <label className="text-sm font-semibold text-gray-800">ID tài khoản hoặc email người thuê</label>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                    <input
                      className={inputClass}
                      placeholder="Nhập ID tài khoản hoặc email sinh viên"
                      value={tenantLookupQuery}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        resetLandlordFeedback();
                        setTenantLookupError(null);
                        setTenantLookupQuery(nextValue);

                        if (selectedTenant && !matchesStudentLookup(selectedTenant, nextValue)) {
                          clearSelectedTenant();
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key !== "Enter") return;
                        event.preventDefault();
                        handleLookupTenant();
                      }}
                      disabled={loadingDirectory}
                    />
                    <button
                      type="button"
                      onClick={handleLookupTenant}
                      disabled={loadingDirectory}
                      className={`shrink-0 rounded-full px-5 py-3 text-sm font-semibold text-white transition ${
                        loadingDirectory ? "cursor-not-allowed bg-gray-300" : "bg-[#9f1239] hover:bg-[#881337]"
                      }`}
                    >
                      Tìm người thuê
                    </button>
                  </div>
                  <div className="mt-3 text-xs leading-5 text-gray-500">
                    {loadingDirectory
                      ? "Đang tải danh sách sinh viên..."
                      : "Nhập đúng ID tài khoản hoặc email, hệ thống sẽ tự hiện chính xác tên và email của người thuê từ hệ thống."}
                  </div>
                  {directoryError ? <div className="mt-3 text-xs text-amber-600">{directoryError}</div> : null}
                  {tenantLookupError ? <div className="mt-3 text-xs text-red-600">{tenantLookupError}</div> : null}
                </div>

                {selectedTenant ? (
                  <div className="grid gap-3 rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-950 sm:grid-cols-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">Người thuê</div>
                      <div className="mt-2 font-semibold">{selectedTenant.fullName}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">ID tài khoản</div>
                      <div className="mt-2 font-semibold">{selectedTenant.id}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-700">Email</div>
                      <div className="mt-2 break-all font-semibold">{selectedTenant.email}</div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-[0_22px_50px_-40px_rgba(15,23,42,0.35)]">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Bước 2</div>
              <h2 className="mt-2 text-xl font-semibold text-gray-950">Hoàn thiện nội dung hợp đồng</h2>
              <div className="mt-2 text-sm leading-6 text-gray-600">
                Điền đầy đủ thông tin chủ trọ, giấy tờ người thuê và các điều khoản thuê trước khi ký gửi.
              </div>
              <div className="mt-5 rounded-[24px] border border-stone-200 bg-[#fffdf8] p-5">
                <h3 className="text-sm font-semibold text-gray-950">Thông tin chủ trọ</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <input className={inputClass} placeholder="Họ tên chủ trọ" value={form.landlordName} onChange={(event) => updateFormField("landlordName", event.target.value)} />
                <input className={inputClass} placeholder="CCCD/CMND" value={form.landlordId} onChange={(event) => updateFormField("landlordId", event.target.value)} />
                <input className={inputClass} placeholder="Số điện thoại" value={form.landlordPhone} onChange={(event) => updateFormField("landlordPhone", event.target.value)} />
                <input className={inputClass} placeholder="Địa chỉ" value={form.landlordAddress} onChange={(event) => updateFormField("landlordAddress", event.target.value)} />
              </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-[0_22px_50px_-40px_rgba(15,23,42,0.35)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-950">Thông tin người thuê</h2>
                <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-100">
                  Đồng bộ từ tài khoản
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <input
                  className={inputClass}
                  placeholder="Họ tên người thuê"
                  value={form.tenantName}
                  readOnly
                  disabled
                />
                <input
                  className={inputClass}
                  placeholder="Email người thuê"
                  value={form.tenantEmail}
                  readOnly
                  disabled
                />
                <input className={inputClass} placeholder="CCCD/CMND" value={form.tenantId} onChange={(event) => updateFormField("tenantId", event.target.value)} />
                <input className={inputClass} placeholder="Số điện thoại" value={form.tenantPhone} onChange={(event) => updateFormField("tenantPhone", event.target.value)} />
                <input className={`${inputClass} sm:col-span-2`} placeholder="Địa chỉ" value={form.tenantAddress} onChange={(event) => updateFormField("tenantAddress", event.target.value)} />
              </div>
              <div className="mt-3 text-xs leading-5 text-gray-500">
                Họ tên và email được lấy trực tiếp từ tài khoản sinh viên đã tra cứu bằng ID hoặc email để tránh chọn nhầm người thuê.
              </div>
            </div>

            <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-[0_22px_50px_-40px_rgba(15,23,42,0.35)]">
              <h2 className="text-lg font-semibold text-gray-950">Thông tin thuê</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <input className={`${inputClass} md:col-span-2 xl:col-span-2`} placeholder="Địa chỉ phòng" value={form.propertyAddress} onChange={(event) => updateFormField("propertyAddress", event.target.value)} />
                <input className={inputClass} placeholder="Giá thuê (VND)" value={form.rent} onChange={(event) => updateFormField("rent", formatVndInput(event.target.value))} />
                <input className={inputClass} placeholder="Tiền cọc (VND)" value={form.deposit} onChange={(event) => updateFormField("deposit", formatVndInput(event.target.value))} />
                <input className={inputClass} placeholder="Ngày thanh toán hàng tháng" value={form.paymentDay} onChange={(event) => updateFormField("paymentDay", event.target.value)} />
                <input type="date" className={inputClass} value={form.termStart} onChange={(event) => updateFormField("termStart", event.target.value)} />
                <input type="date" className={inputClass} value={form.termEnd} onChange={(event) => updateFormField("termEnd", event.target.value)} />
              </div>
              <div className="mt-4">
                <textarea rows={4} className={`${inputClass} resize-none`} placeholder="Điều khoản bổ sung" value={form.extraTerms} onChange={(event) => updateFormField("extraTerms", event.target.value)} />
              </div>
            </div>

              <div className="space-y-4 overflow-hidden rounded-[30px] border border-rose-800 bg-[#881337] p-6 text-white shadow-[0_24px_60px_-40px_rgba(136,19,55,0.6)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Bước 3</div>
                  <h2 className="mt-2 text-xl font-semibold text-white">Ký và gửi hợp đồng</h2>
                  <div className="mt-2 text-sm leading-6 text-white/70">
                    Khi ký và gửi, hợp đồng sẽ được lưu cho đúng người thuê đã xác thực ở bước đầu tiên.
                  </div>
                </div>
                <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
                  {canSendContract ? "Sẵn sàng gửi" : "Chưa đủ điều kiện gửi"}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Tên ký</label>
                  <input
                    className={inputClass}
                    placeholder="Nhập tên ký"
                    value={landlordSignatureName}
                    onChange={(event) => {
                      resetLandlordFeedback();
                      setLandlordSignatureName(event.target.value);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-white">Xác nhận điều khoản</label>
                  <label className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-[#D51F35] focus:ring-[#D51F35]"
                      checked={landlordAgreed}
                      onChange={(event) => {
                        resetLandlordFeedback();
                        setLandlordAgreed(event.target.checked);
                      }}
                    />
                    <span>Tôi xác nhận thông tin hợp đồng và đồng ý gửi cho người thuê ký.</span>
                  </label>
                </div>
              </div>

              <SignaturePad
                onChange={(value) => {
                  resetLandlordFeedback();
                  setLandlordSignature(value);
                }}
                title="Chữ ký chủ trọ"
                helper="Chữ ký này được lưu ngay khi gửi hợp đồng cho người thuê."
              />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleSendContract}
                  disabled={!canSendContract}
                  className={`rounded-full px-5 py-3 text-sm font-semibold text-white transition ${
                    canSendContract ? "bg-[#D51F35] hover:bg-[#b01628]" : "cursor-not-allowed bg-gray-500"
                  }`}
                >
                  Tạo và gửi cho người thuê
                </button>
                <button
                  type="button"
                  onClick={handlePrintContract}
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Xuất PDF hợp đồng gần nhất
                </button>
              </div>

              {feedbackMessage ? <div className="text-sm text-emerald-300">{feedbackMessage}</div> : null}
              {feedbackError ? <div className="text-sm text-rose-300">{feedbackError}</div> : null}
              {!canSendContract ? (
                <div className="text-xs leading-5 text-white/60">
                  Tra cứu đúng ID tài khoản hoặc email người thuê, điền đủ thông tin bắt buộc, xác nhận điều khoản và ký trước khi gửi.
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.35)]">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Tình trạng hiện tại</div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-[22px] border border-rose-100 bg-rose-50 p-4">
                  <div className="text-xs text-rose-700">Đang chờ người thuê ký</div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">{landlordPendingContracts.length}</div>
                </div>
                <div className="rounded-[22px] border border-rose-100 bg-rose-50 p-4">
                  <div className="text-xs text-rose-700">Đã ký hoàn tất</div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">{signedContracts.length}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.35)]">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Hợp đồng đang chờ xử lý</div>
              <div className="mt-3 space-y-3">
                {landlordPendingContracts.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-gray-300 bg-stone-50 p-4 text-sm text-gray-500">
                    Chưa có hợp đồng nào đang chờ người thuê ký.
                  </div>
                ) : (
                  landlordPendingContracts.slice(0, 4).map((contract) => (
                    <div key={contract.id} className="rounded-[22px] border border-stone-200 bg-[#fffdf8] p-4">
                      <div className="text-sm font-semibold text-gray-900">{contract.propertyAddress}</div>
                      <div className="mt-1 text-xs text-gray-500">Mã hợp đồng: {contract.id}</div>
                      <div className="mt-3 space-y-1 text-xs leading-5 text-gray-600">
                        <div>Người thuê: {contract.tenantName}</div>
                        <div>Đã gửi: {formatDateTime(contract.sentAt || contract.createdAt)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.35)]">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Bước 1</div>
              <div className="mt-2 text-xl font-semibold text-gray-950">Chọn hợp đồng chờ ký</div>
              <div className="mt-2 text-2xl font-bold text-gray-900">{incomingContracts.length}</div>
              <div className="mt-2 text-sm leading-6 text-gray-600">
                {signedContracts.length > 0
                  ? `${signedContracts.length} hợp đồng đã ký hoàn tất vẫn hiện trong danh sách tổng quan.`
                  : "Khi chủ trọ gửi hợp đồng, bạn sẽ thấy nó tại đây để ký."}
              </div>
            </div>

            {incomingContracts.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500 shadow-sm">
                Hiện chưa có hợp đồng nào đang chờ bạn ký.
              </div>
            ) : (
              incomingContracts.map((contract) => {
                const isSelected = contract.id === activeIncomingId;

                return (
                  <button
                    key={contract.id}
                    type="button"
                    onClick={() => setSelectedIncomingId(contract.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isSelected
                        ? "border-rose-200 bg-[linear-gradient(145deg,#fff1f2_0%,#ffffff_55%,#fff7ed_100%)] shadow-[0_20px_45px_-32px_rgba(190,24,93,0.5)]"
                        : "border-gray-200 bg-white hover:border-rose-100 hover:shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-gray-950">{contract.propertyAddress}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          Mã hợp đồng: {contract.id}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                        Chờ ký
                      </span>
                    </div>

                    <div className="mt-4 space-y-1 text-xs leading-5 text-gray-600">
                      <div>Chủ trọ: {contract.landlordName}</div>
                      <div>Đã gửi: {formatDateTime(contract.sentAt || contract.createdAt)}</div>
                      <div>Thời hạn: {formatDate(contract.termStart)} - {formatDate(contract.termEnd)}</div>
                    </div>

                    {isSelected ? (
                      <div className="mt-4 inline-flex items-center rounded-full bg-[#9f1239] px-3 py-1 text-[11px] font-semibold text-white">
                        Đang xem để ký
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
          {!activeIncomingContract ? (
            <div className="rounded-[32px] border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
              Chọn một hợp đồng đang chờ ký để xem chi tiết và ký.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.4)]">
                <div className="border-b border-gray-100 bg-[linear-gradient(135deg,#fffaf0_0%,#ffffff_60%,#f5fff9_100%)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Bước 2</div>
                    <div className="mt-2 text-xl font-semibold text-gray-950">{activeIncomingContract.propertyAddress}</div>
                    <div className="mt-1 text-sm text-gray-500">Mã hợp đồng: {activeIncomingContract.id}</div>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
                    Chờ người thuê ký
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-gray-700 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <div className="text-xs text-gray-500">Chủ trọ</div>
                    <div className="font-semibold text-gray-900">{activeIncomingContract.landlordName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Email chủ trọ</div>
                    <div className="font-semibold text-gray-900">{activeIncomingContract.landlordEmail || "--"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Người thuê</div>
                    <div className="font-semibold text-gray-900">{activeIncomingContract.tenantName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Email người thuê</div>
                    <div className="font-semibold text-gray-900">{activeIncomingContract.tenantEmail || "--"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Giá thuê</div>
                    <div className="font-semibold text-gray-900">{activeIncomingContract.rent || "--"}đ</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Tiền cọc</div>
                    <div className="font-semibold text-gray-900">{activeIncomingContract.deposit || "--"}đ</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Thời hạn</div>
                    <div className="font-semibold text-gray-900">
                      {formatDate(activeIncomingContract.termStart)} - {formatDate(activeIncomingContract.termEnd)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Đã gửi lúc</div>
                    <div className="font-semibold text-gray-900">
                      {formatDateTime(activeIncomingContract.sentAt || activeIncomingContract.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
              </div>

              <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.35)]">
                <div className="text-sm font-semibold text-gray-950">Điều khoản bổ sung</div>
                <div className="mt-4 rounded-[22px] border border-dashed border-stone-200 bg-[#fcfcfc] p-4 text-sm leading-7 text-gray-700">
                  {activeIncomingContract.extraTerms || "Không có điều khoản bổ sung."}
                </div>
              </div>

              <div className="space-y-4 rounded-[28px] border border-gray-200 bg-white p-6 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.35)]">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Bước 3</div>
                <h2 className="text-xl font-semibold text-gray-950">Ký hợp đồng</h2>
                <div className="text-sm leading-6 text-gray-600">
                  Đọc kỹ nội dung, xác nhận điều khoản rồi ký với tư cách người thuê để hoàn tất hợp đồng.
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-900">Tên ký</label>
                  <input
                    className={inputClass}
                    placeholder="Nhập tên ký"
                    value={tenantSignatureName}
                    onChange={(event) => {
                      setFeedbackError(null);
                      setFeedbackMessage(null);
                      setTenantSignatureName(event.target.value);
                    }}
                  />
                </div>

                <label className="flex items-start gap-3 rounded-[22px] border border-stone-200 bg-stone-50 p-4 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#D51F35] focus:ring-[#D51F35]"
                    checked={tenantAgreed}
                    onChange={(event) => {
                      setFeedbackError(null);
                      setFeedbackMessage(null);
                      setTenantAgreed(event.target.checked);
                    }}
                  />
                  <span>Tôi đã đọc, đồng ý nội dung hợp đồng và xác nhận ký với tư cách người thuê.</span>
                </label>

                <SignaturePad
                  onChange={(value) => {
                    setFeedbackError(null);
                    setFeedbackMessage(null);
                    setTenantSignature(value);
                  }}
                  title="Chữ ký người thuê"
                  helper="Sau khi ký, hợp đồng sẽ được chuyển sang trạng thái đã ký hoàn tất."
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleStudentSign}
                    disabled={!canStudentSign}
                    className={`rounded-full px-5 py-3 text-sm font-semibold text-white transition ${
                      canStudentSign ? "bg-[#D51F35] hover:bg-[#b01628]" : "cursor-not-allowed bg-gray-300"
                    }`}
                  >
                    Ký và hoàn tất hợp đồng
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintContract}
                    className="rounded-full border border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-stone-50"
                  >
                    Xuất PDF hợp đồng đã xử lý
                  </button>
                </div>

                {feedbackMessage ? <div className="text-sm text-emerald-600">{feedbackMessage}</div> : null}
                {feedbackError ? <div className="text-sm text-red-600">{feedbackError}</div> : null}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
