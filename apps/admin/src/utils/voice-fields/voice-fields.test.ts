import { VOICE_FIELD_GROUPS, VOICE_OVERRIDE_KEYS } from './voice-fields';

describe('VOICE_FIELD_GROUPS', () => {
  it('has exactly 4 groups named after the CMS voice schema fieldsets', () => {
    expect(VOICE_FIELD_GROUPS.map((group) => group.title)).toEqual([
      '404 page',
      'Terminal prompts',
      'Bookmarks',
      'Empty states',
    ]);
  });

  it('has exactly 20 fields total, with no duplicate keys', () => {
    expect(VOICE_OVERRIDE_KEYS).toHaveLength(20);
    expect(new Set(VOICE_OVERRIDE_KEYS).size).toBe(20);
  });

  it('groups fields per the corrections brief field counts (5/7/2/6)', () => {
    expect(VOICE_FIELD_GROUPS.map((group) => group.fields.length)).toEqual([
      5, 7, 2, 6,
    ]);
  });

  it('never includes the mock-invented "Publish confirmation" or "No search results" fields', () => {
    const labels = VOICE_FIELD_GROUPS.flatMap((group) =>
      group.fields.map((field) => field.label),
    );

    expect(labels).not.toContain('Publish confirmation');
    expect(labels).not.toContain('No search results');
  });

  it('includes every field name from the corrections brief exactly once', () => {
    expect(VOICE_OVERRIDE_KEYS).toEqual([
      'notFoundMetaTitle',
      'notFoundMetaDescription',
      'notFoundCommandNotFound',
      'notFoundDescription',
      'notFoundReturnHome',
      'terminalPromptHost',
      'authPromptCommandSignIn',
      'authPromptCommandAccount',
      'bookmarksPromptCommand',
      'accountPrivacyPromptCommand',
      'accountNewsletterPromptCommand',
      'accountIdentityPromptCommand',
      'bookmarkToastSavedMessage',
      'bookmarkToastRemovedMessage',
      'blogListEmpty',
      'categoryEmpty',
      'tagEmpty',
      'authorEmpty',
      'topicsEmpty',
      'bookmarksEmpty',
    ]);
  });
});
