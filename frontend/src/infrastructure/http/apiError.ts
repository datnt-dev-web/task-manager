import { isAxiosError } from 'axios';

export interface ApiErrorBody {
  error: { code: string; message: string; details?: { path: string; message: string }[] };
}

/** UX-09: luôn trả về thông điệp tiếng Việt dễ hiểu, không lộ lỗi kỹ thuật. */
export function getErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra, vui lòng thử lại'): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    if (!error.response) return 'Không kết nối được máy chủ, vui lòng kiểm tra mạng';
    const body = error.response.data?.error;
    return body?.details?.[0]?.message ?? body?.message ?? fallback;
  }
  return fallback;
}

export const getErrorStatus = (error: unknown) => (isAxiosError(error) ? error.response?.status : undefined);
