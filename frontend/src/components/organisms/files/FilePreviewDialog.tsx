import { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, ExternalLink, SquareArrowOutUpRight } from 'lucide-react';
import type { Attachment } from '@/domain/entities';
import { formatFileSize, isImageMime, isPdfMime } from '@/domain/rules/file.rules';
import { displayName } from '@/domain/rules/user.rules';
import { inlineUrl } from '@/infrastructure/api/attachment.api';
import { FileThumb } from '@/components/atoms/FileThumb';
import { TaskKey } from '@/components/atoms/TaskKey';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { formatDateTime } from '@/lib/date';

interface FilePreviewDialogProps {
  attachment: Attachment | null;
  onClose: () => void;
  onOpenTask: (attachment: Attachment) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

/** Xem trước ảnh/PDF ngay trong hệ thống; luôn cho biết tệp thuộc công việc nào và mở được công việc đó. */
export function FilePreviewDialog({ attachment, onClose, onOpenTask, onPrev, onNext }: FilePreviewDialogProps) {
  // Phím mũi tên trái/phải để xem tệp trước/sau.
  useEffect(() => {
    if (!attachment) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') onPrev?.();
      if (e.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [attachment, onPrev, onNext]);

  if (!attachment) return null;
  const image = isImageMime(attachment.mimeType);
  const pdf = isPdfMime(attachment.mimeType);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[92vh] flex-col gap-3 sm:max-w-5xl">
        <div className="min-w-0 pr-8">
          <DialogTitle className="truncate">{attachment.fileName}</DialogTitle>
          <DialogDescription className="mt-1">
            {formatFileSize(attachment.size)} · {displayName(attachment.uploadedBy)} tải lên lúc {formatDateTime(attachment.createdAt)}
          </DialogDescription>
        </div>

        <div className="bg-muted/40 relative flex min-h-[50vh] flex-1 items-center justify-center overflow-hidden rounded-md border">
          {image && <img src={inlineUrl(attachment)} alt={attachment.fileName} className="max-h-[65vh] max-w-full object-contain" />}
          {pdf && <iframe src={inlineUrl(attachment)} title={attachment.fileName} className="h-[65vh] w-full bg-white" />}
          {!image && !pdf && (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <div className="size-24 overflow-hidden rounded-lg">
                <FileThumb attachment={attachment} />
              </div>
              <p className="text-muted-foreground text-sm">Định dạng này không xem trước được, hãy tải xuống để mở.</p>
            </div>
          )}
          {onPrev && (
            <Button variant="secondary" size="icon" className="absolute top-1/2 left-2 -translate-y-1/2 shadow" aria-label="Tệp trước" onClick={onPrev}>
              <ChevronLeft />
            </Button>
          )}
          {onNext && (
            <Button variant="secondary" size="icon" className="absolute top-1/2 right-2 -translate-y-1/2 shadow" aria-label="Tệp sau" onClick={onNext}>
              <ChevronRight />
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {attachment.task && (
            <button
              type="button"
              onClick={() => onOpenTask(attachment)}
              className="hover:bg-muted flex min-w-0 items-center gap-2 rounded-md border px-3 py-1.5 text-left text-sm"
              title="Mở công việc chứa tệp này"
            >
              <SquareArrowOutUpRight className="text-primary size-4 shrink-0" aria-hidden />
              <span className="text-muted-foreground shrink-0 text-xs">Thuộc công việc</span>
              <TaskKey value={attachment.task.key} className="shrink-0" />
              <span className="truncate font-medium">{attachment.task.title}</span>
              <span className="text-muted-foreground hidden shrink-0 text-xs sm:inline">· {attachment.task.project.name}</span>
            </button>
          )}
          <div className="ml-auto flex gap-2">
            {(image || pdf) && (
              <Button variant="outline" size="sm" asChild>
                <a href={inlineUrl(attachment)} target="_blank" rel="noreferrer">
                  <ExternalLink /> Mở tab mới
                </a>
              </Button>
            )}
            <Button size="sm" asChild>
              <a href={attachment.url}>
                <Download /> Tải xuống
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
