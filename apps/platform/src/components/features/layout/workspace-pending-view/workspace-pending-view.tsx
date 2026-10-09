import { ICONS, SIZE } from '@blog/config';
import { PreShellFrame } from '@platform/components/features/layout/pre-shell-frame';
import { SignOutButton } from '@platform/components/features/layout/sign-out-button';
import { Icon } from '@platform/components/shared/icon';
import { LinkButton } from '@platform/components/shared/link-button';
import { PageHeader } from '@platform/components/shared/page-header';
import { Text } from '@platform/components/shared/text';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

import { workspacePendingViewVariants } from './workspace-pending-view-variants';

export const WorkspacePendingView = () => {
  const t = useTranslations('workspacePendingPage');
  const { content, iconWrap } = workspacePendingViewVariants();

  return (
    <PreShellFrame
      header={
        <PageHeader
          title={t('heading')}
          actions={
            <>
              <LinkButton href={adminRoutes.dashboard()} variant="primary">
                {t('tryAgain')}
              </LinkButton>
              <SignOutButton />
            </>
          }
        />
      }
    >
      <div className={content()}>
        <span className={iconWrap()}>
          <Icon name={ICONS.WARNING} size={SIZE.MD} />
        </span>
        <Text variant="supporting">{t('description')}</Text>
      </div>
    </PreShellFrame>
  );
};
