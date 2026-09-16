import { makeRawPortableTextMarkDef } from '@blog/service/testing/shared/fixtures';

import { toPortableTextBlockWithResolvedLinks } from './to-portable-text-mark-def';

describe(toPortableTextBlockWithResolvedLinks, () => {
  it('resolves a linkRef mark to its link document href', () => {
    const block = {
      _type: 'block' as const,
      _key: 'block-1',
      markDefs: [makeRawPortableTextMarkDef()],
    };

    const result = toPortableTextBlockWithResolvedLinks(block);

    expect(result.markDefs?.[0]).toEqual({
      _key: 'mark-1',
      _type: 'linkRef',
      link: {
        href: 'https://example.com',
        target: undefined,
      },
    });
  });

  it('degrades a dangling link reference to an absent link rather than throwing', () => {
    const block = {
      _type: 'block' as const,
      _key: 'block-1',
      markDefs: [makeRawPortableTextMarkDef({ link: null })],
    };

    expect(() => toPortableTextBlockWithResolvedLinks(block)).not.toThrow();
    const result = toPortableTextBlockWithResolvedLinks(block);
    expect(result.markDefs?.[0]?.link).toBeUndefined();
  });

  it('keeps the mark _key when the link is dangling', () => {
    const block = {
      _type: 'block' as const,
      _key: 'block-1',
      markDefs: [makeRawPortableTextMarkDef({ _key: 'mark-42', link: null })],
    };

    const result = toPortableTextBlockWithResolvedLinks(block);

    expect(result.markDefs?.[0]?._key).toBe('mark-42');
  });

  it('leaves markDefs undefined when the block has none', () => {
    const block = { _type: 'block' as const, _key: 'block-1', markDefs: null };

    const result = toPortableTextBlockWithResolvedLinks(block);

    expect(result.markDefs).toBeUndefined();
  });

  it('spreads every other block field unchanged', () => {
    const block = {
      _type: 'block' as const,
      _key: 'block-1',
      style: 'normal' as const,
      children: [{ _type: 'span' as const, _key: 'span-1', text: 'Hi.' }],
      markDefs: null,
    };

    const result = toPortableTextBlockWithResolvedLinks(block);

    expect(result).toMatchObject({
      style: 'normal',
      children: block.children,
    });
  });
});
