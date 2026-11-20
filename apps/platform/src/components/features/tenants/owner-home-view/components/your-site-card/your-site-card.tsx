import { Card } from '@platform/components/shared/card';
import { CardFooterNote } from '@platform/components/shared/card-footer-note';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { useTranslations } from 'next-intl';

import { BandCell } from './components/band-cell/band-cell';
import { yourSiteCardVariants } from './your-site-card-variants';

export type TYourSiteCardProps = {
  tenant: TTenant;
};

export const YourSiteCard = ({ tenant }: TYourSiteCardProps) => {
  const t = useTranslations('ownerHomePage');
  const tPlan = useTranslations('planNames');
  const tLanguage = useTranslations('languageNames');
  const { body, band } = yourSiteCardVariants();

  return (
    <Card>
      <Card.Header title={t('yourSiteCardTitle')} />
      <Card.Body className={body()}>
        <dl className={band()}>
          <BandCell label={t('nameLabel')} isFullRow={true}>
            {tenant.name}
          </BandCell>
          <BandCell
            label={t('publicDomainLabel')}
            isFullRow={true}
            isMono={true}
          >
            {tenant.primaryDomain}
          </BandCell>
          <BandCell label={t('planLabel')}>
            <StatusBadge tone={BADGE_TONE.PLAN} hasDot={false}>
              {tPlan(tenant.plan)}
            </StatusBadge>
          </BandCell>
          <BandCell label={t('localeLabel')}>
            {tLanguage(tenant.locale)}
          </BandCell>
        </dl>
      </Card.Body>
      <CardFooterNote>{t('readOnlyHint')}</CardFooterNote>
    </Card>
  );
};
