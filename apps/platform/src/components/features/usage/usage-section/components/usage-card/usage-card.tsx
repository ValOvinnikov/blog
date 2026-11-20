import { Card } from '@platform/components/shared/card';
import { Icon } from '@platform/components/shared/icon';
import { Text } from '@platform/components/shared/text';
import { TextLink } from '@platform/components/shared/text-link';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';
import { loadUsageMeters } from '@platform/server/usage/load-usage-meters';
import { env } from '@platform/utils/env/env';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { pricingPageHref } from '@platform/utils/pricing-page-href/pricing-page-href';
import { usageResetDate } from '@platform/utils/usage-reset-date/usage-reset-date';
import { ICONS, TENANT_PLAN } from '@shinefold/config';
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
  languagesHref: string;
  hasPlansFooter?: boolean;
};

export const UsageCard = async ({
  tenant,
  languagesHref,
  hasPlansFooter = false,
}: TUsageCardProps) => {
  const [meters, t, format] = await Promise.all([
    loadUsageMeters(tenant, languagesHref),
    getTranslations('usageCard'),
    getFormatter(),
  ]);
  const resetsOn = format.dateTime(
    usageResetDate(new Date()),
    RESET_DATE_FORMAT,
  );
  const plansHref =
    hasPlansFooter && tenant.plan !== TENANT_PLAN.GROWTH
      ? pricingPageHref({
          marketingSiteUrl: env.MARKETING_SITE_URL,
          rootDomain: env.TENANT_ROOT_DOMAIN,
        })
      : undefined;
  const { body, band, footer, icon, hint } = usageCardVariants();

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
      {plansHref ? (
        <Card.Footer className={footer()}>
          <Icon
            name={ICONS.INFO}
            size={ICON_SIZE.MD}
            strokeWidth={ICON_STROKE_WIDTH.CONTROL}
            className={icon()}
          />
          <Text variant="muted" className={hint()}>
            {t('footer.limits')}{' '}
            <TextLink href={plansHref}>{t('footer.plansLink')}</TextLink>
          </Text>
        </Card.Footer>
      ) : undefined}
    </Card>
  );
};
