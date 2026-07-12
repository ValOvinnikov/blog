import { describe, expect, it } from 'vitest';

import { getRevalidateTagsForType } from './revalidate-tags';

describe('getRevalidateTagsForType', () => {
  it('maps a known document type to its ISR tags', () => {
    expect(getRevalidateTagsForType('blog_post', 'post-1')).toEqual([
      'post',
      'posts',
      'homePage',
    ]);
  });

  it('includes the per-document tag for module types', () => {
    expect(getRevalidateTagsForType('module_hero', 'hero-1')).toEqual([
      'modules:hero',
      'module:hero-1',
    ]);
  });

  it('returns an empty list for an unknown type', () => {
    expect(getRevalidateTagsForType('nope', 'x')).toEqual([]);
  });

  // Security: the type comes from the webhook body. A Map lookup must not fall
  // through to Object.prototype for keys like these (CodeQL
  // js/unvalidated-dynamic-method-call).
  it.each(['constructor', 'toString', '__proto__', 'hasOwnProperty'])(
    'returns no tags (and does not throw) for the prototype key %s',
    (type) => {
      expect(getRevalidateTagsForType(type, 'x')).toEqual([]);
    },
  );
});
