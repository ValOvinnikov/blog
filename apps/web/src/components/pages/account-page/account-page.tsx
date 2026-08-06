import { routes } from '@blog/config';
import { Heading } from '@blog/ui/atoms';
import { LinkButton, SettingRow, WindowChrome } from '@blog/ui/molecules';
import { DeleteAccountControl } from '@web/components/shared/delete-account-control';
import { SmartLink } from '@web/components/shared/smart-link';
import { auth } from '@web/server/auth/auth';
import { toSessionUsername } from '@web/utils/to-session-username';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { accountPageVariants } from './account-page-variants';

const s = accountPageVariants();

/**
 * AccountPage — `/account` composition (Epic #1151, D15 §4.6): auth-gated
 * (a signed-out reader is redirected home, same stance `bookmarks-page`
 * already takes — this app has no dedicated `/login` route). Renders the
 * page's `h1` plus one `WindowChrome` section per settled sub-issue; today
 * that's just 6a "privacy & data" (this issue, #1154) — 6b (email/
 * newsletter prefs) and 6c (connected accounts/identity) are separate future
 * epics that each add their own sibling `WindowChrome` section here, so this
 * stays a plain list of sections rather than a single hard-coded chrome
 * block.
 *
 * 6a itself composes two `SettingRow`s inside one `WindowChrome`: "Export my
 * data" (a plain download link to the `/api/account/export` Route Handler —
 * no client JS needed to trigger the browser's save-as prompt) and the
 * `tone="danger"` "Delete account" row, whose typed-confirm interaction is
 * `DeleteAccountControl` (the one client island this page needs — slotted
 * into `SettingRow.children`, never wrapped, per `web-component-practices`).
 */
export async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(routes.home());
  }

  const { name, email } = session.user;
  const handle = toSessionUsername(name, email);
  const t = await getTranslations('accountPage');

  return (
    <main className={s.root()}>
      <Heading level={1} visual="section" className={s.heading()}>
        {t('title')}
      </Heading>
      <div className={s.sections()}>
        <WindowChrome className={s.chrome()}>
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
      </div>
    </main>
  );
}
