import { routes } from '@blog/config';
import { auth } from '@web/server/auth/auth';
import { toSessionUsername } from '@web/utils/to-session-username';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { AccountPageView } from './account-page-view';
import { IdentitySection } from './sections/identity-section';
import { NewsletterSection } from './sections/newsletter-section';
import { PrivacySection } from './sections/privacy-section';

export const AccountPage = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(routes.home());
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
