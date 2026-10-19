import { DeadEndView } from '@platform/components/features/layout/dead-end-view';
import { LinkButton } from '@platform/components/shared/link-button';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('signInError');
}

type TProps = {
  searchParams: Promise<{ error?: string }>;
};

const SPENT_LINK_ERROR = 'Verification';

export default async function SignInErrorPage({ searchParams }: TProps) {
  const [{ error }, t] = await Promise.all([
    searchParams,
    getTranslations('signInErrorPage'),
  ]);

  if (error === SPENT_LINK_ERROR) {
    return (
      <DeadEndView
        title={t('linkSpentHeading')}
        description={t('linkSpentDescription')}
        action={
          <LinkButton href={adminRoutes.signIn()} variant="primary">
            {t('requestNewLink')}
          </LinkButton>
        }
      />
    );
  }

  return (
    <DeadEndView
      title={t('heading')}
      description={t('description')}
      action={
        <LinkButton href={adminRoutes.signIn()} variant="secondary">
          {t('backToSignIn')}
        </LinkButton>
      }
    />
  );
}
