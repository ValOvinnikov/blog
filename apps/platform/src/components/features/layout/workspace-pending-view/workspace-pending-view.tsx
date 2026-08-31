import { ICONS, SIZE } from '@blog/config';
import { Card } from '@platform/components/shared/card';
import { Heading } from '@platform/components/shared/heading';
import { Icon } from '@platform/components/shared/icon';
import { Text } from '@platform/components/shared/text';
import { useTranslations } from 'next-intl';

import { workspacePendingViewVariants } from './workspace-pending-view-variants';

/**
 * Renders outside `AdminShell` — a signed-in user with no `admins`/
 * `memberships` row lands here before any shell chrome exists, so this page
 * builds its own full-viewport background rather than inheriting one.
 */
export const WorkspacePendingView = () => {
  const t = useTranslations('workspacePendingPage');
  const { root, card, iconWrap, description } = workspacePendingViewVariants();

  return (
    <main className={root()}>
      <Card className={card()}>
        <Card.Body>
          <span className={iconWrap()}>
            <Icon name={ICONS.SPINNER} size={SIZE.MD} />
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
