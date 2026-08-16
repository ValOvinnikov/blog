import { VOICE_FIELD_GROUPS, VOICE_OVERRIDE_KEYS } from './voice-fields';

describe('VOICE_FIELD_GROUPS', () => {
  it('has exactly 4 groups named after the CMS voice schema fieldsets', () => {
    expect(VOICE_FIELD_GROUPS.map((group) => group.groupKey)).toEqual([
      'notFoundPage',
      'terminalPrompts',
      'bookmarks',
      'emptyStates',
    ]);
  });

  it('groups fields per the corrections brief field counts (5/7/2/6)', () => {
    expect(VOICE_FIELD_GROUPS.map((group) => group.fields.length)).toEqual([
      5, 7, 2, 6,
    ]);
  });

  it('includes every field name from the corrections brief exactly once, with no mock-invented extras', () => {
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
