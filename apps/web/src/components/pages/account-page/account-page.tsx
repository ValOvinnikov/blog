import { routes } from '@blog/config';
import { auth } from '@web/server/auth/auth';
import { getChromeOn } from '@web/utils/get-chrome-on';
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

  const [t, tPrivacy, chromeOn] = await Promise.all([
    getTranslations('accountPage'),
    getTranslations('accountPage.privacy'),
    getChromeOn(),
  ]);

  return (
    <AccountPageView
      heading={t('title')}
      identitySection={<IdentitySection />}
      newsletterSection={<NewsletterSection />}
      privacySection={
        <PrivacySection
          handle={handle}
          isChromeOn={chromeOn}
          promptHost={tPrivacy('promptHost')}
          promptCommand={tPrivacy('promptCommand')}
          promptTag={tPrivacy('promptTag')}
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
