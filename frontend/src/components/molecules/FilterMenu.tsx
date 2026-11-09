import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface FilterOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

type FilterMenuProps = {
  label: string;
  options: FilterOption[];
} & (
  | { multiple: true; value: string[]; onChange: (value: string[]) => void }
  | { multiple?: false; value: string | null; onChange: (value: string | null) => void }
);

/** Nút lọc dạng menu: chọn nhiều (checkbox) hoặc một (radio). Nút đổi màu + hiện số khi đang lọc. */
export function FilterMenu(props: FilterMenuProps) {
  const { label, options } = props;
  const active = props.multiple ? props.value.length > 0 : props.value !== null;
  const summary = props.multiple
    ? props.value.length === 1
      ? options.find((o) => o.value === props.value[0])?.label
      : props.value.length > 1
        ? `${props.value.length}`
        : null
    : options.find((o) => o.value === props.value)?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={active ? 'secondary' : 'ghost'} size="sm" aria-label={`Lọc theo ${label.toLowerCase()}`}>
          {label}
          {summary && <span className="text-muted-foreground max-w-28 truncate font-normal">: {summary}</span>}
          <ChevronDown className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 min-w-48 overflow-y-auto">
        {props.multiple ? (
          options.map((o) => (
            <DropdownMenuCheckboxItem
              key={o.value}
              checked={props.value.includes(o.value)}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={(checked) =>
                props.onChange(checked ? [...props.value, o.value] : props.value.filter((v) => v !== o.value))
              }
            >
              {o.icon}
              {o.label}
            </DropdownMenuCheckboxItem>
          ))
        ) : (
          <DropdownMenuRadioGroup value={props.value ?? ''} onValueChange={(v) => props.onChange(v || null)}>
            {options.map((o) => (
              <DropdownMenuRadioItem key={o.value} value={o.value}>
                {o.icon}
                {o.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        )}
        {active && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => (props.multiple ? props.onChange([]) : props.onChange(null))}>
              Bỏ lọc {label.toLowerCase()}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
