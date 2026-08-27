import { Card } from '@admin/components/shared/card';
import { DetailList } from '@admin/components/shared/detail-list';
import { ExternalLinkButton } from '@admin/components/shared/external-link-button';
import { StatusBadge } from '@admin/components/shared/status-badge';
import { Text } from '@admin/components/shared/text';
import { Size } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
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
