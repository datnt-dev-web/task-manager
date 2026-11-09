import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '@/config/env';

/**
 * HTTP client dùng chung. Token nằm trong cookie httpOnly nên client không đọc/ghi token;
 * khi nhận 401 sẽ gọi /auth/refresh một lần (gộp các request đồng thời) rồi thử lại.
 */
export const http = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

const SKIP_REFRESH = ['/auth/refresh', '/auth/google', '/auth/dev-login', '/auth/logout'];
let refreshing: Promise<void> | null = null;
let onSessionExpired: (() => void) | null = null;

/** Tầng application đăng ký callback để xóa phiên khi refresh thất bại. */
export const setSessionExpiredHandler = (handler: () => void) => {
  onSessionExpired = handler;
};

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const shouldRefresh =
      error.response?.status === 401 && config && !config._retried && !SKIP_REFRESH.some((p) => config.url?.startsWith(p));
    if (!shouldRefresh) throw error;

    config._retried = true;
    try {
      refreshing ??= http.post('/auth/refresh').then(() => undefined);
      await refreshing;
    } catch (refreshError) {
      onSessionExpired?.();
      throw refreshError;
    } finally {
      refreshing = null;
    }
    return http(config);
  },
);

/** Bóc lớp { data } của API. */
export const unwrap = <T>(promise: Promise<{ data: { data: T } }>) => promise.then((r) => r.data.data);
