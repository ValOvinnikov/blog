'use client';

import { ICONS, SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { FormField } from '@platform/components/shared/form-field';
import { Icon } from '@platform/components/shared/icon';
import { TextInput } from '@platform/components/shared/text-input';
import { BUTTON_VARIANT } from '@platform/constants/button';
import type { TTenantsListQuery } from '@platform/utils/tenants-list-query/tenants-list-query';
import { useTranslations } from 'next-intl';
import { useRef, type FormEvent } from 'react';

import { tenantsSearchVariants } from './tenants-search-variants';
import { useTenantsSearch } from './use-tenants-search';

export type TTenantsSearchProps = {
  listQuery: TTenantsListQuery;
};

export const TenantsSearch = ({ listQuery }: TTenantsSearchProps) => {
  const t = useTranslations('tenantsSearch');
  const { value, change, submit, clear } = useTenantsSearch(listQuery);
  const inputRef = useRef<HTMLInputElement>(null);
  const { root, control, input, clearButton } = tenantsSearchVariants();
  const clearLabel = t('clearLabel');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleClear = () => {
    clear();
    inputRef.current?.focus();
  };

  return (
    <form role="search" className={root()} onSubmit={handleSubmit}>
      <FormField label={t('label')} hint={t('hint')}>
        <div className={control()}>
          <TextInput
            ref={inputRef}
            type="search"
            value={value}
            onChange={change}
            className={input()}
          />
          {value && (
            <Button
              variant={BUTTON_VARIANT.GHOST}
              size={SIZE.SM}
              onClick={handleClear}
              aria-label={clearLabel}
              className={clearButton()}
            >
              <Icon name={ICONS.X} />
            </Button>
          )}
        </div>
      </FormField>
    </form>
  );
};
