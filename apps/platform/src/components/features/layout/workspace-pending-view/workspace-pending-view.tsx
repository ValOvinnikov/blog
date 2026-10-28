import { DeadEndView } from '@platform/components/features/layout/dead-end-view';
import { SignOutButton } from '@platform/components/features/layout/sign-out-button';
import { LinkButton } from '@platform/components/shared/link-button';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

export const WorkspacePendingView = () => {
  const t = useTranslations('workspacePendingPage');

  return (
    <DeadEndView
      badge={{ label: t('badge'), tone: 'warn' }}
      title={t('heading')}
      description={t('description')}
      action={
        <>
          <LinkButton href={adminRoutes.dashboard()} variant="primary">
            {t('tryAgain')}
          </LinkButton>
          <SignOutButton />
        </>
      }
    />
  );
};
