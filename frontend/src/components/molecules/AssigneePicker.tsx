import { useState } from 'react';
import { Check } from 'lucide-react';
import type { ProjectMember, UserBrief } from '@/domain/entities';
import { displayName } from '@/domain/rules/user.rules';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface AssigneePickerProps {
  members: ProjectMember[];
  value: UserBrief | null;
  onChange: (userId: string | null) => void;
  disabled?: boolean;
}

/** Chọn người làm. Chỉ Quản lý dự án và Thành viên được giao việc (BR-02). */
export function AssigneePicker({ members, value, onChange, disabled }: AssigneePickerProps) {
  const [open, setOpen] = useState(false);
  const assignable = members.filter((m) => m.role !== 'viewer' && m.user.status !== 'disabled');

  const select = (userId: string | null) => {
    setOpen(false);
    if (userId !== (value?.id ?? null)) onChange(userId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 px-2" aria-label="Người làm">
          <UserAvatar user={value} size="sm" />
          <span className={cn('truncate', !value && 'text-muted-foreground')}>{displayName(value)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Tìm thành viên..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy thành viên</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__none__ chưa giao" onSelect={() => select(null)}>
                <UserAvatar user={null} size="sm" />
                Chưa giao
                {!value && <Check className="ml-auto size-4" />}
              </CommandItem>
              {assignable.map((m) => (
                <CommandItem key={m.userId} value={`${displayName(m.user)} ${m.user.email}`} onSelect={() => select(m.userId)}>
                  <UserAvatar user={m.user} size="sm" />
                  <span className="truncate">{displayName(m.user)}</span>
                  {value?.id === m.userId && <Check className="ml-auto size-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
