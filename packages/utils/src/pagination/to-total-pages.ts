import { ceilDivideAtLeastOne } from '@blog/utils/primitives';

export function toTotalPages(total: number, pageSize: number): number {
  return ceilDivideAtLeastOne(total, pageSize);
}
