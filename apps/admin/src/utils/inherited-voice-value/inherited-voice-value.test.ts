import {
  CONSOLE_VOICE_PACK,
  EDITORIAL_VOICE_PACK,
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

  it('returns undefined for a curated key with no path in TVoicePack yet', () => {
    expect(
      inheritedVoiceValue(CONSOLE_VOICE_PACK, 'notFoundMetaTitle'),
    ).toBeUndefined();
    expect(
      inheritedVoiceValue(CONSOLE_VOICE_PACK, 'blogListEmpty'),
    ).toBeUndefined();
  });

  it('returns undefined for every key against the empty editorial voice pack', () => {
    expect(
      inheritedVoiceValue(EDITORIAL_VOICE_PACK, 'terminalPromptHost'),
    ).toBeUndefined();
  });
});
