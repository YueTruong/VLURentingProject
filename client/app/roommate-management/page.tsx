"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import UserPageShell from "@/app/_shared/layout/UserPageShell";
import {
  createRoommateRequest,
  deleteRoommateRequest,
  getMyRoommateRequests,
  getRoommateListingOptions,
  updateRoommateTracking,
  type ApprovalStatus,
  type RoommateListingOption,
  type RoommateMode,
  type RoommateRequest,
} from "@/app/services/roommate-management";

const statusBadge: Record<ApprovalStatus, { label: string; tone: string }> = {
  approved: { label: "Đã được quản trị viên duyệt", tone: "bg-green-100 text-green-800" },
  pending: { label: "Chờ quản trị viên duyệt", tone: "bg-yellow-100 text-yellow-800" },
  rejected: { label: "Bị quản trị viên từ chối", tone: "bg-red-100 text-red-700" },
};

const modeLabel: Record<RoommateMode, string> = {
  LANDLORD_ASSIST: "Nhờ chủ trọ hỗ trợ",
  TENANT_SELF: "Người thuê tự đăng",
};

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "--";
  return parsed.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getErrorMessage(error: unknown) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ||
    (error as { message?: string })?.message ||
    "Không thể xử lý yêu cầu lúc này."
  );
}

function getStatusSteps(status: ApprovalStatus) {
  return [
    {
      key: "created",
      label: "Đã gửi",
      active: true,
      complete: true,
      tone: "bg-slate-900",
    },
    {
      key: "review",
      label: "Quản trị viên duyệt",
      active: true,
      complete: status === "approved" || status === "rejected",
      tone:
        status === "rejected"
          ? "bg-red-500"
          : status === "approved"
            ? "bg-green-500"
            : "bg-amber-500",
    },
    {
      key: "result",
      label:
        status === "approved"
          ? "Đã duyệt"
          : status === "rejected"
            ? "Từ chối"
            : "Chờ kết quả",
      active: status !== "pending",
      complete: status !== "pending",
      tone: status === "approved" ? "bg-green-500" : "bg-red-500",
    },
  ];
}

export default function RoommateManagementPage() {
  const { status } = useSession();
  const [listings, setListings] = useState<RoommateListingOption[]>([]);
  const [requests, setRequests] = useState<RoommateRequest[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState<RoommateMode>("TENANT_SELF");
  const [notifyLandlord, setNotifyLandlord] = useState(false);
  const [landlordConsent, setLandlordConsent] = useState(false);
  const [requestedSlots, setRequestedSlots] = useState("1");
  const [currentOccupancy, setCurrentOccupancy] = useState("0");
  const [maxOccupancy, setMaxOccupancy] = useState("1");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const selected = useMemo(
    () => listings.find((item) => String(item.id) === selectedId) ?? null,
    [listings, selectedId],
  );

  const counts = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((item) => item.approvalStatus === "pending")
        .length,
      approved: requests.filter((item) => item.approvalStatus === "approved")
        .length,
    }),
    [requests],
  );

  useEffect(() => {
    if (!selected) return;
    setCurrentOccupancy(String(selected.currentOccupancy ?? 0));
    setMaxOccupancy(String(selected.maxOccupancy ?? 1));
  }, [selected]);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setLoading(false);
      setListings([]);
      setRequests([]);
      return;
    }

    let active = true;

    const loadData = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const [listingOptions, myRequests] = await Promise.all([
          getRoommateListingOptions(),
          getMyRoommateRequests(),
        ]);

        if (!active) return;

        setListings(listingOptions);
        setRequests(myRequests);

        if (listingOptions.length > 0) {
          setSelectedId((current) => current || String(listingOptions[0].id));
        }
      } catch (error) {
        if (!active) return;
        setLoadError(getErrorMessage(error));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [status]);

  const requestedCount = toNumber(requestedSlots);
  const currentCount = toNumber(currentOccupancy);
  const maxCount = toNumber(maxOccupancy);
  const capacityLeft = Math.max(0, maxCount - currentCount);
  const hasCapacity =
    selected !== null &&
    requestedCount > 0 &&
    maxCount > 0 &&
    currentCount >= 0 &&
    currentCount < maxCount &&
    requestedCount <= capacityLeft;
  const canSubmit = Boolean(selected && hasCapacity && !isSubmitting);

  async function handleSubmit() {
    if (!selected || !canSubmit) return;

    setSubmitError(null);
    setSubmitSuccess(null);
    setIsSubmitting(true);

    try {
      const created = await createRoommateRequest({
        listingPostId: selected.id,
        requestedSlots: requestedCount,
        mode,
        currentOccupancy: currentCount,
        maxOccupancy: maxCount,
        notifyLandlord,
        landlordConsent,
      });

      setRequests((current) => [created, ...current]);
      setSubmitSuccess(
        "Đã gửi yêu cầu ở ghép. Quản trị viên sẽ kiểm duyệt trước khi cập nhật trạng thái.",
      );
      setRequestedSlots("1");
      setNotifyLandlord(false);
      setLandlordConsent(false);
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTrackingChange(
    request: RoommateRequest,
    overrides?: Partial<
      Pick<RoommateRequest, "notifyLandlord" | "landlordConsent">
    >,
  ) {
    setBusyId(request.id);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const updated = await updateRoommateTracking(request.id, {
        notifyLandlord:
          overrides?.notifyLandlord ?? request.notifyLandlord,
        landlordConsent:
          overrides?.landlordConsent ?? request.landlordConsent,
      });

      setRequests((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(requestId: number) {
    setBusyId(requestId);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await deleteRoommateRequest(requestId);
      setRequests((current) => current.filter((item) => item.id !== requestId));
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  if (status === "unauthenticated") {
    return (
      <UserPageShell
        title="Quản lý ở ghép"
        description="Đăng nhập để tạo và theo dõi các yêu cầu ở ghép đang chờ quản trị viên duyệt."
        eyebrow="Ở ghép"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
          Bạn cần đăng nhập bằng tài khoản sinh viên để sử dụng tính năng này.
        </div>
      </UserPageShell>
    );
  }

  return (
    <UserPageShell
      title="Quản lý ở ghép"
      description="Liên kết nhu cầu ở ghép với phòng gốc, gửi yêu cầu và theo dõi trạng thái duyệt từ quản trị viên."
      eyebrow="Ở ghép"
      actions={
        <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white">
          {counts.pending} yêu cầu đang chờ
        </span>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Tổng yêu cầu" value={counts.total} />
          <SummaryCard label="Chờ quản trị viên duyệt" value={counts.pending} />
          <SummaryCard label="Đã được duyệt" value={counts.approved} />
        </section>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
          Sinh viên gửi yêu cầu ở ghép trực tiếp lên hệ thống. Quản trị viên sẽ là bên
          xét duyệt, còn bạn chỉ theo dõi trạng thái và cập nhật các mốc đã
          liên hệ chủ trọ nếu cần.
        </div>

        {loadError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        {submitError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

        {submitSuccess ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {submitSuccess}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">
                Liên kết phòng trọ gốc
              </div>
              <select
                value={selectedId}
                onChange={(event) => {
                  setSelectedId(event.target.value);
                  setSubmitError(null);
                  setSubmitSuccess(null);
                }}
                className="mt-3 h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm text-gray-800"
                disabled={loading || listings.length === 0}
              >
                {listings.length === 0 ? (
                  <option value="">Chưa có phòng khả dụng</option>
                ) : null}
                {listings.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.title}
                  </option>
                ))}
              </select>

              {selected ? (
                <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs text-gray-600">
                  <div className="font-semibold text-gray-800">
                    {selected.title}
                  </div>
                  <div className="mt-1">{selected.address}</div>
                  <div className="mt-1">
                    Chủ trọ: {selected.landlordName ?? "Chưa cập nhật"}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">
                Tình trạng chỗ ở hiện tại
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-gray-600">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Đang ở
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={currentOccupancy}
                    onChange={(event) =>
                      setCurrentOccupancy(event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-800"
                  />
                </label>

                <label className="text-sm text-gray-600">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tối đa
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={maxOccupancy}
                    onChange={(event) => setMaxOccupancy(event.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-800"
                  />
                </label>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Chỗ trống còn lại:{" "}
                <span className="font-semibold text-gray-700">
                  {capacityLeft}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">
                Hình thức đăng
              </div>
              <div className="mt-3 grid gap-2">
                {(
                  [
                    {
                      value: "LANDLORD_ASSIST",
                      label: "Nhờ chủ trọ hỗ trợ đăng",
                    },
                    {
                      value: "TENANT_SELF",
                      label: "Người thuê tự đăng và tự theo dõi xác nhận",
                    },
                  ] as Array<{ value: RoommateMode; label: string }>
                ).map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMode(item.value)}
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
              <div className="text-sm font-semibold text-gray-900">
                Số người cần thêm
              </div>
              <input
                type="number"
                min={1}
                value={requestedSlots}
                onChange={(event) => setRequestedSlots(event.target.value)}
                className="mt-3 h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-800"
              />

              {!hasCapacity ? (
                <div className="mt-2 text-xs text-red-600">
                  Số người cần thêm vượt quá chỗ trống còn lại hoặc dữ liệu sức
                  chứa chưa hợp lệ.
                </div>
              ) : null}
            </div>

            {mode === "TENANT_SELF" ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">
                Thông tin theo dõi liên hệ
              </div>
                <div className="mt-3 space-y-2 text-sm text-gray-600">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900"
                      checked={notifyLandlord}
                      onChange={(event) =>
                        setNotifyLandlord(event.target.checked)
                      }
                    />
                    <span>Đã thông báo nhu cầu ở ghép cho chủ trọ.</span>
                  </label>
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900"
                      checked={landlordConsent}
                      onChange={(event) =>
                        setLandlordConsent(event.target.checked)
                      }
                    />
                    <span>Đã nhận được sự đồng ý của chủ trọ.</span>
                  </label>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Hai mốc này chỉ để quản trị viên có thêm ngữ cảnh khi duyệt yêu cầu
                  của bạn.
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
                Hệ thống sẽ lưu yêu cầu để bạn theo dõi, đồng thời gửi thông báo
                đến chủ trọ nếu phòng gốc có thông tin người đăng.
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={!canSubmit}
              className={`w-full rounded-full px-5 py-3 text-sm font-semibold transition ${
                canSubmit
                  ? "bg-[#D51F35] text-white hover:bg-[#b01628]"
                  : "cursor-not-allowed bg-gray-200 text-gray-500"
              }`}
            >
              {isSubmitting ? "Đang lưu..." : "Tạo yêu cầu ở ghép"}
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">
                Yêu cầu đã tạo
              </div>

              {loading ? (
                <div className="mt-4 text-sm text-gray-500">
                  Đang tải dữ liệu ở ghép...
                </div>
              ) : requests.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                  Chưa có yêu cầu nào được tạo.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {requests.map((request) => {
                    const isBusy = busyId === request.id;
                    return (
                      <div
                        key={request.id}
                        className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {request.title}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Phòng gốc: {request.listingTitle}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {request.listingAddress}
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge[request.approvalStatus].tone}`}
                          >
                            {statusBadge[request.approvalStatus].label}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                          <span>Hình thức: {modeLabel[request.mode]}</span>
                          <span>Yêu cầu thêm: {request.requestedSlots} người</span>
                          <span>
                            Sức chứa: {request.currentOccupancy}/
                            {request.maxOccupancy}
                          </span>
                          <span>Tạo ngày {formatDate(request.createdAt)}</span>
                        </div>

                        {request.mode === "TENANT_SELF" ? (
                          <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={request.notifyLandlord}
                                disabled={isBusy}
                                onChange={(event) =>
                                  void handleTrackingChange(request, {
                                    notifyLandlord: event.target.checked,
                                  })
                                }
                              />
                              <span>Đã thông báo chủ trọ</span>
                            </label>

                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={request.landlordConsent}
                                disabled={isBusy}
                                onChange={(event) =>
                                  void handleTrackingChange(request, {
                                    landlordConsent: event.target.checked,
                                  })
                                }
                              />
                              <span>Đã có đồng ý của chủ trọ</span>
                            </label>
                          </div>
                        ) : null}

                        <div className="mt-4 space-y-3">
                          <RoommateStatusBar status={request.approvalStatus} />

                          <div className="flex flex-wrap gap-2">
                          {request.approvalStatus === "approved" &&
                          request.publicPostId ? (
                            <Link
                              href={`/listings/${request.publicPostId}`}
                              className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                            >
                              Xem tin công khai
                            </Link>
                          ) : null}
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleDelete(request.id)}
                            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Xóa yêu cầu
                          </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-xs text-gray-600">
              Trạng thái ở ghép giờ được duyệt tập trung bởi quản trị viên. Trang này chỉ
              còn nhiệm vụ gửi yêu cầu, theo dõi và cập nhật các mốc liên hệ,
              thay vì cho sinh viên tự xác nhận như trước. Khi yêu cầu được duyệt,
              hệ thống sẽ tự đưa bài đăng lên mục tin đăng công khai.
            </div>
          </div>
        </div>
      </div>
    </UserPageShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function RoommateStatusBar({ status }: { status: ApprovalStatus }) {
  const steps = getStatusSteps(status);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-3 py-3">
      <div className="flex items-center">
        {steps.map((step, index) => (
          <div key={step.key} className="flex min-w-0 flex-1 items-center">
            <div className="min-w-0">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  step.active ? step.tone : "bg-gray-300"
                }`}
              />
              <div
                className={`mt-2 text-[11px] font-semibold ${
                  step.active ? "text-gray-800" : "text-gray-400"
                }`}
              >
                {step.label}
              </div>
            </div>
            {index < steps.length - 1 ? (
              <div className="mx-2 h-1 flex-1 rounded-full bg-gray-200">
                <div
                  className={`h-1 rounded-full transition-all ${
                    step.complete ? `w-full ${step.tone}` : "w-0 bg-gray-200"
                  }`}
                />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
