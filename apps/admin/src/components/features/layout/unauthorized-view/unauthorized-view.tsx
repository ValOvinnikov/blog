import { Card } from '@admin/components/shared/card';
import { Heading } from '@admin/components/shared/heading';
import { Icon } from '@admin/components/shared/icon';
import { Text } from '@admin/components/shared/text';
import { ICONS, Size } from '@blog/config';
import { useTranslations } from 'next-intl';

import { unauthorizedViewVariants } from './unauthorized-view-variants';

/**
 * Renders outside `AdminShell` — a signed-in user with no `admins`/
 * `memberships` row lands here before any shell chrome exists, so this page
 * builds its own full-viewport background rather than inheriting one.
 */
export const UnauthorizedView = () => {
  const t = useTranslations('unauthorizedPage');
  const { root, card, iconWrap, description } = unauthorizedViewVariants();

  return (
    <main className={root()}>
      <Card className={card()}>
        <Card.Body>
          <span className={iconWrap()}>
            <Icon name={ICONS.WARNING} size={Size.MD} />
          </span>
          <Heading level={1} size="pageTitle">
            {t('heading')}
          </Heading>
          <Text variant="supporting" className={description()}>
            {t('description')}
          </Text>
        </Card.Body>
      </Card>
    </main>
  );
};
