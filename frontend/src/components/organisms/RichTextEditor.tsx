import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import Mention from '@tiptap/extension-mention';
import { Table, TableCell, TableHeader, TableRow } from '@tiptap/extension-table';
import {
  Bold,
  Code,
  Heading2,
  ImagePlus,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Strikethrough,
  Underline,
  type LucideIcon,
} from 'lucide-react';
import type { RichDoc } from '@/domain/entities';
import { notify } from '@/application/notify';
import { cn } from '@/lib/utils';
import type { MentionItem } from './rich-text/MentionList';
import { looksLikeMarkdown, markdownToHtml } from './rich-text/markdown';
import { createMentionSuggestion } from './rich-text/mentionSuggestion';

const MARKDOWN_PASTE_KEY = 'tm-markdown-paste';
const readMarkdownPref = () => {
  try {
    return localStorage.getItem(MARKDOWN_PASTE_KEY) !== 'off';
  } catch {
    return true;
  }
};

export type { MentionItem };

const isEmptyDoc = (editor: Editor) => editor.isEmpty;
/** Ranh giới domain ↔ TipTap: RichDoc của domain chính là JSONContent của ProseMirror. */
const toContent = (doc: RichDoc | null | undefined) => (doc ?? null) as JSONContent | null;

interface RichTextEditorProps {
  value: RichDoc | null | undefined;
  onChange?: (doc: RichDoc | null) => void;
  /** Ctrl/⌘+Enter (dùng để gửi bình luận). */
  onSubmit?: () => void;
  editable?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  minimal?: boolean;
  /** RTE-06: người có thể @nhắc. Bỏ trống thì tắt @nhắc. */
  mentionables?: MentionItem[];
  /** RTE-05: tải ảnh lên, trả về URL để chèn vào nội dung. Bỏ trống thì tắt chèn ảnh. */
  onUploadImage?: (file: File) => Promise<string>;
}

/**
 * RTE-01..08: trình soạn thảo dùng chung cho mô tả công việc, bình luận, mô tả dự án.
 * Lưu dạng JSON (ProseMirror) — backend làm sạch và trích văn bản để tìm kiếm.
 */
export function RichTextEditor({
  value,
  onChange,
  onSubmit,
  editable = true,
  placeholder,
  autoFocus,
  className,
  minimal,
  mentionables,
  onUploadImage,
}: RichTextEditorProps) {
  const mentionablesRef = useRef<MentionItem[]>(mentionables ?? []);
  mentionablesRef.current = mentionables ?? [];
  const uploadRef = useRef(onUploadImage);
  uploadRef.current = onUploadImage;
  const editorRef = useRef<Editor | null>(null);
  // Tùy chọn "Markdown": dán văn bản Markdown → tự hiển thị định dạng. Ghi nhớ theo trình duyệt.
  const [markdownPaste, setMarkdownPaste] = useState(readMarkdownPref);
  const markdownRef = useRef(markdownPaste);
  markdownRef.current = markdownPaste;
  const toggleMarkdown = () => {
    const next = !markdownPaste;
    setMarkdownPaste(next);
    try {
      localStorage.setItem(MARKDOWN_PASTE_KEY, next ? 'on' : 'off');
    } catch {
      /* bỏ qua */
    }
  };

  const insertImages = async (files: File[]) => {
    const upload = uploadRef.current;
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (!upload || images.length === 0) return false;
    for (const file of images) {
      try {
        const src = await upload(file);
        editorRef.current?.chain().focus().setImage({ src, alt: file.name }).run();
      } catch (error) {
        notify.error(error, `Không tải lên được ảnh "${file.name}"`);
      }
    }
    return true;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: true, autolink: true, defaultProtocol: 'https' },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: placeholder ?? 'Nhập nội dung...' }),
      Image.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Mention.configure({
        HTMLAttributes: { class: 'tm-mention' },
        suggestion: createMentionSuggestion(() => mentionablesRef.current),
      }),
    ],
    content: toContent(value),
    editable,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: { class: 'tm-prose outline-none min-h-[inherit]' },
      handleKeyDown: (_view, event) => {
        if (onSubmit && event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          onSubmit();
          return true;
        }
        return false;
      },
      // RTE-05: dán (Ctrl+V) hoặc kéo thả ảnh → tải lên làm tệp đính kèm rồi chèn.
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []);
        if (files.some((f) => f.type.startsWith('image/')) && uploadRef.current) {
          void insertImages(files);
          return true;
        }
        // Dán Markdown (từ ChatGPT, GitHub, VS Code, Notion...) → hiển thị định dạng luôn.
        const text = event.clipboardData?.getData('text/plain') ?? '';
        if (markdownRef.current && looksLikeMarkdown(text)) {
          editorRef.current?.chain().focus().insertContent(markdownToHtml(text)).run();
          return true;
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const files = Array.from((event as DragEvent).dataTransfer?.files ?? []);
        if (!files.some((f) => f.type.startsWith('image/')) || !uploadRef.current) return false;
        event.preventDefault();
        void insertImages(files);
        return true;
      },
    },
    // Chỉ báo thay đổi do người dùng (ô soạn thảo đang focus). Các plugin như TrailingNode tự chỉnh
    // tài liệu khi tải nội dung — không được coi là "đã sửa".
    onUpdate: ({ editor: e }) => {
      if (!e.isFocused) return;
      onChange?.(isEmptyDoc(e) ? null : (e.getJSON() as RichDoc));
    },
  });
  editorRef.current = editor;

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // Đồng bộ khi giá trị bên ngoài đổi (ví dụ sau khi gửi bình luận thì xóa trắng).
  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(isEmptyDoc(editor) ? null : editor.getJSON());
    if (current !== JSON.stringify(value ?? null)) editor.commands.setContent(toContent(value), { emitUpdate: false });
  }, [editor, value]);

  if (!editable) return <EditorContent editor={editor} className={cn('text-sm', className)} />;

  return (
    <div
      className={cn(
        'border-input focus-within:border-ring focus-within:ring-ring/30 rounded-md border bg-transparent focus-within:ring-2',
        className,
      )}
    >
      {editor && (
        <Toolbar
          editor={editor}
          minimal={minimal}
          onPickImages={onUploadImage ? insertImages : undefined}
          markdownPaste={markdownPaste}
          onToggleMarkdown={toggleMarkdown}
        />
      )}
      <EditorContent editor={editor} className="min-h-[inherit] px-3 py-2 text-sm" />
    </div>
  );
}

interface ToolButton {
  icon: LucideIcon;
  label: string;
  run: (e: Editor) => void;
  active: (e: Editor) => boolean;
  minimal?: boolean;
}

const TOOLS: ToolButton[] = [
  { icon: Bold, label: 'Đậm (Ctrl+B)', run: (e) => e.chain().focus().toggleBold().run(), active: (e) => e.isActive('bold'), minimal: true },
  { icon: Italic, label: 'Nghiêng (Ctrl+I)', run: (e) => e.chain().focus().toggleItalic().run(), active: (e) => e.isActive('italic'), minimal: true },
  { icon: Underline, label: 'Gạch chân (Ctrl+U)', run: (e) => e.chain().focus().toggleUnderline().run(), active: (e) => e.isActive('underline') },
  { icon: Strikethrough, label: 'Gạch ngang', run: (e) => e.chain().focus().toggleStrike().run(), active: (e) => e.isActive('strike') },
  { icon: Code, label: 'Mã', run: (e) => e.chain().focus().toggleCode().run(), active: (e) => e.isActive('code'), minimal: true },
  { icon: Heading2, label: 'Tiêu đề', run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(), active: (e) => e.isActive('heading') },
  { icon: List, label: 'Danh sách chấm', run: (e) => e.chain().focus().toggleBulletList().run(), active: (e) => e.isActive('bulletList'), minimal: true },
  { icon: ListOrdered, label: 'Danh sách số', run: (e) => e.chain().focus().toggleOrderedList().run(), active: (e) => e.isActive('orderedList') },
  { icon: ListChecks, label: 'Checklist', run: (e) => e.chain().focus().toggleTaskList().run(), active: (e) => e.isActive('taskList'), minimal: true },
  { icon: Quote, label: 'Trích dẫn', run: (e) => e.chain().focus().toggleBlockquote().run(), active: (e) => e.isActive('blockquote') },
];

function Toolbar({
  editor,
  minimal,
  onPickImages,
  markdownPaste,
  onToggleMarkdown,
}: {
  editor: Editor;
  minimal?: boolean;
  onPickImages?: (files: File[]) => Promise<boolean>;
  markdownPaste: boolean;
  onToggleMarkdown: () => void;
}) {
  const tools = minimal ? TOOLS.filter((t) => t.minimal) : TOOLS;
  const activeStates = useEditorState({ editor, selector: ({ editor: e }) => tools.map((t) => t.active(e)) });
  const fileInput = useRef<HTMLInputElement>(null);
  const buttonClass = 'text-muted-foreground hover:bg-accent hover:text-foreground rounded-sm p-1.5';

  return (
    <div className="flex flex-wrap gap-0.5 border-b p-1" role="toolbar" aria-label="Định dạng văn bản">
      {tools.map((tool, index) => (
        <button
          key={tool.label}
          type="button"
          title={tool.label}
          aria-label={tool.label}
          aria-pressed={activeStates[index]}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => tool.run(editor)}
          className={cn(buttonClass, activeStates[index] && 'bg-accent text-foreground')}
        >
          <tool.icon className="size-4" />
        </button>
      ))}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onToggleMarkdown}
        aria-pressed={markdownPaste}
        aria-label="Tự định dạng khi dán Markdown"
        title={
          markdownPaste
            ? 'Markdown: BẬT — dán văn bản Markdown sẽ tự hiển thị định dạng (bấm để tắt)'
            : 'Markdown: TẮT — dán giữ nguyên văn bản (bấm để bật)'
        }
        className={cn(
          'ml-auto rounded-sm border px-1.5 py-0.5 text-[11px] font-semibold tracking-wide',
          markdownPaste ? 'border-primary/40 bg-primary/10 text-primary' : 'text-muted-foreground border-transparent hover:bg-accent',
        )}
      >
        MD
      </button>
      {onPickImages && (
        <>
          <button
            type="button"
            title="Chèn ảnh (hoặc dán Ctrl+V)"
            aria-label="Chèn ảnh"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => fileInput.current?.click()}
            className={buttonClass}
          >
            <ImagePlus className="size-4" />
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            multiple
            hidden
            onChange={(e) => {
              void onPickImages(Array.from(e.target.files ?? []));
              e.target.value = '';
            }}
          />
        </>
      )}
    </div>
  );
}
