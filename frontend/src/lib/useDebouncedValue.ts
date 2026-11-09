import { useEffect, useState } from 'react';

/** Trả về giá trị sau khi ngừng thay đổi `delay` ms — dùng cho ô tìm kiếm gọi API. */
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
