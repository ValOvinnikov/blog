import { Card } from '@platform/components/shared/card';
import { CardFooterNote } from '@platform/components/shared/card-footer-note';
import { TextLink } from '@platform/components/shared/text-link';
import {
  loadUsageMeters,
  type TUsageLinks,
} from '@platform/server/usage/load-usage-meters';
import { env } from '@platform/utils/env/env';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { toPricingPageUrl } from '@platform/utils/pricing-page-url/pricing-page-url';
import { usageResetDate } from '@platform/utils/usage-reset-date/usage-reset-date';
import { TENANT_PLAN } from '@shinefold/config';
import { getFormatter, getTranslations } from 'next-intl/server';

import { UsageRow } from './components/usage-row/usage-row';
import { usageCardVariants } from './usage-card-variants';

const RESET_DATE_FORMAT = {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
} as const;

export type TUsageCardProps = {
  tenant: TPlatformTenant;
  links: TUsageLinks;
  hasPlansFooter?: boolean;
};

export const UsageCard = async ({
  tenant,
  links,
  hasPlansFooter = false,
}: TUsageCardProps) => {
  const [meters, t, format] = await Promise.all([
    loadUsageMeters(tenant, links),
    getTranslations('usageCard'),
    getFormatter(),
  ]);
  const resetsOn = format.dateTime(
    usageResetDate(new Date()),
    RESET_DATE_FORMAT,
  );
  const plansUrl =
    hasPlansFooter && tenant.plan !== TENANT_PLAN.GROWTH
      ? toPricingPageUrl({
          marketingSiteUrl: env.MARKETING_SITE_URL,
          rootDomain: env.TENANT_ROOT_DOMAIN,
        })
      : undefined;
  const { body, band } = usageCardVariants();

  return (
    <Card>
      <Card.Header title={t('title')} supportingText={t('description')} />
      <Card.Body className={body()}>
        <div className={band()}>
          {meters.map((row) => (
            <UsageRow key={row.meter} row={row} resetsOn={resetsOn} />
          ))}
        </div>
      </Card.Body>
      {plansUrl ? (
        <CardFooterNote>
          {t('footer.limits')}{' '}
          <TextLink href={plansUrl}>{t('footer.plansLink')}</TextLink>
        </CardFooterNote>
      ) : undefined}
    </Card>
  );
};
