/* eslint-disable @next/next/no-img-element */
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  type ChangeEvent,
  type MouseEvent,
} from 'react';
import type { Post } from '@/app/services/posts';
import {
  MAX_POST_IMAGES,
  getEditDraftSignature,
  validateEditDraft,
  type EditDraft,
  type EditableDraftField,
} from './useMyPosts';

type EditPostModalProps = {
  post: Post | null;
  draft: EditDraft | null;
  initialDraft: EditDraft | null;
  isSaving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: () => void;
  onFieldChange: (field: EditableDraftField, value: string) => void;
  onAddImages: (files: FileList | null) => void;
  onRemoveExistingImage: (index: number) => void;
  onRemoveNewImage: (index: number) => void;
};

const EMPTY_VALIDATION = {
  title: null,
  price: null,
};

export default function EditPostModal({
  post,
  draft,
  initialDraft,
  isSaving,
  error,
  onClose,
  onSave,
  onFieldChange,
  onAddImages,
  onRemoveExistingImage,
  onRemoveNewImage,
}: EditPostModalProps) {
  const newImageFiles = draft?.newImages;

  // Create preview URLs only when the selected image set changes.
  const newImagePreviews = useMemo(
    () =>
      (newImageFiles ?? []).map((file, index) => ({
        key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
        url: URL.createObjectURL(file),
      })),
    [newImageFiles],
  );

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [newImagePreviews]);

  useEffect(() => {
    if (!draft) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [draft, onClose]);

  const validation = useMemo(
    () => (draft ? validateEditDraft(draft) : EMPTY_VALIDATION),
    [draft],
  );

  const hasChanges = useMemo(() => {
    if (!draft || !initialDraft) return false;
    return getEditDraftSignature(draft) !== getEditDraftSignature(initialDraft);
  }, [draft, initialDraft]);

  const totalImages = draft
    ? draft.existingImages.length + draft.newImages.length
    : 0;
  const isSaveDisabled =
    isSaving || !hasChanges || Boolean(validation.title || validation.price);

  const handleOverlayMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onAddImages(event.target.files);
      event.target.value = '';
    },
    [onAddImages],
  );

  const handleExistingImageRemove = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const index = Number(event.currentTarget.dataset.index);
      if (!Number.isNaN(index)) {
        onRemoveExistingImage(index);
      }
    },
    [onRemoveExistingImage],
  );

  const handleNewImageRemove = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const index = Number(event.currentTarget.dataset.index);
      if (!Number.isNaN(index)) {
        onRemoveNewImage(index);
      }
    },
    [onRemoveNewImage],
  );

  if (!draft) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={handleOverlayMouseDown}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-linear-to-br from-white via-white to-slate-50 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-post-title"
      >
        <div className="border-b border-slate-100 px-5 py-4 md:px-7 md:py-5">
          <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Cập nhật bài đăng
            </p>
            <h2
              id="edit-post-title"
              className="mt-1 text-2xl font-semibold text-gray-900"
            >
              {post?.title || 'Tin đăng'}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Nếu bài đăng từng bị từ chối, thay đổi mới sẽ được gửi lại để chờ
              duyệt.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50"
            aria-label="Đóng cửa sổ chỉnh sửa"
          >
            <span aria-hidden="true" className="text-lg leading-none">×</span>
          </button>
          </div>
        </div>

        <div className="custom-scrollbar overflow-y-auto px-5 py-5 md:px-7">
          <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="edit-title"
              className="text-sm font-semibold text-gray-700"
            >
              Tiêu đề
            </label>
            <input
              id="edit-title"
              value={draft.title}
              onChange={(event) => onFieldChange('title', event.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-slate-200"
            />
            {validation.title ? (
              <p className="mt-2 text-sm text-rose-600">{validation.title}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="edit-price"
              className="text-sm font-semibold text-gray-700"
            >
              Giá (VND/tháng)
            </label>
            <input
              id="edit-price"
              value={draft.price}
              onChange={(event) => onFieldChange('price', event.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-slate-200"
              inputMode="numeric"
            />
            {validation.price ? (
              <p className="mt-2 text-sm text-rose-600">{validation.price}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="edit-area"
              className="text-sm font-semibold text-gray-700"
            >
              Diện tích (m²)
            </label>
            <input
              id="edit-area"
              value={draft.area}
              onChange={(event) => onFieldChange('area', event.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-slate-200"
              inputMode="numeric"
            />
          </div>

          <div>
            <label
              htmlFor="edit-max-occupancy"
              className="text-sm font-semibold text-gray-700"
            >
              Số người tối đa
            </label>
            <input
              id="edit-max-occupancy"
              value={draft.maxOccupancy}
              onChange={(event) =>
                onFieldChange('maxOccupancy', event.target.value)
              }
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-slate-200"
              inputMode="numeric"
            />
          </div>

          <div>
              <label
                htmlFor="edit-campus"
                className="text-sm font-semibold text-gray-700"
              >
                Cơ sở
              </label>
              <select
                id="edit-campus"
                value={draft.campus}
                onChange={(event) => onFieldChange('campus', event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-slate-200"
              >
                <option value="">Chọn cơ sở</option>
                <option value="CS1">CS1</option>
                <option value="CS2">CS2</option>
                <option value="CS3">CS3</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="edit-availability"
                className="text-sm font-semibold text-gray-700"
              >
                Tình trạng
              </label>
              <select
                id="edit-availability"
                value={draft.availability}
                onChange={(event) =>
                  onFieldChange('availability', event.target.value)
                }
                className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-slate-200"
              >
                <option value="available">Còn trống</option>
                <option value="rented">Đã cho thuê</option>
              </select>
            </div>


          <div className="md:col-span-2">
            <label
              htmlFor="edit-address"
              className="text-sm font-semibold text-gray-700"
            >
              Địa chỉ
            </label>
            <input
              id="edit-address"
              value={draft.address}
              onChange={(event) => onFieldChange('address', event.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>



          <div className="md:col-span-2">
            <label
              htmlFor="edit-video-url"
              className="text-sm font-semibold text-gray-700"
            >
              Video URL
            </label>
            <input
              id="edit-video-url"
              value={draft.videoUrl}
              onChange={(event) => onFieldChange('videoUrl', event.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-slate-200"
              placeholder="https://..."
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="edit-description"
              className="text-sm font-semibold text-gray-700"
            >
              Mô tả
            </label>
            <textarea
              id="edit-description"
              value={draft.description}
              onChange={(event) =>
                onFieldChange('description', event.target.value)
              }
              rows={4}
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-700">Hình ảnh</p>
                <p className="mt-1 text-xs text-gray-500">
                  {totalImages}/{MAX_POST_IMAGES} ảnh
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                Thêm ảnh
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {draft.existingImages.map((imageUrl, index) => (
                <div
                  key={`${imageUrl}-${index}`}
                  className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
                >
                  <img
                    src={imageUrl}
                    alt={`Ảnh hiện tại ${index + 1}`}
                    className="h-36 w-full object-cover"
                  />
                  <button
                    type="button"
                    data-index={index}
                    onClick={handleExistingImageRemove}
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-white"
                    aria-label={`Xóa ảnh hiện tại ${index + 1}`}
                  >
                    <span aria-hidden="true" className="text-base leading-none">×</span>
                  </button>
                </div>
              ))}

              {newImagePreviews.map((preview, index) => (
                <div
                  key={preview.key}
                  className="relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50"
                >
                  <img
                    src={preview.url}
                    alt={`Ảnh mới ${index + 1}`}
                    className="h-36 w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                    Ảnh mới
                  </span>
                  <button
                    type="button"
                    data-index={index}
                    onClick={handleNewImageRemove}
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-white"
                    aria-label={`Xóa ảnh mới ${index + 1}`}
                  >
                    <span aria-hidden="true" className="text-base leading-none">×</span>
                  </button>
                </div>
              ))}

              {totalImages === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 sm:col-span-2 xl:col-span-4">
                  Chưa có ảnh cho bài đăng này.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 text-sm text-rose-600">{error}</div>
        ) : null}
        </div>

        <div className="border-t border-slate-100 bg-white/80 px-5 py-4 md:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            {!hasChanges
              ? 'Chưa có thay đổi để lưu.'
              : 'Các thay đổi sẽ được áp dụng sau khi lưu.'}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaveDisabled}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}