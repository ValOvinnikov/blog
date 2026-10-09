import { ICONS, SIZE } from '@blog/config';
import { PreShellFrame } from '@platform/components/features/layout/pre-shell-frame';
import { Heading } from '@platform/components/shared/heading';
import { Icon } from '@platform/components/shared/icon';
import { Text } from '@platform/components/shared/text';
import { useTranslations } from 'next-intl';

import { workspacePendingViewVariants } from './workspace-pending-view-variants';

export const WorkspacePendingView = () => {
  const t = useTranslations('workspacePendingPage');
  const { content, iconWrap, description } = workspacePendingViewVariants();

  return (
    <PreShellFrame>
      <div className={content()}>
        <span className={iconWrap()}>
          <Icon name={ICONS.WARNING} size={SIZE.MD} />
        </span>
        <Heading level={1} size="pageTitle">
          {t('heading')}
        </Heading>
        <Text variant="supporting" className={description()}>
          {t('description')}
        </Text>
      </div>
    </PreShellFrame>
  );
};
