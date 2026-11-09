import { FileLibrary } from '@/components/organisms/files/FileLibrary';
import { PageHeader } from '@/components/templates/PageHeader';

/** Kho tệp tập trung: mọi tệp đính kèm trong các dự án bạn tham gia. */
export function FilesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl pb-10">
      <PageHeader
        title="Tệp đính kèm"
        description="Toàn bộ tệp trong các dự án bạn tham gia. Bấm vào tên công việc để mở đúng công việc chứa tệp."
      />
      <div className="px-4 md:px-6">
        <FileLibrary />
      </div>
    </div>
  );
}
