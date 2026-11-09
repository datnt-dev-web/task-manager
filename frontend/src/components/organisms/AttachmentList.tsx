import { useRef, useState, type DragEvent } from 'react';
import { Download, FileText, Paperclip, Trash2 } from 'lucide-react';
import type { Attachment, User } from '@/domain/entities';
import { ALLOWED_FILE_EXTENSIONS, formatFileSize, isImageMime, MAX_FILE_MB } from '@/domain/rules/file.rules';
import { displayName } from '@/domain/rules/user.rules';
import { useAttachmentMutations, useAttachments } from '@/application/tasks/useTaskExtras';
import { inlineUrl } from '@/infrastructure/api/attachment.api';
import { Button } from '@/components/ui/button';
import { fromNow } from '@/lib/date';
import { cn } from '@/lib/utils';

interface AttachmentListProps {
  taskKey: string;
  currentUser: User;
  canUpload: boolean;
  canModerate: boolean;
}

/** ATT-01..03: kéo thả hoặc chọn nhiều tệp, xem trước ảnh/PDF, tải xuống, xóa. */
export function AttachmentList({ taskKey, currentUser, canUpload, canModerate }: AttachmentListProps) {
  const { data: attachments = [] } = useAttachments(taskKey);
  const { upload, remove, progress } = useAttachmentMutations(taskKey);
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (canUpload && e.dataTransfer.files.length) upload.mutate(Array.from(e.dataTransfer.files));
  };

  if (!canUpload && attachments.length === 0) return null;

  return (
    <section
      className="space-y-2"
      aria-label="Tệp đính kèm"
      onDragOver={(e) => {
        if (!canUpload) return;
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">Tệp đính kèm</h3>
        {attachments.length > 0 && <span className="text-muted-foreground text-xs">({attachments.length})</span>}
        {canUpload && (
          <>
            <Button variant="outline" size="xs" className="ml-auto" onClick={() => input.current?.click()} disabled={upload.isPending}>
              <Paperclip /> Đính kèm
            </Button>
            <input
              ref={input}
              type="file"
              multiple
              hidden
              accept={ALLOWED_FILE_EXTENSIONS.join(',')}
              onChange={(e) => {
                if (e.target.files?.length) upload.mutate(Array.from(e.target.files));
                e.target.value = '';
              }}
            />
          </>
        )}
      </div>

      {progress !== null && (
        <div className="bg-muted h-1.5 overflow-hidden rounded-full" role="progressbar" aria-valuenow={progress} aria-label="Đang tải lên">
          <div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {canUpload && (attachments.length === 0 || dragging) && (
        <div
          className={cn(
            'text-muted-foreground rounded-md border border-dashed p-4 text-center text-xs',
            dragging && 'border-primary bg-primary/5 text-foreground',
          )}
        >
          Kéo thả tệp vào đây · Ảnh, PDF, Word, Excel, PowerPoint, txt, csv, zip · tối đa {MAX_FILE_MB} MB/tệp
        </div>
      )}

      <ul className="grid gap-2 sm:grid-cols-2">
        {attachments.map((a) => (
          <AttachmentItem
            key={a.id}
            attachment={a}
            canDelete={canUpload && (a.uploadedById === currentUser.id || canModerate)}
            onDelete={() => remove.mutate(a.id)}
          />
        ))}
      </ul>
    </section>
  );
}

function AttachmentItem({ attachment, canDelete, onDelete }: { attachment: Attachment; canDelete: boolean; onDelete: () => void }) {
  const image = isImageMime(attachment.mimeType);
  const previewable = image || attachment.mimeType === 'application/pdf';
  return (
    <li className="group flex items-center gap-2 rounded-md border p-2">
      <a
        href={previewable ? inlineUrl(attachment) : attachment.url}
        target={previewable ? '_blank' : undefined}
        rel="noreferrer"
        className="bg-muted flex size-10 shrink-0 items-center justify-center overflow-hidden rounded"
        aria-label={`Xem ${attachment.fileName}`}
      >
        {image ? (
          <img src={inlineUrl(attachment)} alt="" className="size-full object-cover" loading="lazy" />
        ) : (
          <FileText className="text-muted-foreground size-5" aria-hidden />
        )}
      </a>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm" title={attachment.fileName}>
          {attachment.fileName}
        </p>
        <p className="text-muted-foreground truncate text-xs">
          {formatFileSize(attachment.size)} · {displayName(attachment.uploadedBy)} · {fromNow(attachment.createdAt)}
        </p>
      </div>
      <Button variant="ghost" size="icon-xs" asChild>
        <a href={attachment.url} aria-label={`Tải xuống ${attachment.fileName}`}>
          <Download />
        </a>
      </Button>
      {canDelete && (
        <Button variant="ghost" size="icon-xs" aria-label={`Xóa ${attachment.fileName}`} onClick={onDelete}>
          <Trash2 />
        </Button>
      )}
    </li>
  );
}
