import { useTranslations } from 'next-intl';

import { tenantOverviewVariants } from './tenant-overview-variants';

export type TTenantOverviewProps = {
  tenantName: string;
};

/**
 * The Tenant section's landing page. Deliberately minimal: Look and Voice
 * (the only two tabs planned for this milestone) each get their own route
 * and their own ticket — this page exists so the switcher and the
 * `memberships` gate have somewhere real to land in the meantime.
 */
export function TenantOverview({ tenantName }: TTenantOverviewProps) {
  const t = useTranslations('tenantOverview');
  const { root, title, description } = tenantOverviewVariants();

  return (
    <div className={root()}>
      <h1 className={title()}>{tenantName}</h1>
      <p className={description()}>{t('description')}</p>
    </div>
  );
}
