import { ReactRenderer } from '@tiptap/react';
import type { SuggestionOptions } from '@tiptap/suggestion';
import { MentionList, type MentionItem, type MentionListHandle } from './MentionList';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase();

/**
 * Cấu hình gợi ý @nhắc tên. `getItems` đọc danh sách thành viên mới nhất (qua ref) nên
 * không phải tạo lại editor khi danh sách thay đổi.
 *
 * Popup được gắn vào trong Dialog đang mở (nếu có) thay vì <body>, vì Radix Dialog chặn
 * tương tác bên ngoài nội dung dialog.
 */
export function createMentionSuggestion(getItems: () => MentionItem[]): Omit<SuggestionOptions<MentionItem>, 'editor'> {
  return {
    items: ({ query }) => {
      const q = normalize(query);
      return getItems()
        .filter((m) => normalize(m.label).includes(q) || m.email.toLowerCase().includes(q))
        .slice(0, 8);
    },
    render: () => {
      let renderer: ReactRenderer<MentionListHandle> | null = null;
      let popup: HTMLDivElement | null = null;

      const place = (rect: DOMRect | null | undefined) => {
        if (!popup || !rect) return;
        const container = popup.parentElement!;
        const isBody = container === document.body;
        const base = isBody ? { top: -window.scrollY, left: -window.scrollX } : container.getBoundingClientRect();
        popup.style.top = `${rect.bottom - base.top + (isBody ? 0 : container.scrollTop) + 4}px`;
        popup.style.left = `${rect.left - base.left + (isBody ? 0 : container.scrollLeft)}px`;
      };

      const destroy = () => {
        popup?.remove();
        renderer?.destroy();
        popup = null;
        renderer = null;
      };

      return {
        onStart: (props) => {
          renderer = new ReactRenderer(MentionList, { props, editor: props.editor });
          popup = document.createElement('div');
          popup.style.position = 'absolute';
          popup.style.zIndex = '60';
          popup.appendChild(renderer.element);
          const container = (props.editor.view.dom.closest('[role="dialog"]') as HTMLElement | null) ?? document.body;
          container.appendChild(popup);
          place(props.clientRect?.());
        },
        onUpdate: (props) => {
          renderer?.updateProps(props);
          place(props.clientRect?.());
        },
        onKeyDown: (props) => {
          if (props.event.key === 'Escape') {
            destroy();
            return true;
          }
          return renderer?.ref?.onKeyDown(props) ?? false;
        },
        onExit: destroy,
      };
    },
  };
}
