import type { Comment, RichDoc } from '@/domain/entities';
import { http, unwrap } from '../http/client';

export const commentApi = {
  list: (taskKey: string) => unwrap<Comment[]>(http.get(`/tasks/${taskKey}/comments`)),
  create: (taskKey: string, body: RichDoc) => unwrap<Comment>(http.post(`/tasks/${taskKey}/comments`, { body })),
  update: (commentId: string, body: RichDoc) => unwrap<Comment>(http.patch(`/comments/${commentId}`, { body })),
  remove: (commentId: string) => http.delete(`/comments/${commentId}`).then(() => undefined),
};
