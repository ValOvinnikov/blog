'use client';

import { SORT_DIRECTION } from '@blog/config/constants';
import type { TColumnSort } from '@blog/config/types';
import {
  DATA_REQUEST_KIND_FILTER,
  DATA_REQUEST_MATCH_COLUMN,
  DATA_REQUEST_MATCH_KIND,
  DATA_REQUEST_MATCHES_PAGE_SIZE,
  type TDataRequestKindFilter,
  type TDataRequestMatchColumn,
} from '@platform/constants/data-request';
import type { TDataRequestMatch } from '@platform/server/data-requests/to-data-request-matches';
import {
  nextSort,
  type TColumnSort,
} from '@platform/utils/next-sort/next-sort';
import { countPages } from '@platform/utils/pagination/pagination';
import { useLocale } from 'next-intl';
import { useState } from 'react';

export type TDataRequestMatchShownValues = Record<
  TDataRequestMatchColumn,
  string
>;

type TSort = TColumnSort<TDataRequestMatchColumn>;

const DEFAULT_SORT: TSort = {
  column: DATA_REQUEST_MATCH_COLUMN.RECORDED,
  direction: SORT_DIRECTION.DESCENDING,
};

const recordedTime = ({ recordedAt }: TDataRequestMatch): number =>
  recordedAt?.getTime() ?? Number.NEGATIVE_INFINITY;

export const useDataRequestMatchesTable = (
  matches: TDataRequestMatch[],
  toShownValues: (match: TDataRequestMatch) => TDataRequestMatchShownValues,
) => {
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [kindFilter, setKindFilter] = useState<TDataRequestKindFilter>(
    DATA_REQUEST_KIND_FILTER.ALL,
  );
  const [sort, setSort] = useState<TSort>(DEFAULT_SORT);
  const [page, setPage] = useState(1);

  const collator = new Intl.Collator(locale, { sensitivity: 'base' });
  const needle = query.trim().toLocaleLowerCase(locale);
  const rows = matches
    .filter(
      ({ kind }) =>
        kindFilter === DATA_REQUEST_KIND_FILTER.ALL || kind === kindFilter,
    )
    .filter(
      (match) =>
        needle === '' ||
        Object.values(toShownValues(match)).some((value) =>
          value.toLocaleLowerCase(locale).includes(needle),
        ),
    )
    .sort((first, second) => {
      const order =
        sort.column === DATA_REQUEST_MATCH_COLUMN.RECORDED
          ? recordedTime(first) - recordedTime(second)
          : collator.compare(
              toShownValues(first)[sort.column],
              toShownValues(second)[sort.column],
            );
      return sort.direction === SORT_DIRECTION.ASCENDING ? order : -order;
    });

  const totalPages = countPages(rows.length, DATA_REQUEST_MATCHES_PAGE_SIZE);
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * DATA_REQUEST_MATCHES_PAGE_SIZE;

  const kindOptions = Object.values(DATA_REQUEST_MATCH_KIND).filter((kind) =>
    matches.some((match) => match.kind === kind),
  );

  const changeQuery = (nextQuery: string) => {
    setQuery(nextQuery);
    setPage(1);
  };

  const changeKindFilter = (nextKindFilter: TDataRequestKindFilter) => {
    setKindFilter(nextKindFilter);
    setPage(1);
  };

  const sortBy = (column: TDataRequestMatchColumn) => {
    setSort(nextSort(sort, column));
    setPage(1);
  };

  return {
    query,
    changeQuery,
    kindFilter,
    changeKindFilter,
    kindOptions,
    sort,
    sortBy,
    pageRows: rows.slice(pageStart, pageStart + DATA_REQUEST_MATCHES_PAGE_SIZE),
    page: currentPage,
    totalPages,
    setPage,
  };
};
