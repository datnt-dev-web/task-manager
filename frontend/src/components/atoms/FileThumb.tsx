import { FileArchive, FileSpreadsheet, FileText, FileType2, Presentation } from 'lucide-react';
import type { Attachment } from '@/domain/entities';
import { fileExtension, isImageMime } from '@/domain/rules/file.rules';
import { inlineUrl } from '@/infrastructure/api/attachment.api';
import { cn } from '@/lib/utils';

const iconFor = (fileName: string) => {
  const ext = fileExtension(fileName);
  if (['XLS', 'XLSX', 'CSV'].includes(ext)) return { icon: FileSpreadsheet, color: 'text-green-600 dark:text-green-400' };
  if (['PPT', 'PPTX'].includes(ext)) return { icon: Presentation, color: 'text-orange-600 dark:text-orange-400' };
  if (ext === 'PDF') return { icon: FileType2, color: 'text-red-600 dark:text-red-400' };
  if (ext === 'ZIP') return { icon: FileArchive, color: 'text-amber-600 dark:text-amber-400' };
  return { icon: FileText, color: 'text-blue-600 dark:text-blue-400' };
};

/** Ảnh thu nhỏ (với ảnh) hoặc biểu tượng theo loại tệp + đuôi tệp. */
export function FileThumb({ attachment, className, showExtension = true }: { attachment: Attachment; className?: string; showExtension?: boolean }) {
  if (isImageMime(attachment.mimeType)) {
    return <img src={inlineUrl(attachment)} alt="" loading="lazy" className={cn('bg-muted size-full object-cover', className)} />;
  }
  const { icon: Icon, color } = iconFor(attachment.fileName);
  return (
    <span className={cn('bg-muted flex size-full flex-col items-center justify-center gap-1', className)}>
      <Icon className={cn('size-1/3 max-h-10 min-h-5 max-w-10 min-w-5', color)} aria-hidden />
      {showExtension && <span className="text-muted-foreground text-[10px] font-semibold">{fileExtension(attachment.fileName)}</span>}
    </span>
  );
}
