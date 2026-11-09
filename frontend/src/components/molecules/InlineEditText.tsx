import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface InlineEditTextProps {
  value: string;
  onSave: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  ariaLabel: string;
  placeholder?: string;
}

/**
 * UX-03: bấm vào chữ để sửa. Enter hoặc rời ô để lưu, Esc để hủy.
 * Không lưu nếu rỗng hoặc không đổi. Dùng cho tên bảng, tên cột, tiêu đề công việc.
 */
export function InlineEditText({
  value,
  onSave,
  maxLength = 255,
  disabled,
  className,
  inputClassName,
  ariaLabel,
  placeholder,
}: InlineEditTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    const next = draft.trim();
    setEditing(false);
    if (next && next !== value) onSave(next);
    else setDraft(value);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setDraft(value);
      setEditing(false);
    }
  };

  if (disabled) return <span className={cn('truncate', className)}>{value}</span>;

  if (editing) {
    return (
      <input
        ref={inputRef}
        aria-label={ariaLabel}
        value={draft}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          'border-ring bg-background w-full min-w-0 rounded-sm border px-1.5 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          className,
          inputClassName,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`${ariaLabel}: ${value}. Bấm để sửa`}
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={cn('hover:bg-accent -mx-1.5 truncate rounded-sm px-1.5 py-0.5 text-left', className)}
    >
      {value}
    </button>
  );
}
