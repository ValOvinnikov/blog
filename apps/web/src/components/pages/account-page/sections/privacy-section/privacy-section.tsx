import { routes } from '@blog/config';
import { LinkButton, SettingRow, WindowChrome } from '@blog/ui/molecules';
import { DeleteAccountControl } from '@web/components/shared/delete-account-control';
import { PlainSection } from '@web/components/shared/plain-section';
import { SmartLink } from '@web/components/shared/smart-link';
import { auth } from '@web/server/auth/auth';
import { getChromeOn } from '@web/utils/get-chrome-on';
import { toSessionUsername } from '@web/utils/to-session-username';
import { getTranslations } from 'next-intl/server';

/**
 * The `/account` "privacy & data" `WindowChrome`. Reads its own session and
 * translations rather than receiving them as props from `AccountPage` —
 * `auth()`'s per-request React `cache` means re-reading the session costs
 * nothing extra, and it keeps this section self-contained as siblings are
 * added. The `if (!session)` guard below is a type-safety fallback only —
 * `AccountPage`'s own guard already redirects a signed-out reader before
 * this ever renders.
 *
 * Composes two `SettingRow`s inside one `WindowChrome`: "Export my data" (a
 * plain download link to the `/api/account/export` Route Handler) and the
 * `tone="danger"` "Delete account" row, whose typed-confirm interaction is
 * `DeleteAccountControl`.
 */
export async function PrivacySection() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { name, email } = session.user;
  const handle = toSessionUsername(name, email);
  const [t, chromeOn] = await Promise.all([
    getTranslations('accountPage.privacy'),
    getChromeOn(),
  ]);

  const bodyContent = (
    <>
      <SettingRow label={t('exportLabel')} description={t('exportDescription')}>
        <LinkButton
          as={SmartLink}
          href={routes.accountExport()}
          prefetch={false}
          download={true}
          variant="ghost"
        >
          {t('exportButton')}
        </LinkButton>
      </SettingRow>
      <SettingRow
        tone="danger"
        label={t('deleteLabel')}
        description={t('deleteDescription')}
      >
        <DeleteAccountControl handle={handle} />
      </SettingRow>
    </>
  );

  if (!chromeOn) {
    return (
      <PlainSection heading={t('promptCommand')} headingLevel={2}>
        {bodyContent}
      </PlainSection>
    );
  }

  return (
    <WindowChrome>
      <WindowChrome.Bar headingLevel={2}>
        <WindowChrome.User>{handle}</WindowChrome.User>{' '}
        <WindowChrome.Prompt>{t('promptHost')}</WindowChrome.Prompt>{' '}
        {t('promptCommand')}
        <WindowChrome.Tag>{t('promptTag')}</WindowChrome.Tag>
      </WindowChrome.Bar>
      <WindowChrome.Body>{bodyContent}</WindowChrome.Body>
    </WindowChrome>
  );
}
