'use client';

import Link from 'next/link';
import { useCallback, useMemo, type ChangeEvent, type MouseEvent } from 'react';
import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import UserPageShell from '@/app/homepage/components/UserPageShell';
import EditPostModal from './EditPostModal';
import PostCard from './PostCard';
import {
  MY_POSTS_FILTERS,
  type LoadErrorCode,
  type MyPostsFilter,
  useMyPosts,
} from './useMyPosts';

type UserWithToken = Session['user'] & {
  accessToken?: string;
};

const LOAD_ERROR_MESSAGES: Record<Exclude<LoadErrorCode, null>, string> = {
  auth_failed: 'Không thể tải dữ liệu. Vui lòng đăng nhập lại để tiếp tục.',
  load_failed: 'Không thể tải danh sách bài đăng. Vui lòng thử lại.',
  delete_failed: 'Không thể xóa bài đăng. Vui lòng thử lại.',
};

const SKELETON_ITEMS = [0, 1, 2];

export default function MyPostsPage() {
  const { data: session, status } = useSession();

  const accessToken = useMemo(() => {
    const user = session?.user as UserWithToken | undefined;
    return user?.accessToken ?? '';
  }, [session]);

  const {
    posts,
    filteredPosts,
    loading,
    loadError,
    notice,
    dismissNotice,
    statusCounts,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    editingPost,
    editDraft,
    initialEditDraft,
    editError,
    savingId,
    deletingId,
    openEdit,
    closeEdit,
    handleDelete,
    handleSave,
    updateDraftField,
    addImages,
    removeExistingImage,
    removeNewImage,
  } = useMyPosts({
    accessToken,
    sessionStatus: status,
  });

  const handleFilterClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const nextFilter = event.currentTarget.value as MyPostsFilter;
      setActiveFilter(nextFilter);
    },
    [setActiveFilter],
  );

  const handleSearchChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(event.target.value);
    },
    [setSearchQuery],
  );

  const hasNoPosts = !loading && posts.length === 0;
  const hasNoFilteredResults =
    !loading && posts.length > 0 && filteredPosts.length === 0;

  return (
    <UserPageShell
      title="Tin đăng của tôi"
      description="Theo dõi trạng thái duyệt, tối ưu cập nhật và quản lý toàn bộ bài đăng trong một giao diện gọn, rõ ràng."
      actions={
        <Link
          href="/post"
          className="inline-flex items-center rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          Đăng tin mới
        </Link>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Tổng tin" value={posts.length} />
          <SummaryCard label="Chờ duyệt" value={statusCounts.pending} />
          <SummaryCard label="Đã duyệt" value={statusCounts.approved} />
          <SummaryCard label="Từ chối" value={statusCounts.rejected} />
        </section>

        {notice ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <span>{notice}</span>
            <button
              type="button"
              onClick={dismissNotice}
              className="inline-flex items-center rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold transition hover:bg-emerald-100"
            >
              Ẩn thông báo
            </button>
          </div>
        ) : null}

        {statusCounts.rejected > 0 ? (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            Có {statusCounts.rejected} bài đăng đang bị từ chối. Hãy chỉnh sửa
            để gửi lại duyệt.
          </div>
        ) : null}

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Danh sách bài đăng
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {loading
                  ? 'Đang tải dữ liệu bài đăng...'
                  : `Hiển thị ${filteredPosts.length} trên ${posts.length} bài đăng.`}
              </p>
            </div>

            <div className="w-full lg:max-w-sm">
              <label htmlFor="post-search" className="sr-only">
                Tìm theo tiêu đề hoặc địa chỉ
              </label>
              <input
                id="post-search"
                type="search"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Tìm theo tiêu đề hoặc địa chỉ"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:bg-white focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {MY_POSTS_FILTERS.map((filter) => {
              const isActive = activeFilter === filter.value;
              const count =
                filter.value === 'all'
                  ? posts.length
                  : statusCounts[filter.value];

              return (
                <button
                  key={filter.value}
                  type="button"
                  value={filter.value}
                  onClick={handleFilterClick}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{filter.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {loadError ? (
            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {LOAD_ERROR_MESSAGES[loadError]}
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            {loading
              ? SKELETON_ITEMS.map((item) => <PostCardSkeleton key={item} />)
              : null}

            {hasNoPosts ? (
              <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-500">
                Bạn chưa có bài đăng nào.
              </div>
            ) : null}

            {hasNoFilteredResults ? (
              <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-500">
                Không tìm thấy bài đăng phù hợp với bộ lọc hoặc từ khóa hiện
                tại.
              </div>
            ) : null}

            {!loading &&
              filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  isDeleting={deletingId === post.id}
                />
              ))}
          </div>
        </section>
      </div>

      <EditPostModal
        post={editingPost}
        draft={editDraft}
        initialDraft={initialEditDraft}
        isSaving={savingId === editingPost?.id}
        error={editError}
        onClose={closeEdit}
        onSave={handleSave}
        onFieldChange={updateDraftField}
        onAddImages={addImages}
        onRemoveExistingImage={removeExistingImage}
        onRemoveNewImage={removeNewImage}
      />
    </UserPageShell>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
};

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function PostCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        <div className="h-24 w-24 rounded-xl bg-gray-200" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-1/3 rounded-full bg-gray-200" />
          <div className="h-4 w-2/3 rounded-full bg-gray-100" />
          <div className="h-4 w-1/2 rounded-full bg-gray-100" />
          <div className="h-10 w-full rounded-2xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}