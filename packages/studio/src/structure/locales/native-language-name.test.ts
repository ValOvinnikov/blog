import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { nativeLanguageName } from './native-language-name';

describe('nativeLanguageName', () => {
  it('names a language in itself, capitalised', () => {
    expect(nativeLanguageName(LOCALE_ISO_CODES.NL)).toBe('Nederlands');
    expect(nativeLanguageName(LOCALE_ISO_CODES.FR)).toBe('Français');
    expect(nativeLanguageName(LOCALE_ISO_CODES.EN)).toBe('English');
  });
});
