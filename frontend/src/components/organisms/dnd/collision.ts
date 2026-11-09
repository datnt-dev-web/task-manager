import { closestCenter, closestCorners, pointerWithin, type CollisionDetection } from '@dnd-kit/core';

const typeOf = (container: { data: { current?: Record<string, unknown> } }) => container.data.current?.type as string | undefined;

/**
 * Dò va chạm cho danh sách thẻ có nhiều nhóm (cột Kanban, sprint/backlog):
 * - bỏ chính phần tử đang kéo (nó vẫn là vùng thả ở vị trí cũ, nếu không `over` luôn là chính nó);
 * - ưu tiên phần tử nằm dưới con trỏ, trong đó ưu tiên thẻ (để biết vị trí chèn) hơn vùng nhóm;
 * - con trỏ ngoài mọi vùng thả (bàn phím, kéo ra mép) thì lấy góc gần nhất.
 */
export function itemCollision({ itemType = 'task', ignoreTypes = [] as string[] } = {}): CollisionDetection {
  return (raw) => {
    const args = {
      ...raw,
      droppableContainers: raw.droppableContainers.filter(
        (c) => c.id !== raw.active.id && !ignoreTypes.includes(typeOf(c) ?? ''),
      ),
    };
    const hits = pointerWithin(args);
    if (hits.length === 0) return closestCorners(args);
    const itemHit = hits.find((h) => h.data?.droppableContainer.data.current?.type === itemType);
    return itemHit ? [itemHit] : hits;
  };
}

/** Kéo để sắp xếp chính các nhóm (ví dụ cột): chỉ so với các phần tử cùng loại. */
export function sortableGroupCollision(groupType: string): CollisionDetection {
  return (raw) =>
    closestCenter({ ...raw, droppableContainers: raw.droppableContainers.filter((c) => typeOf(c) === groupType) });
}
