import type { Board, BoardColumn, ProjectRole } from '@/domain/entities';
import { http, unwrap } from '../http/client';

export interface BoardView {
  board: Board;
  role: ProjectRole;
}

export const boardApi = {
  getByProject: async (projectId: string): Promise<BoardView> => {
    const { data } = await http.get(`/projects/${projectId}/board`);
    return { board: data.data, role: data.meta.role };
  },
  rename: (boardId: string, name: string) => unwrap<Board>(http.patch(`/boards/${boardId}`, { name })),
  addColumn: (boardId: string, name: string) => unwrap<BoardColumn>(http.post(`/boards/${boardId}/columns`, { name })),
  updateColumn: (columnId: string, input: { name?: string; isDone?: boolean }) =>
    unwrap<BoardColumn>(http.patch(`/columns/${columnId}`, input)),
  reorderColumns: (boardId: string, columnIds: string[]) =>
    unwrap<BoardColumn[]>(http.put(`/boards/${boardId}/columns/order`, { columnIds })),
  deleteColumn: (columnId: string, moveTo?: string) =>
    http.delete(`/columns/${columnId}`, { params: moveTo ? { moveTo } : {} }).then(() => undefined),
};
