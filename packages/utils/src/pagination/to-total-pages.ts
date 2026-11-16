import { ceilDivideAtLeastOne } from '@shinefold/utils/primitives';

export function toTotalPages(total: number, pageSize: number): number {
  return ceilDivideAtLeastOne(total, pageSize);
}
