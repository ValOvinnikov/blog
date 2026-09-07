import realMessages from '@web/i18n/messages/en.json';

import { applyVoiceOverrides } from './apply-voice-overrides';

// Mirrors the source file's private VOICE_OVERRIDE_PATHS map — it isn't
// exported, so the two must be kept in sync by hand.
const CURATED_KEY_PATHS: Record<string, readonly string[]> = {
  notFoundHeading: ['notFound', 'heading'],
  notFoundSupportingText: ['notFound', 'supportingText'],
  notFoundReturnHome: ['notFound', 'returnHome'],
  blogListEmpty: ['blogListPage', 'empty'],
  topicEmpty: ['topicPage', 'empty'],
  tagEmpty: ['tagPage', 'empty'],
  topicsEmpty: ['topicsPage', 'empty'],
  bookmarksEmpty: ['bookmarksPage', 'empty'],
};

const getAtPath = (source: unknown, path: readonly string[]): unknown => {
  return path.reduce<unknown>((node, segment) => {
    if (typeof node !== 'object' || node === null) return undefined;
    return (node as Record<string, unknown>)[segment];
  }, source);
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

  it.each(Object.entries(CURATED_KEY_PATHS))(
    'has a path for %s that resolves to a real string in en.json',
    (_key, path) => {
      expect(getAtPath(realMessages, path)).toBeTypeOf('string');
    },
  );

  it('sets a nested path without touching its siblings', () => {
    const messages = {
      notFound: { heading: 'Page not found', supportingText: 'desc' },
      unrelated: { value: 'untouched' },
    };

    const result = applyVoiceOverrides(messages, {
      notFoundHeading: 'nope',
    });

    expect(result).toEqual({
      notFound: { heading: 'nope', supportingText: 'desc' },
      unrelated: { value: 'untouched' },
    });
  });

  it('does not mutate the input object', () => {
    const messages = { notFound: { heading: 'Page not found' } };

    applyVoiceOverrides(messages, { notFoundHeading: 'nope' });

    expect(messages.notFound.heading).toBe('Page not found');
  });

  it('applies a deeply nested override without disturbing its siblings', () => {
    const messages = {
      topicPage: { empty: 'No posts in this topic yet.' },
      tagPage: { empty: 'No posts tagged this yet.' },
    };

    const result = applyVoiceOverrides(messages, {
      topicEmpty: 'Nothing here yet',
    });

    expect(result).toEqual({
      topicPage: { empty: 'Nothing here yet' },
      tagPage: { empty: 'No posts tagged this yet.' },
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
      notFoundHeading: 'nope',
      bookmarksEmpty: 'nothing saved',
    });

    expect(result).toEqual({
      notFound: { heading: 'nope', supportingText: 'desc' },
      bookmarksPage: { empty: 'nothing saved' },
    });
  });
});
