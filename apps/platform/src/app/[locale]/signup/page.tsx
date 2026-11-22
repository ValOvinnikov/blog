import { SignUpView } from '@platform/components/features/sign-in/sign-up-view';
import { getSession } from '@platform/server/auth/auth';
import { resolveLegalPageUrls } from '@platform/server/legal-pages/resolve-legal-page-urls';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { env } from '@platform/utils/env/env';
import { toLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import { adminRoutes } from '@platform/utils/routes/routes';
import { getEnabledOAuthProviderIds } from '@shinefold/auth/utils/oauth-providers/oauth-providers';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('signUpTitle');
}

export default async function SignUpPage() {
  const session = await getSession();

  if (session?.user?.id) {
    redirect(adminRoutes.home());
  }

  const legalPageUrls = await resolveLegalPageUrls(
    toLegalPageUrls({
      marketingSiteUrl: env.MARKETING_SITE_URL,
      rootDomain: env.TENANT_ROOT_DOMAIN,
    }),
  );

  return (
    <SignUpView
      providerIds={getEnabledOAuthProviderIds()}
      legalPageUrls={legalPageUrls}
    />
  );
}
