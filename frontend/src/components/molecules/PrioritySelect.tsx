import type { TaskPriority } from '@/domain/entities';
import { PRIORITIES, PRIORITY_LABELS } from '@/domain/rules/task.rules';
import { PriorityIcon } from '@/components/atoms/PriorityIcon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function PrioritySelect({
  value,
  onChange,
  disabled,
}: {
  value: TaskPriority;
  onChange: (value: TaskPriority) => void;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as TaskPriority)} disabled={disabled}>
      <SelectTrigger size="sm" className="w-full" aria-label="Mức ưu tiên">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PRIORITIES.map((p) => (
          <SelectItem key={p} value={p}>
            <PriorityIcon priority={p} />
            {PRIORITY_LABELS[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
