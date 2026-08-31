import { ceilDivideAtLeastOne } from '@blog/utils/primitives';

/** Total number of pages for a given item count and page size (never below 1). */
export function toTotalPages(total: number, pageSize: number): number {
  return ceilDivideAtLeastOne(total, pageSize);
}
