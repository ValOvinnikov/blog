import type { TTenant } from '@blog/db/schema/tenants';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import { useTranslations } from 'next-intl';

import { yourSiteCardVariants } from './your-site-card-variants';

export type TYourSiteCardProps = {
  tenant: TTenant;
};

export const YourSiteCard = ({ tenant }: TYourSiteCardProps) => {
  const t = useTranslations('ownerHomePage');
  const tTenantsTable = useTranslations('tenantsTable');
  const tLanguage = useTranslations('languageNames');
  const { hint } = yourSiteCardVariants();

  return (
    <Card>
      <Card.Header title={t('yourSiteCardTitle')} />
      <Card.Body>
        <DetailList>
          <DetailList.Row label={t('nameLabel')}>{tenant.name}</DetailList.Row>
          <DetailList.Row label={t('publicDomainLabel')} isMono={true}>
            {tenant.primaryDomain}
          </DetailList.Row>
          <DetailList.Row label={t('planLabel')}>
            <StatusBadge tone="plan" hasDot={false}>
              {tTenantsTable(`plan.${tenant.plan}`)}
            </StatusBadge>
          </DetailList.Row>
          <DetailList.Row label={t('localeLabel')}>
            {tLanguage(tenant.locale)}
          </DetailList.Row>
        </DetailList>
        <Text variant="meta" className={hint()}>
          {t('readOnlyHint')}
        </Text>
      </Card.Body>
    </Card>
  );
};
