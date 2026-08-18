import { Size } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { Heading } from '@blog/ui/atoms/heading';
import { useTranslations } from 'next-intl';

import { tenantDetailsPanelVariants } from './tenant-details-panel-variants';

export type TTenantDetailsPanelProps = {
  tenant: TTenant;
};

/**
 * Read-only summary of the tenant row the operator already created — editing
 * only ever happens on the separate add-tenant page, so this panel has no
 * inputs or controls, just the values as provisioning found them.
 */
export function TenantDetailsPanel({ tenant }: TTenantDetailsPanelProps) {
  const t = useTranslations('tenantDetailsPanel');

  const { root, list, row, label, value } = tenantDetailsPanelVariants();

  const rows: { key: string; label: string; value: string }[] = [
    { key: 'name', label: t('nameLabel'), value: tenant.name },
    { key: 'slug', label: t('slugLabel'), value: tenant.slug },
    { key: 'domain', label: t('domainLabel'), value: tenant.primaryDomain },
    {
      key: 'plan',
      label: t('planLabel'),
      value: t(`planValue.${tenant.plan}`),
    },
    { key: 'locale', label: t('localeLabel'), value: tenant.locale },
  ];

  return (
    <div className={root()}>
      <Heading level={2} size={Size.XS}>
        {t('heading')}
      </Heading>
      <dl className={list()}>
        {rows.map((entry) => (
          <div className={row()} key={entry.key}>
            <dt className={label()}>{entry.label}</dt>
            <dd className={value()}>{entry.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
