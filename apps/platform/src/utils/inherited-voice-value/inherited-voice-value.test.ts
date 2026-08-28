import {
  CONSOLE_VOICE_PACK,
  EDITORIAL_VOICE_PACK,
  type TVoicePack,
} from '@blog/config/constants';

import { inheritedVoiceValue } from './inherited-voice-value';

describe(inheritedVoiceValue, () => {
  it('reads the mapped path out of the console voice pack', () => {
    expect(
      inheritedVoiceValue(CONSOLE_VOICE_PACK, 'notFoundCommandNotFound'),
    ).toBe('command not found');
    expect(inheritedVoiceValue(CONSOLE_VOICE_PACK, 'terminalPromptHost')).toBe(
      '~$',
    );
    expect(
      inheritedVoiceValue(CONSOLE_VOICE_PACK, 'bookmarkToastSavedMessage'),
    ).toBe('stashed to ~/bookmarks');
    expect(
      inheritedVoiceValue(CONSOLE_VOICE_PACK, 'accountIdentityPromptCommand'),
    ).toBe('account --identities');
  });

  it('reads the notFound meta/return-home fields, not just commandNotFound/description', () => {
    const pack: TVoicePack = {
      notFound: {
        metaTitle: 'Page not found',
        metaDescription: 'This page could not be located.',
        commandNotFound: 'command not found',
        description: "That route doesn't resolve to anything here.",
        returnHome: 'return home',
      },
    };

    expect(inheritedVoiceValue(pack, 'notFoundMetaTitle')).toBe(
      'Page not found',
    );
    expect(inheritedVoiceValue(pack, 'notFoundMetaDescription')).toBe(
      'This page could not be located.',
    );
    expect(inheritedVoiceValue(pack, 'notFoundReturnHome')).toBe('return home');
  });

  it('returns undefined for a curated key with no path in TVoicePack at all', () => {
    expect(
      inheritedVoiceValue(CONSOLE_VOICE_PACK, 'blogListEmpty'),
    ).toBeUndefined();
    expect(
      inheritedVoiceValue(CONSOLE_VOICE_PACK, 'bookmarksEmpty'),
    ).toBeUndefined();
  });

  it('returns undefined for every key against the empty editorial voice pack', () => {
    expect(
      inheritedVoiceValue(EDITORIAL_VOICE_PACK, 'terminalPromptHost'),
    ).toBeUndefined();
  });
});
