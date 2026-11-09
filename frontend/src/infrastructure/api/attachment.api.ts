import type { Attachment, FileKind, Paginated } from '@/domain/entities';
import { http, unwrap } from '../http/client';

export interface FileLibraryQuery {
  q?: string;
  projectId?: string;
  kind?: FileKind;
  mine?: boolean;
  sort?: 'newest' | 'oldest' | 'name' | 'size';
  page?: number;
  pageSize?: number;
}

export const attachmentApi = {
  /** Kho tệp: mọi tệp trong các dự án người dùng được xem. */
  search: async (query: FileLibraryQuery): Promise<Paginated<Attachment>> => {
    const { data } = await http.get('/attachments', { params: query });
    return { items: data.data, meta: data.meta };
  },
  list: (taskKey: string) => unwrap<Attachment[]>(http.get(`/tasks/${taskKey}/attachments`)),
  upload: (taskKey: string, files: File[], onProgress?: (percent: number) => void) => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    return unwrap<Attachment[]>(
      http.post(`/tasks/${taskKey}/attachments`, form, {
        // Bắt buộc ghi đè: client mặc định gửi JSON và axios sẽ chuyển FormData thành JSON.
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      }),
    );
  },
  remove: (attachmentId: string) => http.delete(`/attachments/${attachmentId}`).then(() => undefined),
};

/** Link xem trực tiếp trong trình duyệt (ảnh, PDF). */
export const inlineUrl = (attachment: Pick<Attachment, 'url'>) => `${attachment.url}?inline=1`;
