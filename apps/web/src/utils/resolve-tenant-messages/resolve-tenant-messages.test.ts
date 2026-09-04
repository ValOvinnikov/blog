import { PRESET_ID } from '@blog/config';
import realMessages from '@web/i18n/messages/en.json';

import { resolveTenantMessages } from './resolve-tenant-messages';

const { getRequestTenantIdMock, getSiteConfigMock } = vi.hoisted(() => ({
  getRequestTenantIdMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@web/server/tenant/get-request-tenant-id', () => ({
  getRequestTenantId: getRequestTenantIdMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

// `unstable_cache` requires a Next.js request-scoped store this test
// doesn't set up — pass the wrapped function straight through instead.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

const TENANT = { id: 'tenant-1' };

const siteConfigRow = (
  preset: string,
  voiceOverrides: Record<string, string> = {},
) => {
  return {
    preset,
    accentHue: 250,
    headingFont: 'SPACE_GROTESK',
    bodyFont: 'NEWSREADER',
    radiusScale: 'MD',
    density: 'DEFAULT',
    voiceOverrides,
  };
};

const getAtPath = (source: unknown, path: readonly string[]): unknown => {
  return path.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);
};

// [message path, original terminal-flavored wording, neutralized wording].
const CLASSIFICATION_TABLE: Array<[string[], string, string]> = [
  [['notFound', 'commandNotFound'], 'command not found', 'Not found'],
  [
    ['notFound', 'description'],
    "That route doesn't resolve to anything here.",
    "The page you're looking for doesn't exist.",
  ],
  [['authMenu', 'guestLabel'], 'guest', 'Guest'],
  [['authMenu', 'promptHost'], '~$', ''],
  [['authMenu', 'promptCommandSignIn'], 'auth login', 'Sign in'],
  [['authMenu', 'promptCommandAccount'], 'whoami', 'Account'],
  [
    ['authMenu', 'chooseProviderPrompt'],
    'choose a provider',
    'Choose a sign-in method',
  ],
  [['bookmarkButton', 'save'], 'save', 'Save'],
  [['bookmarkButton', 'saved'], 'saved', 'Saved'],
  [['bookmarkButton', 'toastCommand'], 'bookmark', 'Bookmark'],
  [['bookmarkButton', 'toastSavedState'], 'saved', 'Saved'],
  [
    ['bookmarkButton', 'toastSavedMessage'],
    'stashed to ~/bookmarks',
    'Saved to bookmarks',
  ],
  [['bookmarkButton', 'toastRemovedState'], 'removed', 'Removed'],
  [
    ['bookmarkButton', 'toastRemovedMessage'],
    'removed from ~/bookmarks',
    'Removed from bookmarks',
  ],
  [['bookmarkButton', 'toastErrorState'], 'failed', 'Failed'],
  [['bookmarkButton', 'toastRevertedState'], 'reverted', 'Reverted'],
  [['bookmarkButton', 'toastRevertedMessage'], 'reverted', 'Reverted'],
  [['bookmarkButton', 'toastUndoLabel'], 'undo', 'Undo'],
  [['bookmarkButton', 'toastRetryLabel'], 'retry', 'Retry'],
  [['bookmarksPage', 'promptSymbol'], '$', ''],
  [['bookmarksPage', 'promptCommand'], 'ls ~/bookmarks', 'My bookmarks'],
  [['bookmarksPage', 'promptFlag'], '-l', ''],
  [['newsletterForm', 'trustCueNoSpam'], 'no spam', 'No spam'],
  [
    ['newsletterForm', 'trustCueUnsubscribe'],
    'unsubscribe in one line',
    'Unsubscribe anytime',
  ],
  [['accountPage', 'privacy', 'promptHost'], '~$', ''],
  [['accountPage', 'privacy', 'promptCommand'], 'account --privacy', 'Privacy'],
  [['accountPage', 'privacy', 'promptTag'], 'data', ''],
  [
    ['accountPage', 'privacy', 'exportButton'],
    '↓ request export',
    'Request export',
  ],
  [
    ['accountPage', 'privacy', 'deleteLabel'],
    '⚠ Delete account',
    'Delete account',
  ],
  [
    ['accountPage', 'privacy', 'deleteConfirmPlaceholder'],
    'type: {handle}',
    'Type {handle} to confirm',
  ],
  [
    ['accountPage', 'privacy', 'deleteButton'],
    'delete account',
    'Delete account',
  ],
  [['accountPage', 'privacy', 'deleteToastCommand'], 'account', 'Account'],
  [
    ['accountPage', 'privacy', 'deleteToastLoadingState'],
    'deleting',
    'Deleting',
  ],
  [['accountPage', 'privacy', 'deleteToastSuccessState'], 'deleted', 'Deleted'],
  [['accountPage', 'privacy', 'deleteToastErrorState'], 'failed', 'Failed'],
  [['accountPage', 'newsletter', 'promptHost'], '~$', ''],
  [
    ['accountPage', 'newsletter', 'promptCommand'],
    'account --email',
    'Newsletter',
  ],
  [['accountPage', 'newsletter', 'activeBadge'], 'subscribed', 'Subscribed'],
  [
    ['accountPage', 'newsletter', 'unsubscribeButton'],
    'unsubscribe',
    'Unsubscribe',
  ],
  [
    ['accountPage', 'newsletter', 'pendingBadge'],
    'pending confirmation',
    'Pending confirmation',
  ],
  [
    ['accountPage', 'newsletter', 'resendButton'],
    '↻ resend confirmation',
    'Resend confirmation',
  ],
  [
    ['accountPage', 'newsletter', 'unsubscribeToastCommand'],
    'newsletter',
    'Newsletter',
  ],
  [
    ['accountPage', 'newsletter', 'unsubscribeToastLoadingState'],
    'unsubscribing',
    'Unsubscribing',
  ],
  [
    ['accountPage', 'newsletter', 'unsubscribeToastSuccessState'],
    'unsubscribed',
    'Unsubscribed',
  ],
  [
    ['accountPage', 'newsletter', 'unsubscribeToastErrorState'],
    'failed',
    'Failed',
  ],
  [
    ['accountPage', 'newsletter', 'resendToastCommand'],
    'newsletter',
    'Newsletter',
  ],
  [
    ['accountPage', 'newsletter', 'resendToastLoadingState'],
    'resending',
    'Resending',
  ],
  [
    ['accountPage', 'newsletter', 'resendToastSuccessState'],
    'resent',
    'Resent',
  ],
  [['accountPage', 'newsletter', 'resendToastErrorState'], 'failed', 'Failed'],
  [['accountPage', 'identity', 'promptHost'], '~$', ''],
  [
    ['accountPage', 'identity', 'promptCommand'],
    'account --identities',
    'Connected accounts',
  ],
  [['accountPage', 'identity', 'linkedStatus'], '✓ linked', 'Linked'],
  [['accountPage', 'identity', 'linkButton'], 'link', 'Link'],
  [['accountPage', 'identity', 'unlinkButton'], 'unlink', 'Unlink'],
  [
    ['accountPage', 'identity', 'lastMethodNotice'],
    "last remaining method — can't unlink",
    "Last remaining method — can't unlink",
  ],
  [['accountPage', 'identity', 'unlinkToastCommand'], 'identity', 'Identity'],
  [
    ['accountPage', 'identity', 'unlinkToastLoadingState'],
    'unlinking',
    'Unlinking',
  ],
  [
    ['accountPage', 'identity', 'unlinkToastSuccessState'],
    'unlinked',
    'Unlinked',
  ],
  [['accountPage', 'identity', 'unlinkToastErrorState'], 'failed', 'Failed'],
  [['accountPage', 'identity', 'saveButton'], 'save', 'Save'],
  [['accountPage', 'identity', 'saveToastCommand'], 'identity', 'Identity'],
  [['accountPage', 'identity', 'saveToastLoadingState'], 'saving', 'Saving'],
  [['accountPage', 'identity', 'saveToastSuccessState'], 'saved', 'Saved'],
  [['accountPage', 'identity', 'saveToastErrorState'], 'failed', 'Failed'],
];

describe('resolveTenantMessages', () => {
  beforeEach(() => {
    getRequestTenantIdMock.mockReset();
    getSiteConfigMock.mockReset();
    getRequestTenantIdMock.mockResolvedValue(TENANT.id);
  });

  it('CONSOLE preset with no voice overrides reproduces the terminal-flavored wording at all classification-table paths', async () => {
    getSiteConfigMock.mockResolvedValue(siteConfigRow(PRESET_ID.CONSOLE));

    const messages = await resolveTenantMessages(realMessages);

    for (const [path, original] of CLASSIFICATION_TABLE) {
      expect(getAtPath(messages, path)).toBe(original);
    }
  });

  it('EDITORIAL preset with no voice overrides leaves the neutralized base unchanged at all classification-table paths', async () => {
    getSiteConfigMock.mockResolvedValue(siteConfigRow(PRESET_ID.EDITORIAL));

    const messages = await resolveTenantMessages(realMessages);

    for (const [path, , neutral] of CLASSIFICATION_TABLE) {
      expect(getAtPath(messages, path)).toBe(neutral);
    }
  });

  it('a single voice override changes only that path, leaving the console pack value on the others', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow(PRESET_ID.CONSOLE, {
        notFoundCommandNotFound: 'nope, try again',
      }),
    );

    const messages = await resolveTenantMessages(realMessages);

    expect(getAtPath(messages, ['notFound', 'commandNotFound'])).toBe(
      'nope, try again',
    );

    for (const [path, original] of CLASSIFICATION_TABLE) {
      if (path.join('.') === 'notFound.commandNotFound') continue;
      expect(getAtPath(messages, path)).toBe(original);
    }
  });

  it('a tenant blogListEmpty voice override reaches blogListPage.empty, with nothing left to shadow it (#1899)', async () => {
    getSiteConfigMock.mockResolvedValue(
      siteConfigRow(PRESET_ID.CONSOLE, {
        blogListEmpty: 'Nothing published to ~/blog yet.',
      }),
    );

    const messages = await resolveTenantMessages(realMessages);

    expect(getAtPath(messages, ['blogListPage', 'empty'])).toBe(
      'Nothing published to ~/blog yet.',
    );
  });

  it('forwards an explicitly supplied tenant to getSiteConfig, through to getRequestTenantId', async () => {
    getSiteConfigMock.mockResolvedValue(siteConfigRow(PRESET_ID.CONSOLE));

    await resolveTenantMessages(realMessages, 'tenant-2');

    expect(getRequestTenantIdMock).toHaveBeenCalledWith('tenant-2');
  });

  it('falls back to the CONSOLE preset with no overrides when the site config fetch fails', async () => {
    getSiteConfigMock.mockRejectedValue(new Error('boom'));
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const messages = await resolveTenantMessages(realMessages);

    expect(getAtPath(messages, ['notFound', 'commandNotFound'])).toBe(
      'command not found',
    );
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
