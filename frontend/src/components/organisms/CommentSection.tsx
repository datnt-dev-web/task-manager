import { useState } from 'react';
import type { Comment, RichDoc, User } from '@/domain/entities';
import { displayName } from '@/domain/rules/user.rules';
import { useCommentMutations, useComments } from '@/application/tasks/useComments';
import { Spinner } from '@/components/atoms/Spinner';
import { UserAvatar } from '@/components/atoms/UserAvatar';
import { Button } from '@/components/ui/button';
import { formatDateTime, fromNow } from '@/lib/date';
import { RichTextEditor, type MentionItem } from './RichTextEditor';

interface CommentSectionProps {
  taskKey: string;
  currentUser: User;
  canComment: boolean;
  canModerate: boolean;
  mentionables?: MentionItem[];
  onUploadImage?: (file: File) => Promise<string>;
}

/** CMT-01..03: bình luận rich text; Ctrl+Enter để gửi. */
export function CommentSection({ taskKey, currentUser, canComment, canModerate, mentionables, onUploadImage }: CommentSectionProps) {
  const { data: comments, isLoading } = useComments(taskKey);
  const { add, update, remove } = useCommentMutations(taskKey);
  const [draft, setDraft] = useState<RichDoc | null>(null);

  const send = () => {
    if (!draft || add.isPending) return;
    add.mutate(draft, { onSuccess: () => setDraft(null) });
  };

  return (
    <section className="space-y-4" aria-label="Bình luận">
      <h3 className="text-sm font-semibold">Bình luận</h3>

      {canComment && (
        <div className="flex gap-3">
          <UserAvatar user={currentUser} />
          <div className="min-w-0 flex-1 space-y-2">
            <RichTextEditor
              value={draft}
              onChange={setDraft}
              onSubmit={send}
              placeholder="Viết bình luận... Gõ @ để nhắc tên"
              minimal
              className="min-h-16"
              mentionables={mentionables}
              onUploadImage={onUploadImage}
            />
            {draft && (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={send} disabled={add.isPending}>
                  Gửi
                </Button>
                <span className="text-muted-foreground text-xs">hoặc Ctrl + Enter</span>
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading && <Spinner />}
      {comments?.length === 0 && !canComment && <p className="text-muted-foreground text-sm">Chưa có bình luận.</p>}

      <ol className="space-y-4">
        {[...(comments ?? [])].reverse().map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            canEdit={canComment && comment.authorId === currentUser.id}
            canDelete={canComment && (comment.authorId === currentUser.id || canModerate)}
            onSave={(body) => update.mutateAsync({ id: comment.id, body })}
            mentionables={mentionables}
            onDelete={() => remove.mutate(comment.id)}
          />
        ))}
      </ol>
    </section>
  );
}

interface CommentItemProps {
  comment: Comment;
  canEdit: boolean;
  canDelete: boolean;
  onSave: (body: RichDoc) => Promise<unknown>;
  onDelete: () => void;
  mentionables?: MentionItem[];
}

function CommentItem({ comment, canEdit, canDelete, onSave, onDelete, mentionables }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RichDoc | null>(comment.body);

  const save = async () => {
    if (!draft) return;
    await onSave(draft);
    setEditing(false);
  };

  return (
    <li className="flex gap-3">
      <UserAvatar user={comment.author} />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{displayName(comment.author)}</span>{' '}
          <time className="text-muted-foreground text-xs" title={formatDateTime(comment.createdAt)}>
            {fromNow(comment.createdAt)}
          </time>
          {comment.editedAt && <span className="text-muted-foreground text-xs"> · đã sửa</span>}
        </p>
        {editing ? (
          <div className="mt-1 space-y-2">
            <RichTextEditor value={draft} onChange={setDraft} onSubmit={save} autoFocus minimal mentionables={mentionables} />
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={!draft}>
                Lưu
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Hủy
              </Button>
            </div>
          </div>
        ) : (
          <>
            <RichTextEditor value={comment.body} editable={false} className="mt-0.5" />
            {(canEdit || canDelete) && (
              <div className="text-muted-foreground mt-1 flex gap-3 text-xs">
                {canEdit && (
                  <button type="button" className="hover:text-foreground hover:underline" onClick={() => setEditing(true)}>
                    Sửa
                  </button>
                )}
                {canDelete && (
                  <button type="button" className="hover:text-destructive hover:underline" onClick={onDelete}>
                    Xóa
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </li>
  );
}
