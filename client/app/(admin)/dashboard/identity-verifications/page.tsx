'use client';

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSession } from 'next-auth/react';
import SectionCard from '../../components/SectionCard';
import FiltersBar from '../../components/FiltersBar';
import DataTable, { type Column } from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import {
  getAdminIdentityVerifications,
  getAdminIdentityVerificationDocumentPreview,
  reviewAdminIdentityVerification,
  type AdminIdentityVerificationDocumentType,
  type AdminIdentityVerificationRecord,
  type AdminIdentityVerificationStatus,
} from '@/app/services/admin-identity-verifications';

type VerificationStatusFilter = 'all' | AdminIdentityVerificationStatus;
type LoadErrorType = 'auth_failed' | 'forbidden' | 'load_failed' | null;

type VerificationRow = {
  userId: number;
  fullName: string;
  email: string;
  username: string;
  role: string;
  phone: string;
  address: string;
  documentType: string;
  status: AdminIdentityVerificationStatus;
  submittedAt: string;
  submittedAtValue: number;
  verifiedAt: string;
  verifiedAtValue: number;
  frontImageName: string | null;
  backImageName: string | null;
};

const actionButtonBase =
  'inline-flex h-8 min-w-[88px] items-center justify-center rounded-lg border px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60';

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '-';
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toTimestamp = (value?: string | null) => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const normalizeRole = (value?: string | null) =>
  value?.trim().toUpperCase() || 'UNKNOWN';

const formatDocumentType = (
  value?: AdminIdentityVerificationDocumentType | null,
) => {
  if (value === 'driver-license') return 'Driver license';
  if (value === 'national-id') return 'National ID';
  if (value === 'passport') return 'Passport';
  return value || 'Unknown';
};

const formatStatusLabel = (status: AdminIdentityVerificationStatus) => {
  if (status === 'verified') return 'Verified';
  if (status === 'rejected') return 'Rejected';
  return 'Pending';
};

const statusTone = (status: AdminIdentityVerificationStatus) => {
  if (status === 'verified') return 'green' as const;
  if (status === 'rejected') return 'red' as const;
  return 'yellow' as const;
};

const mapRecordToRow = (
  record: AdminIdentityVerificationRecord,
): VerificationRow => {
  const fullName =
    record.user?.profile?.full_name?.trim() ||
    record.user?.username?.trim() ||
    record.user?.email?.trim() ||
    `User #${record.userId}`;

  return {
    userId: record.userId,
    fullName,
    email: record.user?.email?.trim() || '-',
    username: record.user?.username?.trim() || '-',
    role: normalizeRole(record.user?.role?.name),
    phone: record.user?.profile?.phone_number?.trim() || '-',
    address: record.user?.profile?.address?.trim() || '-',
    documentType: formatDocumentType(record.documentType),
    status: record.status,
    submittedAt: formatDateTime(record.submittedAt),
    submittedAtValue: toTimestamp(record.submittedAt),
    verifiedAt: formatDateTime(record.verifiedAt),
    verifiedAtValue: toTimestamp(record.verifiedAt),
    frontImageName: record.frontImageName,
    backImageName: record.backImageName,
  };
};

function DocumentReference({
  label,
  token,
  value,
}: {
  label: string;
  token?: string;
  value?: string | null;
}) {
  const normalizedValue = value?.trim() ?? '';
  const hasValue = Boolean(normalizedValue);
  const previewObjectUrlRef = useRef('');
  const [previewReference, setPreviewReference] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [failureReason, setFailureReason] = useState<
    'auth' | 'invalid' | 'missing' | 'load_failed' | null
  >(null);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = '';
    }

    setPreviewReference('');
    setPreviewUrl('');
    setFailureReason(null);

    if (!normalizedValue) {
      return () => undefined;
    }
    if (!token) {
      setFailureReason('auth');
      return () => undefined;
    }

    let isActive = true;
    void getAdminIdentityVerificationDocumentPreview(normalizedValue, token)
      .then((blob) => {
        if (!isActive) {
          return;
        }

        const nextObjectUrl = URL.createObjectURL(blob);
        previewObjectUrlRef.current = nextObjectUrl;
        setPreviewReference(normalizedValue);
        setPreviewUrl(nextObjectUrl);
      })
      .catch((error) => {
        if (!isActive) {
          return;
        }

        const statusCode =
          typeof error === 'object' && error !== null && 'response' in error
            ? (error as { response?: { status?: number } }).response?.status
            : undefined;

        if (statusCode === 400) {
          setFailureReason('invalid');
          return;
        }
        if (statusCode === 401 || statusCode === 403) {
          setFailureReason('auth');
          return;
        }
        if (statusCode === 404) {
          setFailureReason('missing');
          return;
        }

        setFailureReason('load_failed');
      });

    return () => {
      isActive = false;
    };
  }, [normalizedValue, token]);

  const hasPreview = Boolean(
    previewReference === normalizedValue && previewUrl,
  );
  const previewStatus = !hasValue
    ? 'idle'
    : hasPreview
      ? 'ready'
      : failureReason
        ? 'failed'
        : 'loading';
  const failureMessage =
    failureReason === 'auth'
      ? 'Admin authentication is required to load this protected document.'
      : failureReason === 'invalid'
        ? 'The stored document reference is invalid.'
        : failureReason === 'missing'
          ? 'The stored file was not found in server storage or Cloudinary.'
          : 'The document could not be loaded from the configured storage provider.';

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </div>
      {hasPreview ? (
        <div className="mt-3 space-y-3">
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-xl border border-gray-200 bg-white"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={label}
              className="h-48 w-full object-cover transition-transform duration-200 hover:scale-[1.01]"
            />
          </a>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex text-sm font-medium text-blue-700 underline underline-offset-4"
          >
            Open full image
          </a>
        </div>
      ) : previewStatus === 'loading' ? (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white px-4 py-6 text-center">
          <div className="text-sm font-medium text-gray-700">
            Loading preview...
          </div>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            Fetching the submitted document from protected storage.
          </p>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-white px-4 py-6 text-center">
          <div className="text-sm font-medium text-gray-700">
            {hasValue ? 'Preview unavailable' : 'No document submitted'}
          </div>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {hasValue
              ? failureMessage
              : 'The user has not submitted this side of the document.'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function IdentityVerificationsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<VerificationStatusFilter>('pending');
  const [records, setRecords] = useState<AdminIdentityVerificationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadErrorType>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const { data: session, status: sessionStatus } = useSession();
  const accessToken = session?.user?.accessToken;
  const role = session?.user?.role;
  const normalizedRole =
    typeof role === 'string' ? role.toLowerCase() : undefined;
  const qDeferred = useDeferredValue(q);

  const authError = useMemo(() => {
    if (sessionStatus === 'loading') return null;
    if (!accessToken) return 'auth_failed';
    if (normalizedRole && normalizedRole !== 'admin') return 'forbidden';
    return null;
  }, [accessToken, normalizedRole, sessionStatus]);

  const fetchRecords = useCallback(async () => {
    if (sessionStatus === 'loading') return;
    if (!accessToken) {
      setRecords([]);
      setLoadError('auth_failed');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await getAdminIdentityVerifications(
        accessToken,
        status === 'all' ? undefined : status,
      );
      setRecords(data);
    } catch (err) {
      const statusCode =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;

      if (statusCode === 403) {
        setLoadError('forbidden');
      } else if (statusCode === 401) {
        setLoadError('auth_failed');
      } else {
        console.error('Failed to load identity verifications:', err);
        setLoadError('load_failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, sessionStatus, status]);

  useEffect(() => {
    if (authError) {
      setRecords([]);
      setIsLoading(false);
      return;
    }

    void fetchRecords();
  }, [authError, fetchRecords, refreshKey]);

  const rows = useMemo(
    () =>
      records
        .map(mapRecordToRow)
        .sort((a, b) => b.submittedAtValue - a.submittedAtValue),
    [records],
  );

  const filteredRows = useMemo(() => {
    const term = qDeferred.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) => {
      const haystack = [
        row.fullName,
        row.email,
        row.username,
        row.documentType,
        row.role,
        formatStatusLabel(row.status),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [qDeferred, rows]);

  useEffect(() => {
    const nextSelectedUserId =
      filteredRows.length === 0
        ? null
        : filteredRows.some((row) => row.userId === selectedUserId)
          ? selectedUserId
          : filteredRows[0].userId;

    if (nextSelectedUserId !== selectedUserId) {
      setSelectedUserId(nextSelectedUserId);
    }
  }, [filteredRows, selectedUserId]);

  const selectedRecord = useMemo(
    () =>
      selectedUserId === null
        ? null
        : (records.find((record) => record.userId === selectedUserId) ?? null),
    [records, selectedUserId],
  );

  const selectedRow = useMemo(
    () => (selectedRecord ? mapRecordToRow(selectedRecord) : null),
    [selectedRecord],
  );

  const handleStatusFilterChange = useCallback((value: string) => {
    if (
      value === 'all' ||
      value === 'pending' ||
      value === 'verified' ||
      value === 'rejected'
    ) {
      setStatus(value);
    }
  }, []);

  const handleReview = useCallback(
    async (userId: number, nextStatus: AdminIdentityVerificationStatus) => {
      if (!accessToken) {
        setLoadError('auth_failed');
        return;
      }

      setActionError(null);
      setActionKey(`${userId}:${nextStatus}`);

      try {
        await reviewAdminIdentityVerification(userId, nextStatus, accessToken);
        await fetchRecords();
      } catch (err) {
        console.error('Failed to review identity verification:', err);
        setActionError(
          'Could not update verification status. Please try again.',
        );
      } finally {
        setActionKey(null);
      }
    },
    [accessToken, fetchRecords],
  );

  const columns = useMemo<Column<VerificationRow>[]>(
    () => [
      {
        key: 'fullName',
        header: 'User',
        sortable: true,
        width: '24%',
        render: (row) => (
          <div className="space-y-0.5">
            <div className="font-semibold text-gray-900">{row.fullName}</div>
            <div className="text-xs text-gray-500">{row.email}</div>
          </div>
        ),
        sortValue: (row) => row.fullName,
      },
      {
        key: 'documentType',
        header: 'Document',
        sortable: true,
        width: '16%',
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        width: '12%',
        render: (row) => (
          <StatusBadge
            label={formatStatusLabel(row.status)}
            tone={statusTone(row.status)}
          />
        ),
        sortValue: (row) => row.status,
      },
      {
        key: 'submittedAt',
        header: 'Submitted',
        sortable: true,
        width: '16%',
        sortValue: (row) => row.submittedAtValue,
      },
      {
        key: 'verifiedAt',
        header: 'Reviewed',
        sortable: true,
        width: '16%',
        sortValue: (row) => row.verifiedAtValue,
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        width: '16%',
        render: (row) => (
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void handleReview(row.userId, 'verified');
              }}
              disabled={
                row.status === 'verified' ||
                actionKey === `${row.userId}:verified`
              }
              className={`${actionButtonBase} border-emerald-200 text-emerald-700 hover:bg-emerald-50`}
            >
              {actionKey === `${row.userId}:verified`
                ? 'Approving...'
                : 'Approve'}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void handleReview(row.userId, 'rejected');
              }}
              disabled={
                row.status === 'rejected' ||
                actionKey === `${row.userId}:rejected`
              }
              className={`${actionButtonBase} border-rose-200 text-rose-700 hover:bg-rose-50`}
            >
              {actionKey === `${row.userId}:rejected`
                ? 'Rejecting...'
                : 'Reject'}
            </button>
          </div>
        ),
      },
    ],
    [actionKey, handleReview],
  );

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All status' },
      { value: 'pending', label: 'Pending' },
      { value: 'verified', label: 'Verified' },
      { value: 'rejected', label: 'Rejected' },
    ],
    [],
  );

  const resolvedLoadError = authError ?? loadError;

  const emptyText = isLoading
    ? 'Loading identity verifications...'
    : resolvedLoadError === 'auth_failed'
      ? 'Please sign in again.'
      : resolvedLoadError === 'forbidden'
        ? 'You do not have permission to access this page.'
        : resolvedLoadError === 'load_failed'
          ? 'Failed to load identity verifications.'
          : 'No identity verification records found.';

  return (
    <div className="space-y-6">
      <SectionCard
        title="Identity Verifications"
        subtitle="Review landlord identity submissions from the admin dashboard"
        right={
          <button
            type="button"
            onClick={() => setRefreshKey((prev) => prev + 1)}
            disabled={isLoading || sessionStatus === 'loading'}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reload
          </button>
        }
      >
        <FiltersBar
          q={q}
          onQ={setQ}
          status={status}
          onStatus={handleStatusFilterChange}
          statusOptions={statusOptions}
          placeholder="Search by user, email, document type"
        />
        {resolvedLoadError === 'auth_failed' ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Your session has expired. Please sign in again.
          </div>
        ) : null}
        {resolvedLoadError === 'forbidden' ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            You do not have permission to review identity verifications.
          </div>
        ) : null}
        {resolvedLoadError === 'load_failed' ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Could not load verification records. Use Reload to try again.
          </div>
        ) : null}
        {actionError ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Submission Queue"
        subtitle={`${filteredRows.length} record(s)`}
        contentClassName="p-0"
      >
        <DataTable<VerificationRow>
          rows={filteredRows}
          columns={columns}
          pageSize={8}
          rowKey={(row) => String(row.userId)}
          emptyText={emptyText}
          onRowClick={(row) => setSelectedUserId(row.userId)}
          getRowClassName={(row) =>
            row.userId === selectedUserId ? 'bg-gray-50/80' : ''
          }
        />
      </SectionCard>

      <SectionCard
        title="Submission Details"
        subtitle={
          selectedRow
            ? `User #${selectedRow.userId}`
            : 'Select a submission to inspect details'
        }
        right={
          selectedRow ? (
            <StatusBadge
              label={formatStatusLabel(selectedRow.status)}
              tone={statusTone(selectedRow.status)}
            />
          ) : null
        }
      >
        {!selectedRow ? (
          <div className="text-sm text-gray-500">
            No submission is selected.
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  User Information
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-gray-500">
                      Full name
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {selectedRow.fullName}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-gray-500">
                      Role
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {selectedRow.role}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-gray-500">
                      Email
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      {selectedRow.email}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-gray-500">
                      Username
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      {selectedRow.username}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-gray-500">
                      Phone
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      {selectedRow.phone}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-gray-500">
                      Address
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      {selectedRow.address}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Verification Metadata
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                    <div className="text-[11px] font-semibold uppercase text-gray-500">
                      Document type
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {selectedRow.documentType}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                    <div className="text-[11px] font-semibold uppercase text-gray-500">
                      Status
                    </div>
                    <div className="mt-1">
                      <StatusBadge
                        label={formatStatusLabel(selectedRow.status)}
                        tone={statusTone(selectedRow.status)}
                      />
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                    <div className="text-[11px] font-semibold uppercase text-gray-500">
                      Submitted at
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      {selectedRow.submittedAt}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-3">
                    <div className="text-[11px] font-semibold uppercase text-gray-500">
                      Reviewed at
                    </div>
                    <div className="mt-1 text-sm text-gray-700">
                      {selectedRow.verifiedAt}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Submitted Files
                </div>
                <div className="mt-3 space-y-3">
                  <DocumentReference
                    label="Front document"
                    token={accessToken}
                    value={selectedRow.frontImageName}
                  />
                  <DocumentReference
                    label="Back document"
                    token={accessToken}
                    value={selectedRow.backImageName}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Review Actions
                </div>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void handleReview(selectedRow.userId, 'verified')
                    }
                    disabled={
                      selectedRow.status === 'verified' ||
                      actionKey === `${selectedRow.userId}:verified`
                    }
                    className={`${actionButtonBase} w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50`}
                  >
                    {actionKey === `${selectedRow.userId}:verified`
                      ? 'Approving...'
                      : 'Approve'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void handleReview(selectedRow.userId, 'rejected')
                    }
                    disabled={
                      selectedRow.status === 'rejected' ||
                      actionKey === `${selectedRow.userId}:rejected`
                    }
                    className={`${actionButtonBase} w-full border-rose-200 text-rose-700 hover:bg-rose-50`}
                  >
                    {actionKey === `${selectedRow.userId}:rejected`
                      ? 'Rejecting...'
                      : 'Reject'}
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-gray-500">
                  Legacy submissions will still preview if the original file is
                  present in protected server storage.
                </p>
              </div>
            </aside>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
