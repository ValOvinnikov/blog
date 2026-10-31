import { TENANTS_SEARCH_DEBOUNCE_MS } from '@platform/constants/tenant';
import type { TTenantsListQuery } from '@platform/utils/tenants-list-query/tenants-list-query';
import { useTenantsListNavigation } from '@platform/utils/use-tenants-list-navigation/use-tenants-list-navigation';
import { useState } from 'react';

import { useDebouncedCallback } from './use-debounced-callback';

export const useTenantsSearch = (listQuery: TTenantsListQuery) => {
  const { navigateInPlace } = useTenantsListNavigation(listQuery);
  const [value, setValue] = useState(listQuery.search);
  const [shownSearch, setShownSearch] = useState(listQuery.search);
  const [requestedSearches, setRequestedSearches] = useState<string[]>([]);
  const latestSearch = requestedSearches.at(-1) ?? listQuery.search;

  if (listQuery.search !== shownSearch) {
    setShownSearch(listQuery.search);
    const ownIndex = requestedSearches.lastIndexOf(listQuery.search);
    if (ownIndex === -1) {
      setRequestedSearches([]);
      setValue(listQuery.search);
    } else {
      setRequestedSearches(requestedSearches.slice(ownIndex + 1));
    }
  }

  const request = (nextValue: string) => {
    const search = nextValue.trim();
    if (search !== latestSearch) {
      setRequestedSearches([...requestedSearches, search]);
    }
    navigateInPlace({ search });
  };

  const debounced = useDebouncedCallback((nextValue: string) => {
    if (nextValue.trim() !== latestSearch) request(nextValue);
  }, TENANTS_SEARCH_DEBOUNCE_MS);

  const change = (nextValue: string) => {
    setValue(nextValue);
    debounced.schedule(nextValue);
  };

  const submit = () => {
    debounced.cancel();
    request(value);
  };

  const clear = () => {
    setValue('');
    debounced.cancel();
    request('');
  };

  return { value, change, submit, clear };
};
