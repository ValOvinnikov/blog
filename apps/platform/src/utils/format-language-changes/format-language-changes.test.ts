import { formatLanguageChanges } from './format-language-changes';

describe(formatLanguageChanges, () => {
  it('lists each language with its count', () => {
    expect(
      formatLanguageChanges([
        { language: 'English', count: 2 },
        { language: 'Deutsch', count: 1 },
      ]),
    ).toBe('English 2 · Deutsch 1');
  });

  it('leaves out languages with no changes', () => {
    expect(
      formatLanguageChanges([
        { language: 'English', count: 0 },
        { language: 'Deutsch', count: 3 },
      ]),
    ).toBe('Deutsch 3');
  });

  it('returns an empty string when nothing changed', () => {
    expect(formatLanguageChanges([])).toBe('');
  });
});
