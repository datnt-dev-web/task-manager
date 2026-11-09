import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAddColumn } from '@/application/board/useBoard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AddColumnButton({ projectId, boardId }: { projectId: string; boardId: string }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const addColumn = useAddColumn(projectId);

  const submit = () => {
    const value = name.trim();
    if (value) addColumn.mutate({ boardId, name: value }, { onSuccess: () => setName('') });
    setEditing(false);
  };

  if (!editing) {
    return (
      <Button variant="ghost" className="text-muted-foreground w-72 shrink-0 justify-start" onClick={() => setEditing(true)}>
        <Plus /> Thêm cột
      </Button>
    );
  }

  return (
    <div className="w-72 shrink-0">
      <Input
        autoFocus
        maxLength={30}
        value={name}
        placeholder="Tên cột, nhấn Enter để thêm"
        aria-label="Tên cột mới"
        onChange={(e) => setName(e.target.value)}
        onBlur={submit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    </div>
  );
}
