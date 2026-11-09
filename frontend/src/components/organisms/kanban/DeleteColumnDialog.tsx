import { useState } from 'react';
import type { BoardColumn } from '@/domain/entities';
import { useDeleteColumn } from '@/application/board/useBoard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DeleteColumnDialogProps {
  projectId: string;
  column: BoardColumn;
  columns: BoardColumn[];
  taskCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** BRD-03: xóa cột còn công việc thì hỏi chuyển các việc đó sang cột nào. */
export function DeleteColumnDialog({ projectId, column, columns, taskCount, open, onOpenChange }: DeleteColumnDialogProps) {
  const others = columns.filter((c) => c.id !== column.id);
  const [moveTo, setMoveTo] = useState(others[0]?.id ?? '');
  const deleteColumn = useDeleteColumn(projectId);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa cột “{column.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {taskCount > 0
              ? `Cột đang có ${taskCount} công việc. Chọn cột để chuyển các công việc này sang.`
              : 'Cột không có công việc nào.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {taskCount > 0 && (
          <Select value={moveTo} onValueChange={setMoveTo}>
            <SelectTrigger className="w-full" aria-label="Chuyển công việc sang cột">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {others.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => deleteColumn.mutate({ columnId: column.id, moveTo: taskCount > 0 ? moveTo : undefined })}
          >
            Xóa cột
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
