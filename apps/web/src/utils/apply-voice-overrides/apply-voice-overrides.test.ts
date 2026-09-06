import { applyVoiceOverrides } from './apply-voice-overrides';

// Mirrors the source file's private VOICE_OVERRIDE_PATHS map — it isn't
// exported, so the two must be kept in sync by hand.
const CURATED_KEY_PATHS: Record<string, readonly string[]> = {
  notFoundMetaTitle: ['notFound', 'metaTitle'],
  notFoundMetaDescription: ['notFound', 'metaDescription'],
  notFoundCommandNotFound: ['notFound', 'heading'],
  notFoundDescription: ['notFound', 'supportingText'],
  notFoundReturnHome: ['notFound', 'returnHome'],
  terminalPromptHost: ['authMenu', 'promptHost'],
  authPromptCommandSignIn: ['authMenu', 'promptCommandSignIn'],
  authPromptCommandAccount: ['authMenu', 'promptCommandAccount'],
  bookmarksPromptCommand: ['bookmarksPage', 'promptCommand'],
  accountPrivacyPromptCommand: ['accountPage', 'privacy', 'promptCommand'],
  accountNewsletterPromptCommand: [
    'accountPage',
    'newsletter',
    'promptCommand',
  ],
  accountIdentityPromptCommand: ['accountPage', 'identity', 'promptCommand'],
  bookmarkToastSavedMessage: ['bookmarkButton', 'toastSavedMessage'],
  bookmarkToastRemovedMessage: ['bookmarkButton', 'toastRemovedMessage'],
  blogListEmpty: ['blogListPage', 'empty'],
  topicEmpty: ['topicPage', 'empty'],
  tagEmpty: ['tagPage', 'empty'],
  topicsEmpty: ['topicsPage', 'empty'],
  bookmarksEmpty: ['bookmarksPage', 'empty'],
};

describe(applyVoiceOverrides, () => {
  it.each(Object.entries(CURATED_KEY_PATHS))(
    'resolves %s to its documented message path',
    (key, path) => {
      const result = applyVoiceOverrides({}, { [key]: 'override value' });

      let node: unknown = result;
      for (const segment of path) {
        expect(node).toBeTypeOf('object');
        node = (node as Record<string, unknown>)[segment];
      }

      expect(node).toBe('override value');
    },
  );

  it('sets a nested path without touching its siblings', () => {
    const messages = {
      notFound: { heading: 'Page not found', supportingText: 'desc' },
      unrelated: { value: 'untouched' },
    };

    const result = applyVoiceOverrides(messages, {
      notFoundCommandNotFound: 'nope',
    });

    expect(result).toEqual({
      notFound: { heading: 'nope', supportingText: 'desc' },
      unrelated: { value: 'untouched' },
    });
  });

  it('does not mutate the input object', () => {
    const messages = { notFound: { heading: 'Page not found' } };

    applyVoiceOverrides(messages, { notFoundCommandNotFound: 'nope' });

    expect(messages.notFound.heading).toBe('Page not found');
  });

  it('applies a deeply nested override without disturbing its siblings', () => {
    const messages = {
      accountPage: {
        privacy: { promptCommand: 'Privacy' },
        newsletter: { promptCommand: 'Newsletter' },
      },
    };

    const result = applyVoiceOverrides(messages, {
      accountPrivacyPromptCommand: 'my data',
    });

    expect(result.accountPage).toEqual({
      privacy: { promptCommand: 'my data' },
      newsletter: { promptCommand: 'Newsletter' },
    });
  });

  it('ignores keys with no known path', () => {
    const messages = { notFound: { heading: 'Page not found' } };

    const result = applyVoiceOverrides(messages, { unknownKey: 'ignored' });

    expect(result).toEqual(messages);
  });

  it('applies multiple overrides independently', () => {
    const messages = {
      notFound: { heading: 'Page not found', supportingText: 'desc' },
      bookmarksPage: { empty: 'No bookmarks yet' },
    };

    const result = applyVoiceOverrides(messages, {
      notFoundCommandNotFound: 'nope',
      bookmarksEmpty: 'nothing saved',
    });

    expect(result).toEqual({
      notFound: { heading: 'nope', supportingText: 'desc' },
      bookmarksPage: { empty: 'nothing saved' },
    });
  });
});
