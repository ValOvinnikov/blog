'use client';

import { TenantPickerRow } from '@platform/components/features/layout/dashboard-tenant-picker/components/tenant-picker-row';
import { Card } from '@platform/components/shared/card';
import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import type { TTenantPickerItem } from '@platform/server/tenants/to-tenant-picker-items';
import { useTranslations } from 'next-intl';
import { useId, useRef, useState } from 'react';

import { tenantPickerPaneVariants } from './tenant-picker-pane-variants';
import { useIsOverflowing } from './use-is-overflowing';

export type TTenantPickerPaneProps = {
  tenants: TTenantPickerItem[];
};

const matches = (tenant: TTenantPickerItem, query: string) =>
  tenant.name.toLocaleLowerCase().includes(query) ||
  tenant.primaryDomain.toLocaleLowerCase().includes(query);

export const TenantPickerPane = ({ tenants }: TTenantPickerPaneProps) => {
  const t = useTranslations('dashboardTenantPicker');
  const tSwitcher = useTranslations('tenantSwitcher');
  const archivedLabelId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleTenants = normalizedQuery
    ? tenants.filter((tenant) => matches(tenant, normalizedQuery))
    : tenants;
  const isOverflowing = useIsOverflowing(rootRef, visibleTenants.length);
  const isFilterShown = isOverflowing || query !== '';
  const activeTenants = visibleTenants.filter(({ isArchived }) => !isArchived);
  const archivedTenants = visibleTenants.filter(({ isArchived }) => isArchived);
  const { root, column, count, body, item, groupLabel, noMatch } =
    tenantPickerPaneVariants();

  return (
    <main ref={rootRef} className={root()}>
      <div className={column()}>
        {isFilterShown && (
          <>
            <FormField label={t('filterLabel')}>
              <TextInput type="search" value={query} onChange={setQuery} />
            </FormField>
            <p role="status" aria-live="polite" className={count()}>
              {t('visibleCount', { count: visibleTenants.length })}
            </p>
          </>
        )}
        <Card>
          <Card.Body className={body()}>
            {activeTenants.length > 0 && (
              <ul>
                {activeTenants.map((tenant) => (
                  <li key={tenant.id} className={item()}>
                    <TenantPickerRow tenant={tenant} />
                  </li>
                ))}
              </ul>
            )}
            {archivedTenants.length > 0 && (
              <>
                <p id={archivedLabelId} className={groupLabel()}>
                  {tSwitcher('archived')}
                </p>
                <ul aria-labelledby={archivedLabelId}>
                  {archivedTenants.map((tenant) => (
                    <li key={tenant.id} className={item()}>
                      <TenantPickerRow tenant={tenant} />
                    </li>
                  ))}
                </ul>
              </>
            )}
            {visibleTenants.length === 0 && (
              <p className={noMatch()}>{t('noMatch', { query })}</p>
            )}
          </Card.Body>
        </Card>
      </div>
    </main>
  );
};
