import { applyVoiceOverrides } from './apply-voice-overrides';

describe(applyVoiceOverrides, () => {
  it('sets a nested path without touching its siblings', () => {
    const messages = {
      notFound: { commandNotFound: 'Not found', description: 'desc' },
      unrelated: { value: 'untouched' },
    };

    const result = applyVoiceOverrides(messages, {
      notFoundCommandNotFound: 'nope',
    });

    expect(result).toEqual({
      notFound: { commandNotFound: 'nope', description: 'desc' },
      unrelated: { value: 'untouched' },
    });
  });

  it('does not mutate the input object', () => {
    const messages = { notFound: { commandNotFound: 'Not found' } };

    applyVoiceOverrides(messages, { notFoundCommandNotFound: 'nope' });

    expect(messages.notFound.commandNotFound).toBe('Not found');
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
    const messages = { notFound: { commandNotFound: 'Not found' } };

    const result = applyVoiceOverrides(messages, { unknownKey: 'ignored' });

    expect(result).toEqual(messages);
  });

  it('applies multiple overrides independently', () => {
    const messages = {
      notFound: { commandNotFound: 'Not found', description: 'desc' },
      bookmarksPage: { empty: 'No bookmarks yet' },
    };

    const result = applyVoiceOverrides(messages, {
      notFoundCommandNotFound: 'nope',
      bookmarksEmpty: 'nothing saved',
    });

    expect(result).toEqual({
      notFound: { commandNotFound: 'nope', description: 'desc' },
      bookmarksPage: { empty: 'nothing saved' },
    });
  });
});
