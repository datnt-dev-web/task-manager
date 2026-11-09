import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { attachmentApi, type FileLibraryQuery } from '@/infrastructure/api/attachment.api';
import { queryKeys } from '../queryKeys';

/** Kho tệp tập trung: tệp của mọi công việc trong các dự án người dùng được xem. */
export const useFileLibrary = (query: FileLibraryQuery) =>
  useQuery({
    queryKey: queryKeys.fileLibrary(query),
    queryFn: () => attachmentApi.search(query),
    placeholderData: keepPreviousData,
  });
