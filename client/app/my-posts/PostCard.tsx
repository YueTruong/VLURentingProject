'use client';

import Image from 'next/image';
import { useCallback } from 'react';
import type { Post } from '@/app/services/posts';
import { formatDate, formatPriceVnd, getStatusMeta } from './useMyPosts';

type PostCardProps = {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
};

export default function PostCard({
  post,
  onEdit,
  onDelete,
  isDeleting,
}: PostCardProps) {
  const thumbnailSrc =
    post.images?.find((image) => Boolean(image.image_url))?.image_url ?? null;
  const statusMeta = getStatusMeta(post.status);

  const handleEditClick = useCallback(() => {
    onEdit(post);
  }, [onEdit, post]);

  const handleDeleteClick = useCallback(() => {
    onDelete(post.id);
  }, [onDelete, post.id]);

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
            {thumbnailSrc ? (
              <Image
                src={thumbnailSrc}
                alt={post.title || 'Ảnh bài đăng'}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-3 text-center text-xs font-medium text-gray-500">
                Không có ảnh
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold text-gray-900">
              {post.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {post.address || 'Chưa cập nhật địa chỉ'}
            </p>

            <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
              <span>Giá: {formatPriceVnd(post.price)}</span>
              <span>Diện tích: {post.area ?? '--'} m²</span>
              <span>Ngày tạo: {formatDate(post.createdAt)}</span>
            </div>

            {post.description ? (
              <p className="mt-3 text-sm leading-6 text-gray-500">
                {post.description}
              </p>
            ) : null}

            {(post.status ?? '').toLowerCase() === 'rejected' ? (
              <div
                className={`mt-3 rounded-xl border px-3 py-2 text-sm ${statusMeta.panelClassName}`}
              >
                <span className="font-semibold">Lý do từ chối:</span>{' '}
                {post.rejectionReason || 'Chưa có lý do cụ thể.'}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 xl:items-end">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.badgeClassName}`}
          >
            {statusMeta.label}
          </span>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleEditClick}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Chỉnh sửa
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
