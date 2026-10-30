'use client';

import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import type { TTenantsListQuery } from '@platform/utils/tenants-list-query/tenants-list-query';
import { useTenantsListNavigation } from '@platform/utils/use-tenants-list-navigation/use-tenants-list-navigation';
import { useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';

import { tenantsSearchVariants } from './tenants-search-variants';

export type TTenantsSearchProps = {
  listQuery: TTenantsListQuery;
};

export const TenantsSearch = ({ listQuery }: TTenantsSearchProps) => {
  const t = useTranslations('tenantsSearch');
  const { navigate } = useTenantsListNavigation(listQuery);
  const [value, setValue] = useState(listQuery.search);
  const { root } = tenantsSearchVariants();

  const handleChange = (nextValue: string) => {
    setValue(nextValue);
    if (!nextValue && listQuery.search) navigate({ search: '' });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate({ search: value.trim() });
  };

  return (
    <form role="search" className={root()} onSubmit={handleSubmit}>
      <FormField label={t('label')} hint={t('hint')}>
        <TextInput type="search" value={value} onChange={handleChange} />
      </FormField>
    </form>
  );
};
