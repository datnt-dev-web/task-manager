import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import type { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { cn } from '@/lib/utils';

export interface MentionItem {
  id: string;
  label: string;
  email: string;
  avatarUrl: string | null;
}

export interface MentionListHandle {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

/** RTE-06: danh sách gợi ý khi gõ "@" — mũi tên lên/xuống, Enter để chọn. */
export const MentionList = forwardRef<MentionListHandle, SuggestionProps<MentionItem>>(function MentionList(
  { items, command },
  ref,
) {
  const [selected, setSelected] = useState(0);
  useEffect(() => setSelected(0), [items]);

  const choose = (index: number) => {
    const item = items[index];
    if (item) command({ id: item.id, label: item.label });
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (items.length === 0) return false;
      if (event.key === 'ArrowDown') {
        setSelected((i) => (i + 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowUp') {
        setSelected((i) => (i - 1 + items.length) % items.length);
        return true;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        choose(selected);
        return true;
      }
      return false;
    },
  }));

  return (
    <div role="listbox" aria-label="Chọn người để nhắc" className="bg-popover text-popover-foreground w-64 overflow-hidden rounded-md border p-1 shadow-md">
      {items.length === 0 ? (
        <p className="text-muted-foreground px-2 py-1.5 text-sm">Không tìm thấy thành viên</p>
      ) : (
        items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={index === selected}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => choose(index)}
            onMouseEnter={() => setSelected(index)}
            className={cn('flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm', index === selected && 'bg-accent')}
          >
            <UserAvatar user={{ fullName: item.label, email: item.email, avatarUrl: item.avatarUrl }} size="sm" />
            <span className="min-w-0">
              <span className="block truncate">{item.label}</span>
              <span className="text-muted-foreground block truncate text-xs">{item.email}</span>
            </span>
          </button>
        ))
      )}
    </div>
  );
});
