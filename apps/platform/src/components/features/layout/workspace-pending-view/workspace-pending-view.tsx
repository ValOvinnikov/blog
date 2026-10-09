import { ICONS, SIZE } from '@blog/config';
import { PreShellFrame } from '@platform/components/features/layout/pre-shell-frame';
import { Icon } from '@platform/components/shared/icon';
import { PageHeader } from '@platform/components/shared/page-header';
import { Text } from '@platform/components/shared/text';
import { useTranslations } from 'next-intl';

import { workspacePendingViewVariants } from './workspace-pending-view-variants';

export const WorkspacePendingView = () => {
  const t = useTranslations('workspacePendingPage');
  const { content, iconWrap } = workspacePendingViewVariants();

  return (
    <PreShellFrame header={<PageHeader title={t('heading')} />}>
      <div className={content()}>
        <span className={iconWrap()}>
          <Icon name={ICONS.WARNING} size={SIZE.MD} />
        </span>
        <Text variant="supporting">{t('description')}</Text>
      </div>
    </PreShellFrame>
  );
};
