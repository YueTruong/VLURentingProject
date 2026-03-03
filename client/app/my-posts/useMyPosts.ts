'use client';

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  deletePost,
  getMyPosts,
  updatePost,
  uploadImages,
  type Post,
  type UpdatePostPayload,
} from '@/app/services/posts';

export const MAX_POST_IMAGES = 10;

export type MyPostsFilter =
  | 'all'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'rented'
  | 'hidden';
export type LoadErrorCode =
  | 'auth_failed'
  | 'load_failed'
  | 'delete_failed'
  | null;
export type SessionStatus = 'authenticated' | 'loading' | 'unauthenticated';
export type EditableDraftField =
  | 'title'
  | 'price'
  | 'area'
  | 'address'
  | 'description'
  | 'maxOccupancy'
  | 'campus'
  | 'availability'
  | 'videoUrl';

export type EditDraft = {
  title: string;
  price: string;
  area: string;
  address: string;
  description: string;
  maxOccupancy: string;
  campus: string;
  availability: string;
  videoUrl: string;
  existingImages: string[];
  newImages: File[];
  imagesTouched: boolean;
};

export type DraftValidationErrors = {
  title: string | null;
  price: string | null;
};

export type StatusMeta = {
  label: string;
  badgeClassName: string;
  panelClassName: string;
};

type UseMyPostsOptions = {
  accessToken: string;
  sessionStatus: SessionStatus;
};

type UpdatePostResult = {
  data?: unknown;
};

const DEFAULT_STATUS_COUNTS: Record<MyPostsFilter, number> = {
  all: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  rented: 0,
  hidden: 0,
};

export const MY_POSTS_FILTERS: Array<{ value: MyPostsFilter; label: string }> =
  [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ duyệt' },
    { value: 'approved', label: 'Đã duyệt' },
    { value: 'rejected', label: 'Từ chối' },
    { value: 'rented', label: 'Đã cho thuê' },
    { value: 'hidden', label: 'Ẩn' },
  ];

const normalizeStatus = (status?: string): Exclude<MyPostsFilter, 'all'> => {
  const normalized = (status ?? 'pending').toLowerCase();

  if (
    normalized === 'pending' ||
    normalized === 'approved' ||
    normalized === 'rejected' ||
    normalized === 'rented' ||
    normalized === 'hidden'
  ) {
    return normalized;
  }

  return 'pending';
};

const cloneDraft = (draft: EditDraft): EditDraft => ({
  ...draft,
  existingImages: [...draft.existingImages],
  newImages: [...draft.newImages],
});

const getImageUrls = (post: Post): string[] =>
  (post.images ?? []).map((image) => image.image_url ?? '').filter(Boolean);

const buildEditDraft = (post: Post): EditDraft => ({
  title: post.title ?? '',
  price:
    post.price !== undefined && post.price !== null ? String(post.price) : '',
  area: post.area !== undefined && post.area !== null ? String(post.area) : '',
  address: post.address ?? '',
  description: post.description ?? '',
  maxOccupancy:
    post.max_occupancy !== undefined && post.max_occupancy !== null
      ? String(post.max_occupancy)
      : '',
      campus: post.campus ?? '',
  availability: post.availability ?? 'available',
  videoUrl: post.videoUrl ?? '',
  existingImages: getImageUrls(post),
  newImages: [],
  imagesTouched: false,
});

const parseNumberInput = (value: string): number | undefined => {
  const cleaned = value.replace(/[^\d.]/g, '').trim();
  if (!cleaned) return undefined;

  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const fileSignature = (file: File) =>
  `${file.name}:${file.size}:${file.lastModified}:${file.type}`;

export const getEditDraftSignature = (draft: EditDraft): string =>
  JSON.stringify({
    title: draft.title.trim(),
    price: draft.price.trim(),
    area: draft.area.trim(),
    address: draft.address.trim(),
    description: draft.description.trim(),
    maxOccupancy: draft.maxOccupancy.trim(),
    campus: draft.campus.trim(),
    availability: draft.availability.trim(),
    videoUrl: draft.videoUrl.trim(),
    existingImages: draft.existingImages,
    newImages: draft.newImages.map(fileSignature),
  });

export const validateEditDraft = (draft: EditDraft): DraftValidationErrors => {
  const title = draft.title.trim() ? null : 'Tiêu đề không được để trống.';
  const priceValue = parseNumberInput(draft.price);
  const price =
    priceValue !== undefined && priceValue > 0
      ? null
      : 'Giá phải là số lớn hơn 0.';

  return { title, price };
};

export const formatPriceVnd = (value: number | string | undefined): string => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '--';

  return `${numeric.toLocaleString('vi-VN')} đ`;
};

export const formatDate = (value?: string): string => {
  if (!value) return '--';

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '--';

  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const getStatusMeta = (status?: string): StatusMeta => {
  switch (normalizeStatus(status)) {
    case 'approved':
      return {
        label: 'Đã duyệt',
        badgeClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        panelClassName: 'border-emerald-100 bg-emerald-50 text-emerald-700',
      };
    case 'rejected':
      return {
        label: 'Từ chối',
        badgeClassName: 'border-rose-200 bg-rose-50 text-rose-700',
        panelClassName: 'border-rose-100 bg-rose-50 text-rose-700',
      };
    case 'rented':
      return {
        label: 'Đã cho thuê',
        badgeClassName: 'border-indigo-200 bg-indigo-50 text-indigo-700',
        panelClassName: 'border-indigo-100 bg-indigo-50 text-indigo-700',
      };
    case 'hidden':
      return {
        label: 'Ẩn',
        badgeClassName: 'border-gray-200 bg-gray-100 text-gray-700',
        panelClassName: 'border-gray-200 bg-gray-50 text-gray-700',
      };
    case 'pending':
    default:
      return {
        label: 'Chờ duyệt',
        badgeClassName: 'border-amber-200 bg-amber-50 text-amber-700',
        panelClassName: 'border-amber-100 bg-amber-50 text-amber-700',
      };
  }
};

const isPost = (value: unknown): value is Post => {
  if (typeof value !== 'object' || value === null) return false;

  return 'id' in value && typeof value.id === 'number';
};

const resolveUpdatedPost = (value: unknown): Post | null => {
  if (isPost(value)) return value;

  if (typeof value === 'object' && value !== null && 'data' in value) {
    const nestedValue = (value as UpdatePostResult).data;
    if (isPost(nestedValue)) return nestedValue;
  }

  return null;
};

const mergeUpdatedPost = (
  currentPost: Post,
  payload: UpdatePostPayload,
  updatedPost: Post | null,
  wasRejected: boolean,
): Post => {
  const mergedImages =
    payload.imageUrls !== undefined
      ? payload.imageUrls.map((imageUrl) => ({ image_url: imageUrl }))
      : (updatedPost?.images ?? currentPost.images);

  return {
    ...currentPost,
    ...updatedPost,
    images: mergedImages,
    status: wasRejected
      ? 'pending'
      : (updatedPost?.status ?? currentPost.status),
    rejectionReason: wasRejected
      ? null
      : (updatedPost?.rejectionReason ?? currentPost.rejectionReason),
    resubmittedAt: wasRejected
      ? new Date().toISOString()
      : (updatedPost?.resubmittedAt ?? currentPost.resubmittedAt),
  };
};

export function useMyPosts({ accessToken, sessionStatus }: UseMyPostsOptions) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadErrorCode>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<MyPostsFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [initialEditDraft, setInitialEditDraft] = useState<EditDraft | null>(
    null,
  );
  const [editError, setEditError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (sessionStatus === 'loading') return;

    if (!accessToken) {
      setPosts([]);
      setLoadError('auth_failed');
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setLoadError(null);

    getMyPosts(accessToken)
      .then((data) => {
        if (!active) return;
        setPosts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!active) return;
        setLoadError('load_failed');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, sessionStatus]);

  const editingPost = useMemo(
    () => posts.find((post) => post.id === editingId) ?? null,
    [posts, editingId],
  );

  const filteredPosts = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const normalizedStatus = normalizeStatus(post.status);
      const matchesFilter =
        activeFilter === 'all' || normalizedStatus === activeFilter;

      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;

      const searchableText = [post.title, post.address]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [activeFilter, deferredSearchQuery, posts]);

  const statusCounts = useMemo(() => {
    const nextCounts = { ...DEFAULT_STATUS_COUNTS, all: posts.length };

    posts.forEach((post) => {
      const status = normalizeStatus(post.status);
      nextCounts[status] += 1;
    });

    return nextCounts;
  }, [posts]);

  const dismissNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const openEdit = useCallback((post: Post) => {
    const nextDraft = buildEditDraft(post);
    setEditingId(post.id);
    setInitialEditDraft(cloneDraft(nextDraft));
    setEditDraft(cloneDraft(nextDraft));
    setEditError(null);
  }, []);

  const closeEdit = useCallback(() => {
    setEditingId(null);
    setEditDraft(null);
    setInitialEditDraft(null);
    setEditError(null);
  }, []);

  const updateDraftField = useCallback(
    (field: EditableDraftField, value: string) => {
      setEditDraft((previousDraft) => {
        if (!previousDraft) return previousDraft;

        switch (field) {
          case 'title':
            return { ...previousDraft, title: value };
          case 'price':
            return { ...previousDraft, price: value };
          case 'area':
            return { ...previousDraft, area: value };
          case 'address':
            return { ...previousDraft, address: value };
          case 'description':
            return { ...previousDraft, description: value };
          case 'maxOccupancy':
            return { ...previousDraft, maxOccupancy: value };
          case 'campus':
            return { ...previousDraft, campus: value };
          case 'availability':
            return { ...previousDraft, availability: value };
          case 'videoUrl':
            return { ...previousDraft, videoUrl: value };
          default:
            return previousDraft;
        }
      });

      setEditError(null);
    },
    [],
  );

  const addImages = useCallback((files: FileList | null) => {
    if (!files) return;

    setEditDraft((previousDraft) => {
      if (!previousDraft) return previousDraft;

      const currentCount =
        previousDraft.existingImages.length + previousDraft.newImages.length;
      const availableSlots = Math.max(0, MAX_POST_IMAGES - currentCount);
      if (availableSlots === 0) return previousDraft;

      const nextFiles = Array.from(files)
        .filter((file) => file.type.startsWith('image/'))
        .slice(0, availableSlots);

      if (nextFiles.length === 0) return previousDraft;

      return {
        ...previousDraft,
        newImages: [...previousDraft.newImages, ...nextFiles],
        imagesTouched: true,
      };
    });

    setEditError(null);
  }, []);

  const removeExistingImage = useCallback((index: number) => {
    setEditDraft((previousDraft) => {
      if (!previousDraft) return previousDraft;

      return {
        ...previousDraft,
        existingImages: previousDraft.existingImages.filter(
          (_, imageIndex) => imageIndex !== index,
        ),
        imagesTouched: true,
      };
    });

    setEditError(null);
  }, []);

  const removeNewImage = useCallback((index: number) => {
    setEditDraft((previousDraft) => {
      if (!previousDraft) return previousDraft;

      return {
        ...previousDraft,
        newImages: previousDraft.newImages.filter(
          (_, imageIndex) => imageIndex !== index,
        ),
        imagesTouched: true,
      };
    });

    setEditError(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!accessToken) {
      setEditError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    if (editingId === null || !editDraft || !initialEditDraft || !editingPost)
      return;

    const validation = validateEditDraft(editDraft);
    const validationMessage = validation.title ?? validation.price;
    if (validationMessage) {
      setEditError(validationMessage);
      return;
    }

    if (
      getEditDraftSignature(editDraft) ===
      getEditDraftSignature(initialEditDraft)
    ) {
      setEditError('Chưa có thay đổi để lưu.');
      return;
    }

    const payload: UpdatePostPayload = {};
    const nextTitle = editDraft.title.trim();
    const initialTitle = initialEditDraft.title.trim();
    if (nextTitle !== initialTitle) {
      payload.title = nextTitle;
    }

    const nextAddress = editDraft.address.trim();
    const initialAddress = initialEditDraft.address.trim();
    if (nextAddress !== initialAddress) {
      payload.address = nextAddress;
    }

    const nextDescription = editDraft.description.trim();
    const initialDescription = initialEditDraft.description.trim();
    if (nextDescription !== initialDescription) {
      payload.description = nextDescription;
    }

    const nextPrice = parseNumberInput(editDraft.price);
    const initialPrice = parseNumberInput(initialEditDraft.price);
    if (nextPrice !== initialPrice && nextPrice !== undefined) {
      payload.price = nextPrice;
    }

    const nextArea = parseNumberInput(editDraft.area);
    const initialArea = parseNumberInput(initialEditDraft.area);
    if (nextArea !== initialArea && nextArea !== undefined) {
      payload.area = nextArea;
    }

    const nextMaxOccupancy = parseNumberInput(editDraft.maxOccupancy);
    const initialMaxOccupancy = parseNumberInput(initialEditDraft.maxOccupancy);
    if (
      nextMaxOccupancy !== initialMaxOccupancy &&
      nextMaxOccupancy !== undefined
    ) {
      payload.max_occupancy = Math.max(1, Math.floor(nextMaxOccupancy));
    }

const nextCampus = editDraft.campus.trim();
    const initialCampus = initialEditDraft.campus.trim();
    if (
      nextCampus !== initialCampus &&
      (nextCampus === 'CS1' || nextCampus === 'CS2' || nextCampus === 'CS3')
    ) {
      payload.campus = nextCampus;
    }

    const nextAvailability = editDraft.availability.trim();
    const initialAvailability = initialEditDraft.availability.trim();
    if (
      nextAvailability !== initialAvailability &&
      (nextAvailability === 'available' || nextAvailability === 'rented')
    ) {
      payload.availability = nextAvailability;
    }

    const nextVideoUrl = editDraft.videoUrl.trim();
    const initialVideoUrl = initialEditDraft.videoUrl.trim();
    if (nextVideoUrl !== initialVideoUrl) {
      payload.videoUrl = nextVideoUrl || undefined;
    }

    setSavingId(editingId);
    setEditError(null);

    try {
      if (editDraft.imagesTouched) {
        const uploadedImages =
          editDraft.newImages.length > 0
            ? await uploadImages(editDraft.newImages)
            : [];
        payload.imageUrls = [...editDraft.existingImages, ...uploadedImages];
      }

      const result = await updatePost(editingId, payload, accessToken);
      const updatedPost = resolveUpdatedPost(result);
      const wasRejected = normalizeStatus(editingPost.status) === 'rejected';

      setPosts((previousPosts) =>
        previousPosts.map((post) =>
          post.id === editingId
            ? mergeUpdatedPost(post, payload, updatedPost, wasRejected)
            : post,
        ),
      );

      closeEdit();
      setNotice(
        wasRejected
          ? 'Bài đăng đã được cập nhật và gửi lại để chờ duyệt.'
          : 'Cập nhật bài đăng thành công.',
      );
    } catch {
      setEditError('Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setSavingId(null);
    }
  }, [
    accessToken,
    closeEdit,
    editDraft,
    editingId,
    editingPost,
    initialEditDraft,
  ]);

  const handleDelete = useCallback(
    async (id: number) => {
      if (!accessToken) {
        setLoadError('auth_failed');
        return;
      }

      const confirmed = window.confirm('Bạn chắc chắn muốn xóa bài đăng này?');
      if (!confirmed) return;

      setDeletingId(id);
      setLoadError(null);

      try {
        await deletePost(id, accessToken);
        setPosts((previousPosts) =>
          previousPosts.filter((post) => post.id !== id),
        );
        setNotice('Xóa bài đăng thành công.');

        if (editingId === id) {
          closeEdit();
        }
      } catch {
        setLoadError('delete_failed');
      } finally {
        setDeletingId(null);
      }
    },
    [accessToken, closeEdit, editingId],
  );

  return {
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
  };
}
