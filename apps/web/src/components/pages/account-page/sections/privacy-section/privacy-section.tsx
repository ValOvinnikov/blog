import { routes } from '@blog/config';
import { LinkButton, SettingRow, WindowChrome } from '@blog/ui/molecules';
import { DeleteAccountControl } from '@web/components/shared/delete-account-control';
import { SmartLink } from '@web/components/shared/smart-link';
import { auth } from '@web/server/auth/auth';
import { toSessionUsername } from '@web/utils/to-session-username';
import { getTranslations } from 'next-intl/server';

/**
 * PrivacySection — the `/account` 6a "privacy & data" `WindowChrome`
 * (#1151/#1154, D15 §4.6/6a; extracted from `AccountPage`'s own JSX in
 * #1158). Reads its own session and translations rather than receiving them
 * as props from `AccountPage` — `auth()`'s per-request React `cache` means
 * re-reading the session `AccountPage`'s guard already read costs nothing
 * extra, and it keeps this section self-contained as more `/account`
 * sections are added as independent siblings. The `if (!session)` guard
 * below is a type-safety fallback only — `AccountPage`'s own guard already
 * redirects a signed-out reader before this ever renders, so this never
 * re-guards with its own `redirect()`.
 *
 * Composes two `SettingRow`s inside one `WindowChrome`: "Export my data" (a
 * plain download link to the `/api/account/export` Route Handler — no
 * client JS needed to trigger the browser's save-as prompt) and the
 * `tone="danger"` "Delete account" row, whose typed-confirm interaction is
 * `DeleteAccountControl` (the one client island this section needs —
 * slotted into `SettingRow.children`, never wrapped, per
 * `web-component-practices`).
 *
 * Per #1158's page-ordering decision, `AccountPage` always renders this as
 * the *last* section on the page.
 */
export async function PrivacySection() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { name, email } = session.user;
  const handle = toSessionUsername(name, email);
  const t = await getTranslations('accountPage.privacy');

  return (
    <WindowChrome>
      <WindowChrome.Bar>
        <WindowChrome.User>{handle}</WindowChrome.User>{' '}
        <WindowChrome.Prompt>{t('promptHost')}</WindowChrome.Prompt>{' '}
        {t('promptCommand')}
        <WindowChrome.Tag>{t('promptTag')}</WindowChrome.Tag>
      </WindowChrome.Bar>
      <WindowChrome.Body>
        <SettingRow
          label={t('exportLabel')}
          description={t('exportDescription')}
        >
          <LinkButton
            as={SmartLink}
            href={routes.accountExport()}
            prefetch={false}
            download
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
      </WindowChrome.Body>
    </WindowChrome>
  );
}
