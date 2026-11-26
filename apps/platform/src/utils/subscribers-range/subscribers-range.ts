import { SUBSCRIBERS_PAGE_SIZE } from '@platform/constants/subscribers';
import type { TSubscribersPageData } from '@platform/server/subscribers/load-subscribers-page';
import {
  toPageRange,
  type TPageRange,
} from '@platform/utils/pagination/pagination';

export const toSubscribersRange = ({
  list,
  page,
}: Pick<TSubscribersPageData, 'list' | 'page'>): TPageRange =>
  toPageRange({
    page,
    pageSize: SUBSCRIBERS_PAGE_SIZE,
    rowCount: list.rows.length,
    total: list.total,
  });
