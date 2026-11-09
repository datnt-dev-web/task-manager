// ATT: khớp danh sách trắng ở backend (utils/fileType.js).
export const ALLOWED_FILE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.pdf', '.zip',
  '.docx', '.xlsx', '.pptx', '.doc', '.xls', '.ppt', '.txt', '.csv',
];
export const MAX_FILE_MB = 10;
export const MAX_FILES_PER_UPLOAD = 10;

export const isImageMime = (mime: string) => mime.startsWith('image/');
export const isPdfMime = (mime: string) => mime === 'application/pdf';
/** Xem trực tiếp trong hệ thống được (ảnh, PDF). */
export const isPreviewable = (mime: string) => isImageMime(mime) || isPdfMime(mime);

export const FILE_KIND_LABELS = {
  image: 'Ảnh',
  pdf: 'PDF',
  document: 'Tài liệu',
  archive: 'Tệp nén',
} as const;

/** Nhãn ngắn hiển thị loại tệp theo đuôi, ví dụ "DOCX". */
export const fileExtension = (fileName: string) => {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot + 1).toUpperCase() : '';
};

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Kiểm tra sơ bộ phía client để báo lỗi sớm; backend vẫn kiểm tra lại nội dung tệp. */
export function validateFiles(files: File[]): string | null {
  if (files.length > MAX_FILES_PER_UPLOAD) return `Mỗi lần tải lên tối đa ${MAX_FILES_PER_UPLOAD} tệp`;
  for (const file of files) {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) return `Định dạng của "${file.name}" không được hỗ trợ`;
    if (file.size > MAX_FILE_MB * 1024 * 1024) return `"${file.name}" vượt quá ${MAX_FILE_MB} MB`;
  }
  return null;
}
