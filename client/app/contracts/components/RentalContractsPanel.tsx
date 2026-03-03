"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  RENTAL_CONTRACTS_EVENT,
  getRentalContractSortTimestamp,
  getRentalContractStatus,
  readRentalContractsFromStorage,
  type RentalContractRecord,
} from "@/app/services/rental-contracts";

type UserRole = "admin" | "landlord" | "student";

type SessionUser = {
  name?: string | null;
  email?: string | null;
  full_name?: string | null;
};

const statusBadge = {
  pending_tenant_signature: {
    label: "Chờ ký",
    tone: "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-200",
  },
  fully_signed: {
    label: "Đã ký",
    tone: "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200",
  },
} as const;

function getDisplayName(user: SessionUser) {
  const preferredName = user.full_name || user.name || "";
  if (preferredName.trim()) return preferredName;
  if (user.email?.trim()) return user.email.split("@")[0] || "Người dùng";
  return "Người dùng";
}

function normalizeText(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
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

function parseCurrency(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

function formatCurrency(value: string) {
  const amount = parseCurrency(value);
  return amount ? `${amount.toLocaleString("vi-VN")}đ` : "--";
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

export default function RentalContractsPanel({ roleView }: { roleView: UserRole }) {
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

  const [contracts, setContracts] = useState<RentalContractRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");

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

  const visibleContracts = useMemo(() => {
    return contracts
      .filter((contract) => canViewContract(contract, roleView, displayName, userEmail))
      .sort((left, right) => {
        const leftTime = new Date(getRentalContractSortTimestamp(left)).getTime();
        const rightTime = new Date(getRentalContractSortTimestamp(right)).getTime();
        return rightTime - leftTime;
      });
  }, [contracts, displayName, roleView, userEmail]);

  const activeSelectedId = useMemo(() => {
    if (visibleContracts.length === 0) return "";
    return visibleContracts.some((contract) => contract.id === selectedId) ? selectedId : visibleContracts[0].id;
  }, [selectedId, visibleContracts]);

  const selectedContract = useMemo(
    () => visibleContracts.find((contract) => contract.id === activeSelectedId) ?? visibleContracts[0],
    [activeSelectedId, visibleContracts],
  );

  const pendingContractsCount = useMemo(
    () => visibleContracts.filter((contract) => getRentalContractStatus(contract) === "pending_tenant_signature").length,
    [visibleContracts],
  );
  const completedContractsCount = visibleContracts.length - pendingContractsCount;
  const totalDeposit = useMemo(
    () => visibleContracts.reduce((sum, contract) => sum + parseCurrency(contract.deposit), 0),
    [visibleContracts],
  );
  const latestUpdatedAt = visibleContracts[0] ? getRentalContractSortTimestamp(visibleContracts[0]) : undefined;
  const isLandlord = roleView === "landlord";
  const isStudent = roleView === "student";

  const overviewCards = [
    {
      label: isStudent ? "Hợp đồng của tôi" : "Tổng hợp hợp đồng",
      value: visibleContracts.length,
      hint: latestUpdatedAt ? `Cập nhật ${formatDateTime(latestUpdatedAt)}` : "Chưa có dữ liệu",
    },
    {
      label: "Đang chờ ký",
      value: pendingContractsCount,
      hint: isStudent ? "Những hợp đồng bạn cần xử lý" : "Đang chờ người thuê xác nhận",
    },
    {
      label: "Đã hoàn tất",
      value: completedContractsCount,
      hint: "Các hợp đồng đã đủ chữ ký hai bên",
    },
    {
      label: "Tổng tiền cọc",
      value: `${totalDeposit.toLocaleString("vi-VN")}đ`,
      hint: "Tổng tiền cọc của các hợp đồng đang hiển thị",
    },
  ];

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[32px] border border-rose-100 bg-[linear-gradient(135deg,#fff8f8_0%,#ffffff_62%,#fffaf7_100%)] shadow-[0_24px_70px_-40px_rgba(159,18,57,0.28)]">
        <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[minmax(0,1.35fr)_320px] lg:items-start">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="inline-flex rounded-full border border-rose-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-rose-700">
                  Trung tâm hợp đồng
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-gray-950 sm:text-[30px]">
                  {isStudent ? "Theo dõi và ký hợp đồng trên một giao diện gọn hơn." : "Quản lý hợp đồng thuê theo một luồng rõ ràng."}
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">
                  {isStudent
                    ? "Danh sách chờ ký, chi tiết hợp đồng và phần ký xác nhận được giữ trong cùng một màn hình."
                    : "Xem nhanh danh sách, mở chi tiết và chuyển sang khu tạo hoặc gửi hợp đồng mà không phải đi qua nhiều bước thừa."}
                </p>
              </div>

              {isLandlord ? (
                <Link
                  href="/contracts#rental-contract-workspace"
                  className="inline-flex items-center rounded-full bg-[#9f1239] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#881337]"
                >
                  Tạo hợp đồng mới
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-rose-800 bg-[#881337] p-5 text-white shadow-[0_20px_50px_-36px_rgba(136,19,55,0.7)]">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">
              {isStudent ? "Tổng quan của bạn" : "Nhịp xử lý"}
            </div>
            <div className="mt-4 text-3xl font-semibold">{visibleContracts.length}</div>
            <div className="mt-2 text-sm leading-6 text-white/70">
              {isStudent
                ? "Chọn một hợp đồng bên dưới để mở chi tiết và ký."
                : "Danh sách đang hiển thị theo cập nhật mới nhất để theo dõi tiến độ."}
            </div>
            <div className="mt-6 grid gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-white/60">Chờ ký</div>
                <div className="mt-2 text-2xl font-semibold">{pendingContractsCount}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-white/60">Đã hoàn tất</div>
                <div className="mt-2 text-2xl font-semibold">{completedContractsCount}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/70 bg-white/60 px-6 py-5 sm:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((item) => (
            <div
              key={item.label}
              className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.16)]"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{item.label}</div>
              <div className="mt-3 text-2xl font-semibold text-gray-950">{item.value}</div>
              <div className="mt-2 text-sm leading-6 text-gray-600">{item.hint}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-[0_20px_48px_-36px_rgba(15,23,42,0.35)]">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-gray-950">Danh sách hợp đồng</div>
              </div>
              <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">{visibleContracts.length} mục</div>
            </div>
            <div className="mt-3 text-sm leading-6 text-gray-600">
              {isStudent
                ? "Hợp đồng chờ ký được đưa lên đầu danh sách để bạn xử lý trước."
                : "Chọn một hợp đồng để xem nhanh thông tin thuê, trạng thái và chữ ký hai bên."}
            </div>
          </div>

          <div className="space-y-3">
            {visibleContracts.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-gray-300 bg-white p-8 text-center text-sm leading-6 text-gray-500 shadow-sm">
                {isStudent
                  ? "Chưa có hợp đồng nào được giao cho bạn."
                  : "Chưa có hợp đồng nào. Tạo hợp đồng mới ở khu thao tác bên dưới để bắt đầu."}
              </div>
            ) : null}

            {visibleContracts.map((contract) => {
              const isSelected = contract.id === activeSelectedId;
              const currentStatus = getRentalContractStatus(contract);

              return (
                <button
                  key={contract.id}
                  type="button"
                  onClick={() => setSelectedId(contract.id)}
                  className={`w-full rounded-[28px] border p-4 text-left transition ${
                    isSelected
                      ? "border-rose-200 bg-[linear-gradient(145deg,#fff1f2_0%,#ffffff_55%,#fff7ed_100%)] shadow-[0_20px_45px_-32px_rgba(190,24,93,0.5)]"
                      : "border-gray-200 bg-white hover:border-rose-100 hover:shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-950">{contract.propertyAddress}</div>
                      <div className="mt-1 text-xs font-medium text-gray-500">Mã hợp đồng: {contract.id}</div>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${statusBadge[currentStatus].tone}`}>
                      {statusBadge[currentStatus].label}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs text-gray-600">
                    <div>{isStudent ? `Chủ trọ: ${contract.landlordName}` : `Người thuê: ${contract.tenantName}`}</div>
                    <div>{currentStatus === "fully_signed" ? `Hoàn tất lúc ${formatDateTime(contract.signedAt)}` : `Đã gửi ${formatDateTime(contract.sentAt || contract.createdAt)}`}</div>
                    <div>Giá thuê: {formatCurrency(contract.rent)}</div>
                  </div>

                  {isSelected ? (
                    <div className="mt-4 inline-flex items-center rounded-full bg-[#9f1239] px-3 py-1 text-[11px] font-semibold text-white">
                      Đang xem chi tiết
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {!selectedContract ? (
          <div className="rounded-[32px] border border-dashed border-gray-300 bg-white p-10 text-center text-sm leading-6 text-gray-500 shadow-sm">
            Chọn một hợp đồng ở cột bên trái để xem chi tiết theo từng phần.
          </div>
        ) : (
          <div className="space-y-5">
            <div className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.4)]">
              <div className="border-b border-gray-100 bg-[linear-gradient(135deg,#fffaf0_0%,#ffffff_60%,#f5fff9_100%)] px-6 py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <h3 className="text-2xl font-semibold tracking-tight text-gray-950">{selectedContract.propertyAddress}</h3>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span>Mã hợp đồng: {selectedContract.id}</span>
                      <span className="h-1 w-1 rounded-full bg-gray-300" />
                      <span>{formatDate(selectedContract.termStart)} - {formatDate(selectedContract.termEnd)}</span>
                      <span className="h-1 w-1 rounded-full bg-gray-300" />
                      <span>{getRentalContractStatus(selectedContract) === "fully_signed" ? "Đã đủ chữ ký" : "Đang chờ hoàn tất"}</span>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge[getRentalContractStatus(selectedContract)].tone}`}>
                    {statusBadge[getRentalContractStatus(selectedContract)].label}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white bg-white/90 p-4">
                    <div className="text-xs text-gray-500">Chủ trọ</div>
                    <div className="mt-2 text-sm font-semibold text-gray-950">{selectedContract.landlordName}</div>
                  </div>
                  <div className="rounded-2xl border border-white bg-white/90 p-4">
                    <div className="text-xs text-gray-500">Người thuê</div>
                    <div className="mt-2 text-sm font-semibold text-gray-950">{selectedContract.tenantName}</div>
                  </div>
                  <div className="rounded-2xl border border-white bg-white/90 p-4">
                    <div className="text-xs text-gray-500">Giá thuê</div>
                    <div className="mt-2 text-sm font-semibold text-gray-950">{formatCurrency(selectedContract.rent)}</div>
                  </div>
                  <div className="rounded-2xl border border-white bg-white/90 p-4">
                    <div className="text-xs text-gray-500">Tiền cọc</div>
                    <div className="mt-2 text-sm font-semibold text-gray-950">{formatCurrency(selectedContract.deposit)}</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1.2fr)_320px]">
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-[24px] border border-gray-200 bg-[#fffdf8] p-5">
                      <div className="text-sm font-semibold text-gray-950">Thông tin chủ trọ</div>
                      <div className="mt-4 space-y-3 text-sm text-gray-700">
                        <div><span className="text-gray-500">CCCD/CMND:</span> {selectedContract.landlordId || "--"}</div>
                        <div><span className="text-gray-500">Số điện thoại:</span> {selectedContract.landlordPhone || "--"}</div>
                        <div><span className="text-gray-500">Địa chỉ:</span> {selectedContract.landlordAddress || "--"}</div>
                        <div><span className="text-gray-500">Email:</span> {selectedContract.landlordEmail || "--"}</div>
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-gray-200 bg-[#f8fffb] p-5">
                      <div className="text-sm font-semibold text-gray-950">Thông tin người thuê</div>
                      <div className="mt-4 space-y-3 text-sm text-gray-700">
                        <div><span className="text-gray-500">CCCD/CMND:</span> {selectedContract.tenantId || "--"}</div>
                        <div><span className="text-gray-500">Số điện thoại:</span> {selectedContract.tenantPhone || "--"}</div>
                        <div><span className="text-gray-500">Địa chỉ:</span> {selectedContract.tenantAddress || "--"}</div>
                        <div><span className="text-gray-500">Email:</span> {selectedContract.tenantEmail || "--"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                    <div className="text-sm font-semibold text-gray-950">Điều khoản và lịch thanh toán</div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl bg-gray-50 p-4">
                        <div className="text-xs text-gray-500">Ngày thanh toán</div>
                        <div className="mt-2 text-sm font-semibold text-gray-950">{selectedContract.paymentDay || "--"}</div>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-4">
                        <div className="text-xs text-gray-500">Ngày gửi</div>
                        <div className="mt-2 text-sm font-semibold text-gray-950">{formatDateTime(selectedContract.sentAt || selectedContract.createdAt)}</div>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-4">
                        <div className="text-xs text-gray-500">{getRentalContractStatus(selectedContract) === "fully_signed" ? "Ngày hoàn tất" : "Tình trạng hiện tại"}</div>
                        <div className="mt-2 text-sm font-semibold text-gray-950">
                          {getRentalContractStatus(selectedContract) === "fully_signed"
                            ? formatDateTime(selectedContract.signedAt)
                            : "Đang chờ người thuê ký"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[22px] border border-dashed border-gray-200 bg-[#fcfcfc] p-4 text-sm leading-7 text-gray-700">
                      {selectedContract.extraTerms || "Không có điều khoản bổ sung."}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-rose-800 bg-[#881337] p-5 text-white">
                    <div className="text-lg font-semibold">Trạng thái ký</div>
                    <div className="mt-2 text-sm leading-6 text-white/70">
                      {getRentalContractStatus(selectedContract) === "fully_signed"
                        ? "Hợp đồng đã đủ chữ ký của hai bên và sẵn sàng để đối chiếu hoặc in PDF."
                        : "Hợp đồng đã được gửi, đang chờ người thuê xác nhận và ký hoàn tất."}
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                    <div className="text-sm font-semibold text-gray-950">Chữ ký chủ trọ</div>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <div className="relative h-24 w-52 overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gray-50">
                        {selectedContract.landlordSignatureDataUrl ? (
                          <Image
                            src={selectedContract.landlordSignatureDataUrl}
                            alt="Landlord signature"
                            fill
                            unoptimized
                            sizes="208px"
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">Chưa có chữ ký</div>
                        )}
                      </div>

                      <div className="text-sm text-gray-700">
                        <div className="font-semibold text-gray-950">{selectedContract.landlordSignatureName || selectedContract.landlordName || "--"}</div>
                        <div className="mt-1 text-gray-500">Ký lúc {formatDateTime(selectedContract.landlordSignedAt || selectedContract.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-gray-200 bg-white p-5">
                    <div className="text-sm font-semibold text-gray-950">Chữ ký người thuê</div>
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <div className="relative h-24 w-52 overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gray-50">
                        {selectedContract.tenantSignatureDataUrl ? (
                          <Image
                            src={selectedContract.tenantSignatureDataUrl}
                            alt="Tenant signature"
                            fill
                            unoptimized
                            sizes="208px"
                            className="object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">Chưa có chữ ký</div>
                        )}
                      </div>

                      <div className="text-sm text-gray-700">
                        <div className="font-semibold text-gray-950">{selectedContract.tenantSignatureName || selectedContract.tenantName || "--"}</div>
                        <div className="mt-1 text-gray-500">
                          {selectedContract.tenantSignedAt ? `Ký lúc ${formatDateTime(selectedContract.tenantSignedAt)}` : "Đang chờ người thuê ký"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
