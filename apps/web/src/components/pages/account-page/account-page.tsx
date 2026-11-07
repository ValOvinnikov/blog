import { getEnabledOAuthProviderIds } from '@blog/auth/utils/oauth-providers/oauth-providers';
import { routes } from '@blog/config';
import { auth } from '@web/server/auth/auth';
import { getHostSiteOAuthCredentials } from '@web/server/auth/site-oauth-credentials/site-oauth-credentials';
import { getRequestContext } from '@web/server/request-context/request-context';
import { toSessionUsername } from '@web/utils/to-session-username';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { AccountPageView } from './account-page-view';
import { AccountSignIn } from './components/account-sign-in/account-sign-in';
import { IdentitySection } from './sections/identity-section';
import { NewsletterSection } from './sections/newsletter-section';
import { PrivacySection } from './sections/privacy-section';

export const AccountPage = async () => {
  const [session, { isOperatorSuspended }] = await Promise.all([
    auth(),
    getRequestContext(),
  ]);

  if (!session?.user?.id) {
    if (!isOperatorSuspended) redirect(routes.home());

    const [t, siteOAuthCredentials] = await Promise.all([
      getTranslations('accountPage'),
      getHostSiteOAuthCredentials(),
    ]);
    return (
      <AccountSignIn
        heading={t('title')}
        oauthProviderIds={getEnabledOAuthProviderIds(siteOAuthCredentials)}
      />
    );
  }

  const { name, email } = session.user;
  const handle = toSessionUsername(name, email);

  const [t, tPrivacy] = await Promise.all([
    getTranslations('accountPage'),
    getTranslations('accountPage.privacy'),
  ]);

  return (
    <AccountPageView
      heading={t('title')}
      identitySection={<IdentitySection />}
      newsletterSection={<NewsletterSection />}
      privacySection={
        <PrivacySection
          handle={handle}
          heading={tPrivacy('heading')}
          exportLabel={tPrivacy('exportLabel')}
          exportDescription={tPrivacy('exportDescription')}
          exportButton={tPrivacy('exportButton')}
          deleteLabel={tPrivacy('deleteLabel')}
          deleteDescription={tPrivacy('deleteDescription')}
        />
      }
    />
  );
};
