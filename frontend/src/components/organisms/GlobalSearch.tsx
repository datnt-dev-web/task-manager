import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search } from 'lucide-react';
import { displayName } from '@/domain/rules/user.rules';
import { useQuickSearch } from '@/application/tasks/useTasks';
import { useDebouncedValue } from '@/lib/useDebouncedValue';
import { Spinner } from '@/components/atoms/Spinner';
import { TaskKey } from '@/components/atoms/TaskKey';
import { TaskTypeIcon } from '@/components/atoms/TaskTypeIcon';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** SRC-03: tìm công việc ở mọi dự án theo mã hoặc tiêu đề (phím tắt `/`), gợi ý ngay khi gõ. */
export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const keyword = useDebouncedValue(q.trim(), 200);
  const { data: results = [], isFetching } = useQuickSearch(keyword);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target)) {
        if (document.querySelector('[role="dialog"]')) return;
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) setQ('');
  };

  const go = (projectId: string, key: string) => {
    changeOpen(false);
    navigate(`/projects/${projectId}?task=${encodeURIComponent(key)}`);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-muted-foreground w-9 justify-start px-2 sm:w-64"
        onClick={() => setOpen(true)}
        aria-label="Tìm công việc (phím /)"
      >
        <Search />
        <span className="hidden flex-1 text-left font-normal sm:inline">Tìm công việc…</span>
        <kbd className="bg-muted hidden rounded border px-1.5 font-mono text-xs sm:inline">/</kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={changeOpen}
        title="Tìm công việc"
        description="Tìm theo mã hoặc tiêu đề trong các dự án của bạn"
        className="sm:max-w-xl"
      >
        {/* CommandDialog không tự bọc <Command>; lọc ở backend nên tắt lọc phía client (shouldFilter=false). */}
        <Command shouldFilter={false}>
          <CommandInput value={q} onValueChange={setQ} placeholder="Nhập mã (WEB-12) hoặc tiêu đề…" />
          <CommandList>
            {keyword && !isFetching && results.length === 0 && <CommandEmpty>Không tìm thấy công việc phù hợp.</CommandEmpty>}
            {!keyword && (
              <p className="text-muted-foreground px-3 py-6 text-center text-sm">Gõ để tìm trong mọi dự án của bạn.</p>
            )}
            {keyword && isFetching && results.length === 0 && (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            )}
            {results.length > 0 && (
              <CommandGroup heading="Công việc">
                {results.map((t) => (
                  <CommandItem key={t.id} value={t.id} onSelect={() => go(t.projectId, t.key)} className="gap-2">
                    <TaskTypeIcon type={t.type} />
                    <TaskKey value={t.key} done={!!t.completedAt} className="w-16 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <span className="text-muted-foreground hidden shrink-0 text-xs sm:inline">
                      {t.project.name}
                      {t.column && ` · ${t.column.name}`}
                      {t.assignee && ` · ${displayName(t.assignee)}`}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
