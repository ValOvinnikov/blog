import { SUBSCRIBERS_PAGE_SIZE } from '@platform/constants/subscribers';
import type { TSubscribersPageData } from '@platform/server/subscribers/load-subscribers-page';

export type TSubscribersRange = {
  from: number;
  to: number;
  count: number;
};

export const toSubscribersRange = ({
  list,
  page,
}: Pick<TSubscribersPageData, 'list' | 'page'>): TSubscribersRange => {
  const { rows, total } = list;
  const from = (page - 1) * SUBSCRIBERS_PAGE_SIZE + 1;
  return { from, to: from + rows.length - 1, count: total };
};
