import type { TMaybeUndefined } from '@blog/config/types';
import type { TTenantsListQuery } from '@platform/utils/tenants-list-query/tenants-list-query';
import { useTenantsListNavigation } from '@platform/utils/use-tenants-list-navigation/use-tenants-list-navigation';
import { useEffect, useRef, useState } from 'react';

export const TENANTS_SEARCH_DEBOUNCE_MS = 300;

export const useTenantsSearch = (listQuery: TTenantsListQuery) => {
  const { navigate } = useTenantsListNavigation(listQuery);
  const [value, setValue] = useState(listQuery.search);
  const [requestedSearch, setRequestedSearch] = useState(listQuery.search);
  const [shownSearch, setShownSearch] = useState(listQuery.search);
  const timer =
    useRef<TMaybeUndefined<ReturnType<typeof setTimeout>>>(undefined);

  // A URL change this field did not request (a nav link, back/forward) replaces what was typed.
  if (listQuery.search !== shownSearch) {
    setShownSearch(listQuery.search);
    if (listQuery.search !== requestedSearch) {
      setRequestedSearch(listQuery.search);
      setValue(listQuery.search);
    }
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  const apply = (nextValue: string) => {
    clearTimeout(timer.current);
    const search = nextValue.trim();
    if (search === requestedSearch) return;
    setRequestedSearch(search);
    navigate({ search });
  };

  const change = (nextValue: string) => {
    setValue(nextValue);
    clearTimeout(timer.current);
    timer.current = setTimeout(
      () => apply(nextValue),
      TENANTS_SEARCH_DEBOUNCE_MS,
    );
  };

  const clear = () => {
    setValue('');
    apply('');
  };

  return { value, change, submit: () => apply(value), clear };
};
