import { routes } from '@blog/config';
import { Heading } from '@blog/ui/atoms';
import { auth } from '@web/server/auth/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { accountPageVariants } from './account-page-variants';
import { NewsletterSection } from './sections/newsletter-section';
import { PrivacySection } from './sections/privacy-section';

const s = accountPageVariants();

/**
 * AccountPage — `/account` composition (Epic #1151, D15 §4.6): auth-gated
 * (a signed-out reader is redirected home, same stance `bookmarks-page`
 * already takes — this app has no dedicated `/login` route). This is the
 * *only* place that guard lives — every section below trusts it rather than
 * re-checking the session itself.
 *
 * Renders the page's `h1` plus an ordered list of self-contained
 * `WindowChrome` section components (#1158's section-extraction decision):
 * each section reads its own session/translations/data (`auth()` is deduped
 * per-request via React `cache`, so re-reading it here costs nothing extra)
 * and owns its own `WindowChrome` markup — `AccountPage` itself no longer
 * composes any section's JSX directly.
 *
 * **Ordering rule:** 6a "privacy & data" (`PrivacySection`) always renders
 * *last* — a fixed anchor at the bottom of the page, the standard
 * settings-page convention for a danger-zone section, regardless of build
 * order or how many other sections exist. Every new section (6b now, 6c in
 * #1162, and beyond) inserts itself *above* `PrivacySection` in this list,
 * never below it.
 */
export async function AccountPage() {
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
        <NewsletterSection />
        <PrivacySection />
      </div>
    </main>
  );
}
