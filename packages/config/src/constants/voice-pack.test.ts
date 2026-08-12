import { CONSOLE_VOICE_PACK, EDITORIAL_VOICE_PACK } from './voice-pack';

// Hardcoded literals, not read from en.json — this stays a durable
// regression guard even after a sibling issue changes en.json's base values.
describe('CONSOLE_VOICE_PACK', () => {
  it('preserves the notFound console-voiced strings', () => {
    expect(CONSOLE_VOICE_PACK.notFound?.commandNotFound).toBe(
      'command not found',
    );
    expect(CONSOLE_VOICE_PACK.notFound?.description).toBe(
      "That route doesn't resolve to anything here.",
    );
  });

  it('preserves the authMenu console-voiced strings', () => {
    expect(CONSOLE_VOICE_PACK.authMenu?.guestLabel).toBe('guest');
    expect(CONSOLE_VOICE_PACK.authMenu?.promptHost).toBe('~$');
    expect(CONSOLE_VOICE_PACK.authMenu?.promptCommandSignIn).toBe('auth login');
    expect(CONSOLE_VOICE_PACK.authMenu?.promptCommandAccount).toBe('whoami');
    expect(CONSOLE_VOICE_PACK.authMenu?.chooseProviderPrompt).toBe(
      'choose a provider',
    );
  });

  it('preserves the bookmarkButton console-voiced strings', () => {
    expect(CONSOLE_VOICE_PACK.bookmarkButton?.save).toBe('save');
    expect(CONSOLE_VOICE_PACK.bookmarkButton?.saved).toBe('saved');
    expect(CONSOLE_VOICE_PACK.bookmarkButton?.toastCommand).toBe('bookmark');
    expect(CONSOLE_VOICE_PACK.bookmarkButton?.toastSavedState).toBe('saved');
    expect(CONSOLE_VOICE_PACK.bookmarkButton?.toastSavedMessage).toBe(
      'stashed to ~/bookmarks',
    );
    expect(CONSOLE_VOICE_PACK.bookmarkButton?.toastRemovedState).toBe(
      'removed',
    );
    expect(CONSOLE_VOICE_PACK.bookmarkButton?.toastRemovedMessage).toBe(
      'removed from ~/bookmarks',
    );
    expect(CONSOLE_VOICE_PACK.bookmarkButton?.toastErrorState).toBe('failed');
    expect(CONSOLE_VOICE_PACK.bookmarkButton?.toastRevertedState).toBe(
      'reverted',
    );
    expect(CONSOLE_VOICE_PACK.bookmarkButton?.toastRevertedMessage).toBe(
      'reverted',
    );
    expect(CONSOLE_VOICE_PACK.bookmarkButton?.toastUndoLabel).toBe('undo');
    expect(CONSOLE_VOICE_PACK.bookmarkButton?.toastRetryLabel).toBe('retry');
  });

  it('preserves the bookmarksPage console-voiced strings', () => {
    expect(CONSOLE_VOICE_PACK.bookmarksPage?.promptSymbol).toBe('$');
    expect(CONSOLE_VOICE_PACK.bookmarksPage?.promptCommand).toBe(
      'ls ~/bookmarks',
    );
    expect(CONSOLE_VOICE_PACK.bookmarksPage?.promptFlag).toBe('-l');
  });

  it('preserves the newsletterForm console-voiced strings', () => {
    expect(CONSOLE_VOICE_PACK.newsletterForm?.trustCueNoSpam).toBe('no spam');
    expect(CONSOLE_VOICE_PACK.newsletterForm?.trustCueUnsubscribe).toBe(
      'unsubscribe in one line',
    );
  });

  it('preserves the accountPage.privacy console-voiced strings', () => {
    expect(CONSOLE_VOICE_PACK.accountPage?.privacy?.promptHost).toBe('~$');
    expect(CONSOLE_VOICE_PACK.accountPage?.privacy?.promptCommand).toBe(
      'account --privacy',
    );
    expect(CONSOLE_VOICE_PACK.accountPage?.privacy?.promptTag).toBe('data');
    expect(CONSOLE_VOICE_PACK.accountPage?.privacy?.exportButton).toBe(
      '↓ request export',
    );
    expect(CONSOLE_VOICE_PACK.accountPage?.privacy?.deleteLabel).toBe(
      '⚠ Delete account',
    );
    expect(
      CONSOLE_VOICE_PACK.accountPage?.privacy?.deleteConfirmPlaceholder,
    ).toBe('type: {handle}');
    expect(CONSOLE_VOICE_PACK.accountPage?.privacy?.deleteButton).toBe(
      'delete account',
    );
    expect(CONSOLE_VOICE_PACK.accountPage?.privacy?.deleteToastCommand).toBe(
      'account',
    );
    expect(
      CONSOLE_VOICE_PACK.accountPage?.privacy?.deleteToastLoadingState,
    ).toBe('deleting');
    expect(
      CONSOLE_VOICE_PACK.accountPage?.privacy?.deleteToastSuccessState,
    ).toBe('deleted');
    expect(CONSOLE_VOICE_PACK.accountPage?.privacy?.deleteToastErrorState).toBe(
      'failed',
    );
  });

  it('preserves the accountPage.newsletter console-voiced strings', () => {
    expect(CONSOLE_VOICE_PACK.accountPage?.newsletter?.promptHost).toBe('~$');
    expect(CONSOLE_VOICE_PACK.accountPage?.newsletter?.promptCommand).toBe(
      'account --email',
    );
    expect(CONSOLE_VOICE_PACK.accountPage?.newsletter?.activeBadge).toBe(
      'subscribed',
    );
    expect(CONSOLE_VOICE_PACK.accountPage?.newsletter?.unsubscribeButton).toBe(
      'unsubscribe',
    );
    expect(CONSOLE_VOICE_PACK.accountPage?.newsletter?.pendingBadge).toBe(
      'pending confirmation',
    );
    expect(CONSOLE_VOICE_PACK.accountPage?.newsletter?.resendButton).toBe(
      '↻ resend confirmation',
    );
    expect(
      CONSOLE_VOICE_PACK.accountPage?.newsletter?.unsubscribeToastCommand,
    ).toBe('newsletter');
    expect(
      CONSOLE_VOICE_PACK.accountPage?.newsletter?.unsubscribeToastLoadingState,
    ).toBe('unsubscribing');
    expect(
      CONSOLE_VOICE_PACK.accountPage?.newsletter?.unsubscribeToastSuccessState,
    ).toBe('unsubscribed');
    expect(
      CONSOLE_VOICE_PACK.accountPage?.newsletter?.unsubscribeToastErrorState,
    ).toBe('failed');
    expect(CONSOLE_VOICE_PACK.accountPage?.newsletter?.resendToastCommand).toBe(
      'newsletter',
    );
    expect(
      CONSOLE_VOICE_PACK.accountPage?.newsletter?.resendToastLoadingState,
    ).toBe('resending');
    expect(
      CONSOLE_VOICE_PACK.accountPage?.newsletter?.resendToastSuccessState,
    ).toBe('resent');
    expect(
      CONSOLE_VOICE_PACK.accountPage?.newsletter?.resendToastErrorState,
    ).toBe('failed');
  });

  it('preserves the accountPage.identity console-voiced strings', () => {
    expect(CONSOLE_VOICE_PACK.accountPage?.identity?.promptHost).toBe('~$');
    expect(CONSOLE_VOICE_PACK.accountPage?.identity?.promptCommand).toBe(
      'account --identities',
    );
    expect(CONSOLE_VOICE_PACK.accountPage?.identity?.linkedStatus).toBe(
      '✓ linked',
    );
    expect(CONSOLE_VOICE_PACK.accountPage?.identity?.linkButton).toBe('link');
    expect(CONSOLE_VOICE_PACK.accountPage?.identity?.unlinkButton).toBe(
      'unlink',
    );
    expect(CONSOLE_VOICE_PACK.accountPage?.identity?.lastMethodNotice).toBe(
      "last remaining method — can't unlink",
    );
    expect(CONSOLE_VOICE_PACK.accountPage?.identity?.unlinkToastCommand).toBe(
      'identity',
    );
    expect(
      CONSOLE_VOICE_PACK.accountPage?.identity?.unlinkToastLoadingState,
    ).toBe('unlinking');
    expect(
      CONSOLE_VOICE_PACK.accountPage?.identity?.unlinkToastSuccessState,
    ).toBe('unlinked');
    expect(
      CONSOLE_VOICE_PACK.accountPage?.identity?.unlinkToastErrorState,
    ).toBe('failed');
    expect(CONSOLE_VOICE_PACK.accountPage?.identity?.saveButton).toBe('save');
    expect(CONSOLE_VOICE_PACK.accountPage?.identity?.saveToastCommand).toBe(
      'identity',
    );
    expect(
      CONSOLE_VOICE_PACK.accountPage?.identity?.saveToastLoadingState,
    ).toBe('saving');
    expect(
      CONSOLE_VOICE_PACK.accountPage?.identity?.saveToastSuccessState,
    ).toBe('saved');
    expect(CONSOLE_VOICE_PACK.accountPage?.identity?.saveToastErrorState).toBe(
      'failed',
    );
  });

  it('reuses the shared terminal prompt host identically at all 4 call sites', () => {
    const promptHost = CONSOLE_VOICE_PACK.authMenu?.promptHost;

    expect(promptHost).toBe('~$');
    expect(CONSOLE_VOICE_PACK.accountPage?.privacy?.promptHost).toBe(
      promptHost,
    );
    expect(CONSOLE_VOICE_PACK.accountPage?.newsletter?.promptHost).toBe(
      promptHost,
    );
    expect(CONSOLE_VOICE_PACK.accountPage?.identity?.promptHost).toBe(
      promptHost,
    );
  });
});

describe('EDITORIAL_VOICE_PACK', () => {
  it('is empty — no overrides for the editorial preset', () => {
    expect(EDITORIAL_VOICE_PACK).toEqual({});
  });
});
