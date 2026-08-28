import { Size } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import { useTranslations } from 'next-intl';

import { yourSiteCardVariants } from './your-site-card-variants';

export type TYourSiteCardProps = {
  tenant: TTenant;
};

/**
 * The owner's read-only counterpart to the platform tenant details panel —
 * values, never disabled form inputs. Whatever needs changing here goes
 * through the platform contact instead.
 */
export const YourSiteCard = ({ tenant }: TYourSiteCardProps) => {
  const t = useTranslations('ownerHomePage');
  const tTenantsTable = useTranslations('tenantsTable');
  const { hint } = yourSiteCardVariants();
  const openDomainLabel = t('openPublicDomainAriaLabel', {
    domain: tenant.primaryDomain,
  });

  return (
    <Card>
      <Card.Header
        title={t('yourSiteCardTitle')}
        headingLevel={2}
        actions={
          <StatusBadge tone="neutral" hasDot={false}>
            {t('readOnlyBadge')}
          </StatusBadge>
        }
      />
      <Card.Body>
        <DetailList>
          <DetailList.Row label={t('nameLabel')}>{tenant.name}</DetailList.Row>
          <DetailList.Row
            label={t('publicDomainLabel')}
            isMono={true}
            action={
              <ExternalLinkButton
                href={`https://${tenant.primaryDomain}`}
                variant="ghost"
                size={Size.SM}
                ariaLabel={openDomainLabel}
                title={openDomainLabel}
              >
                ↗
              </ExternalLinkButton>
            }
          >
            {tenant.primaryDomain}
          </DetailList.Row>
          <DetailList.Row label={t('planLabel')}>
            <StatusBadge tone="plan" hasDot={false}>
              {tTenantsTable(`plan.${tenant.plan}`)}
            </StatusBadge>
          </DetailList.Row>
          <DetailList.Row label={t('localeLabel')}>
            {tenant.locale}
          </DetailList.Row>
        </DetailList>
        <Text variant="hint" className={hint()}>
          {t('readOnlyHint')}
        </Text>
      </Card.Body>
    </Card>
  );
};
