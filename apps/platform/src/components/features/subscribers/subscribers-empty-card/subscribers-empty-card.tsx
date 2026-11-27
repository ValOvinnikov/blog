import { Card } from '@platform/components/shared/card';
import { Heading } from '@platform/components/shared/heading';
import { Icon } from '@platform/components/shared/icon';
import { LinkButton } from '@platform/components/shared/link-button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { ICONS } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { subscribersEmptyCardVariants } from './subscribers-empty-card-variants';

export type TSubscribersEmptyCardProps = {
  studioPagesHref: string;
};

export const SubscribersEmptyCard = ({
  studioPagesHref,
}: TSubscribersEmptyCardProps) => {
  const t = useTranslations('subscribersPage.empty');
  const { body, tile, icon, title, description, action } =
    subscribersEmptyCardVariants();

  return (
    <Card>
      <Card.Body className={body()}>
        <span className={tile()}>
          <Icon name={ICONS.MAIL} className={icon()} />
        </span>
        <Heading level={2} size="cardTitle" className={title()}>
          {t('title')}
        </Heading>
        <p className={description()}>{t('description')}</p>
        <span className={action()}>
          <LinkButton href={studioPagesHref} variant={BUTTON_VARIANT.PRIMARY}>
            {t('action')}
          </LinkButton>
        </span>
      </Card.Body>
    </Card>
  );
};
