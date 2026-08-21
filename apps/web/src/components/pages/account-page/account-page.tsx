import { routes } from '@blog/config';
import { Heading } from '@blog/ui/atoms';
import { auth } from '@web/server/auth/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { accountPageVariants } from './account-page-variants';
import { IdentitySection } from './sections/identity-section';
import { NewsletterSection } from './sections/newsletter-section';
import { PrivacySection } from './sections/privacy-section';

const s = accountPageVariants();

/**
 * `/account` composition: auth-gated (a signed-out reader is redirected
 * home; this app has no dedicated `/login` route). This is the *only* place
 * that guard lives — every section below trusts it rather than re-checking
 * the session itself.
 *
 * Renders the page's `h1` plus an ordered list of self-contained
 * `WindowChrome` section components; each reads its own
 * session/translations/data (`auth()` is deduped per-request via React
 * `cache`, so re-reading it costs nothing extra).
 *
 * **Ordering rule:** the fixed, final section order (top to bottom) is
 * identity, then newsletter, then privacy — `PrivacySection` always renders
 * *last* as a fixed danger-zone anchor at the bottom of the page, and
 * `IdentitySection` always renders *first*.
 */
export const AccountPage = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(routes.home());
  }

  const t = await getTranslations('accountPage');

  return (
    <main className={s.root()}>
      <Heading level={1} visual="section" className={s.heading()}>
        {t('title')}
      </Heading>
      <div className={s.sections()}>
        <IdentitySection />
        <NewsletterSection />
        <PrivacySection />
      </div>
    </main>
  );
};
