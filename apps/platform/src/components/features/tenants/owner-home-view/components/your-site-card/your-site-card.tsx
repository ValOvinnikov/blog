import { ICONS } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { Card } from '@platform/components/shared/card';
import { Icon } from '@platform/components/shared/icon';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';
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
  const { body, band, footer, icon, hint } = yourSiteCardVariants();

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
            <StatusBadge tone="plan" hasDot={false}>
              {tPlan(tenant.plan)}
            </StatusBadge>
          </BandCell>
          <BandCell label={t('localeLabel')}>
            {tLanguage(tenant.locale)}
          </BandCell>
        </dl>
      </Card.Body>
      <Card.Footer className={footer()}>
        <Icon
          name={ICONS.INFO}
          size={ICON_SIZE.MD}
          strokeWidth={ICON_STROKE_WIDTH.CONTROL}
          className={icon()}
        />
        <Text variant="muted" className={hint()}>
          {t('readOnlyHint')}
        </Text>
      </Card.Footer>
    </Card>
  );
};
