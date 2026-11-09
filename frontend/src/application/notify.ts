import { toast } from 'sonner';
import { getErrorMessage } from '@/infrastructure/http/apiError';

/** Adapter thông báo: tầng application không gọi trực tiếp thư viện toast. */
export const notify = {
  success: (message: string) => toast.success(message),
  error: (error: unknown, fallback?: string) => toast.error(getErrorMessage(error, fallback)),
  /** UX-06: thông báo kèm nút Hoàn tác trong 5 giây. */
  undoable: (message: string, onUndo: () => void) =>
    toast(message, { duration: 5000, action: { label: 'Hoàn tác', onClick: onUndo } }),
};
