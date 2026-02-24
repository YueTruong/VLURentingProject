"use client";

import { useEffect, useRef, useState } from "react";
import UserPageShell from "@/app/homepage/components/UserPageShell";

type ContractForm = {
  landlordName: string;
  landlordId: string;
  landlordPhone: string;
  landlordAddress: string;
  tenantName: string;
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

const inputClass =
  "w-full rounded-xl border border-(--theme-border) px-4 py-3 text-sm text-(--theme-text) outline-none transition focus:border-(--brand-primary) focus:ring-1 focus:ring-(--theme-border)";

const CURRENT_YEAR = new Date().getFullYear();

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

function SignaturePad({ onChange }: { onChange: (data: SignatureData) => void }) {
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
    <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-4">
      <div className="text-sm font-semibold text-(--theme-text)">Khu vực ký</div>
      <div className="mt-3 rounded-xl border border-dashed border-(--theme-border) bg-(--theme-surface-muted)">
        <canvas
          ref={canvasRef}
          className="h-40 w-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-(--theme-text-subtle)">
        <span>Ký bằng chuột hoặc cảm ứng.</span>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-full border border-(--theme-border) bg-(--theme-surface) px-3 py-1 text-xs font-semibold text-(--theme-text-muted) hover:bg-(--theme-surface-muted)"
        >
          Xóa chữ ký
        </button>
      </div>
    </div>
  );
}

export default function ContractSignPage() {
  const [form, setForm] = useState<ContractForm>({
    landlordName: "",
    landlordId: "",
    landlordPhone: "",
    landlordAddress: "",
    tenantName: "",
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
  });
  const [signature, setSignature] = useState<SignatureData>({ dataUrl: "", hasSignature: false });
  const [signatureName, setSignatureName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const contractId = `VLU-${CURRENT_YEAR}-DRAFT`;

  const isComplete =
    form.landlordName.trim() &&
    form.tenantName.trim() &&
    form.propertyAddress.trim() &&
    form.rent.trim() &&
    form.termStart &&
    form.termEnd;

  const canSign = Boolean(isComplete && agreed && (signature.hasSignature || signatureName.trim()));

  const handleSign = () => {
    if (!canSign) return;
    setSignedAt(new Date().toLocaleString("vi-VN"));
  };

  const buildPrintHtml = () => {
    const termsText = escapeHtml(form.extraTerms || "Không có điều khoản bổ sung.")
      .replace(/\n/g, "<br />");
    const signatureBlockTenant = signature.hasSignature
      ? `<img src="${signature.dataUrl}" alt="signature" style="height:90px;" />`
      : `<div style="height:90px;border-bottom:1px solid #999;"></div>`;
    const signatureBlockLandlord = `<div style="height:90px;border-bottom:1px solid #999;"></div>`;
    return `
      <!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>Hợp đồng thuê trọ</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; margin: 0; padding: 32px; }
            h1 { text-align: center; margin-bottom: 24px; font-size: 22px; letter-spacing: 1px; }
            h2 { font-size: 16px; margin: 18px 0 8px; }
            p, li { font-size: 13px; line-height: 1.6; }
            .muted { color: #6b7280; }
            .row { display: flex; justify-content: space-between; gap: 24px; }
            .box { border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; }
            .signature { margin-top: 32px; display: flex; justify-content: space-between; }
            .signature-block { width: 45%; text-align: center; }
          </style>
        </head>
        <body>
          <h1>HỢP ĐỒNG THUÊ PHÒNG</h1>
          <p class="muted">Mã hợp đồng: ${escapeHtml(contractId)} • Ký ngày: ${escapeHtml(
            signedAt || new Date().toLocaleDateString("vi-VN")
          )}</p>

          <div class="row">
            <div class="box" style="width:48%">
              <h2>Bên A (Chủ trọ)</h2>
              <p>Họ tên: ${escapeHtml(form.landlordName || "--")}</p>
              <p>CCCD/CMND: ${escapeHtml(form.landlordId || "--")}</p>
              <p>SĐT: ${escapeHtml(form.landlordPhone || "--")}</p>
              <p>Địa chỉ: ${escapeHtml(form.landlordAddress || "--")}</p>
            </div>
            <div class="box" style="width:48%">
              <h2>Bên B (Người thuê)</h2>
              <p>Họ tên: ${escapeHtml(form.tenantName || "--")}</p>
              <p>CCCD/CMND: ${escapeHtml(form.tenantId || "--")}</p>
              <p>SĐT: ${escapeHtml(form.tenantPhone || "--")}</p>
              <p>Địa chỉ: ${escapeHtml(form.tenantAddress || "--")}</p>
            </div>
          </div>

          <h2>Điều 1: Thông tin thuê</h2>
          <ul>
            <li>Địa chỉ phòng: ${escapeHtml(form.propertyAddress || "--")}</li>
            <li>Giá thuê: ${escapeHtml(form.rent || "--")} VND/tháng</li>
            <li>Tiền cọc: ${escapeHtml(form.deposit || "--")} VND</li>
            <li>Thời hạn: ${escapeHtml(form.termStart || "--")} đến ${escapeHtml(form.termEnd || "--")}</li>
            <li>Ngày thanh toán hàng tháng: ${escapeHtml(form.paymentDay || "--")}</li>
          </ul>

          <h2>Điều 2: Nghĩa vụ các bên</h2>
          <ul>
            <li>Bên A bàn giao phòng đúng hiện trạng, đảm bảo quyền sử dụng hợp pháp.</li>
            <li>Bên B thanh toán đúng hạn, giữ gìn tài sản và tuân thủ nội quy.</li>
            <li>Các khoản phát sinh được thỏa thuận bằng văn bản hoặc xác nhận qua hệ thống.</li>
          </ul>

          <h2>Điều 3: Điều khoản bổ sung</h2>
          <p>${termsText}</p>

          <div class="signature">
            <div class="signature-block">
              <p>BÊN A</p>
              ${signatureBlockLandlord}
              <p>${escapeHtml(form.landlordName || "--")}</p>
            </div>
            <div class="signature-block">
              <p>BÊN B</p>
              ${signatureBlockTenant}
              <p>${escapeHtml(signatureName || form.tenantName || "--")}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleExportPdf = () => {
    setExportError(null);
    if (!canSign) {
      setExportError("Vui lòng hoàn tất thông tin và ký hợp đồng trước khi xuất PDF.");
      return;
    }
    const printWindow = window.open("", "_blank", "width=900,height=1200");
    if (!printWindow) {
      setExportError("Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup và thử lại.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(buildPrintHtml());
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <UserPageShell
      title="Ký hợp đồng trực tuyến"
      description="Demo ký hợp đồng thuê phòng và xuất file PDF trực tiếp trên web."
      eyebrow="Hợp đồng"
      actions={
        <span className="rounded-full bg-(--theme-surface)/10 px-4 py-2 text-xs font-semibold text-white">
          Mã hợp đồng: {contractId}
        </span>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-(--theme-text)">Thông tin chủ trọ</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input
                className={inputClass}
                placeholder="Họ tên chủ trọ"
                value={form.landlordName}
                onChange={(e) => setForm((prev) => ({ ...prev, landlordName: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="CCCD/CMND"
                value={form.landlordId}
                onChange={(e) => setForm((prev) => ({ ...prev, landlordId: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Số điện thoại"
                value={form.landlordPhone}
                onChange={(e) => setForm((prev) => ({ ...prev, landlordPhone: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Địa chỉ"
                value={form.landlordAddress}
                onChange={(e) => setForm((prev) => ({ ...prev, landlordAddress: e.target.value }))}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-(--theme-text)">Thông tin người thuê</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input
                className={inputClass}
                placeholder="Họ tên người thuê"
                value={form.tenantName}
                onChange={(e) => setForm((prev) => ({ ...prev, tenantName: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="CCCD/CMND"
                value={form.tenantId}
                onChange={(e) => setForm((prev) => ({ ...prev, tenantId: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Số điện thoại"
                value={form.tenantPhone}
                onChange={(e) => setForm((prev) => ({ ...prev, tenantPhone: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Địa chỉ"
                value={form.tenantAddress}
                onChange={(e) => setForm((prev) => ({ ...prev, tenantAddress: e.target.value }))}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-(--theme-text)">Thông tin thuê</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input
                className={inputClass}
                placeholder="Địa chỉ phòng"
                value={form.propertyAddress}
                onChange={(e) => setForm((prev) => ({ ...prev, propertyAddress: e.target.value }))}
              />
              <input
                className={inputClass}
                placeholder="Giá thuê (VND)"
                value={form.rent}
                onChange={(e) => setForm((prev) => ({ ...prev, rent: formatVndInput(e.target.value) }))}
              />
              <input
                className={inputClass}
                placeholder="Tiền cọc (VND)"
                value={form.deposit}
                onChange={(e) => setForm((prev) => ({ ...prev, deposit: formatVndInput(e.target.value) }))}
              />
              <input
                className={inputClass}
                placeholder="Ngày thanh toán hàng tháng (VD: 05)"
                value={form.paymentDay}
                onChange={(e) => setForm((prev) => ({ ...prev, paymentDay: e.target.value }))}
              />
              <input
                type="date"
                className={inputClass}
                value={form.termStart}
                onChange={(e) => setForm((prev) => ({ ...prev, termStart: e.target.value }))}
              />
              <input
                type="date"
                className={inputClass}
                value={form.termEnd}
                onChange={(e) => setForm((prev) => ({ ...prev, termEnd: e.target.value }))}
              />
            </div>
            <div className="mt-4">
              <textarea
                rows={4}
                className={`${inputClass} resize-none`}
                placeholder="Điều khoản bổ sung (nếu có)"
                value={form.extraTerms}
                onChange={(e) => setForm((prev) => ({ ...prev, extraTerms: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-(--theme-text)">Ký hợp đồng</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-(--theme-text)">Tên ký (hiển thị trên PDF)</label>
                <input
                  className={inputClass}
                  placeholder="Nhập tên ký"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-(--theme-text)">Xác nhận điều khoản</label>
                <label className="flex items-start gap-3 text-sm text-(--theme-text-muted)">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-(--theme-border) text-(--brand-accent) focus:ring-[#D51F35]"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <span>Tôi đã đọc và đồng ý với các điều khoản thuê.</span>
                </label>
              </div>
            </div>

            <SignaturePad onChange={setSignature} />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSign}
                disabled={!canSign}
                className={`rounded-full px-5 py-3 text-sm font-semibold text-white transition ${
                  canSign ? "bg-(--brand-accent) hover:bg-(--brand-accent-strong)" : "cursor-not-allowed bg-gray-300"
                }`}
              >
                Ký hợp đồng
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                className="rounded-full border border-(--theme-border) bg-(--theme-surface) px-5 py-3 text-sm font-semibold text-(--theme-text-muted) hover:bg-(--theme-surface-muted)"
              >
                Xuất PDF
              </button>
              {signedAt && <span className="text-xs text-(--theme-text-subtle)">Đã ký: {signedAt}</span>}
            </div>

            {exportError && <div className="text-xs text-red-600">{exportError}</div>}
            {!canSign && (
              <div className="text-xs text-(--theme-text-subtle)">
                Hoàn tất thông tin bắt buộc và ký trước khi xuất PDF.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-(--theme-text)">Tóm tắt hợp đồng</h3>
            <div className="mt-3 space-y-2 text-sm text-(--theme-text-muted)">
              <div>
                <span className="text-(--theme-text-subtle)">Bên A:</span> {form.landlordName || "--"}
              </div>
              <div>
                <span className="text-(--theme-text-subtle)">Bên B:</span> {form.tenantName || "--"}
              </div>
              <div>
                <span className="text-(--theme-text-subtle)">Địa chỉ:</span> {form.propertyAddress || "--"}
              </div>
              <div>
                <span className="text-(--theme-text-subtle)">Giá thuê:</span> {form.rent ? `${form.rent}đ` : "--"}
              </div>
              <div>
                <span className="text-(--theme-text-subtle)">Thời hạn:</span>{" "}
                {form.termStart && form.termEnd ? `${form.termStart} → ${form.termEnd}` : "--"}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-(--theme-border) bg-(--theme-surface) p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-(--theme-text)">Lưu ý pháp lý</h3>
            <ul className="mt-3 space-y-2 text-sm text-(--theme-text-muted)">
              <li>• Hợp đồng điện tử là bản ghi có giá trị tham khảo.</li>
              <li>• Khuyến nghị xác nhận giấy tờ và thông tin hai bên.</li>
              <li>• Lưu PDF để phục vụ đối soát khi cần.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-dashed border-(--theme-border) bg-(--theme-surface) p-5 text-xs text-(--theme-text-muted)">
            Khi xuất PDF, trình duyệt sẽ mở hộp thoại in. Chọn “Save as PDF” để lưu file.
          </div>
        </div>
      </div>
    </UserPageShell>
  );
}
