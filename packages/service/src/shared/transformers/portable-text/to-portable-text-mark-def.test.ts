import { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config/constants';
import { mockRawPortableTextMarkDef } from '@blog/service/testing/shared/fixtures';

import { toPortableText } from './to-portable-text-mark-def';

const BLOCK_KEY = 'block-1';
const SPAN_KEY = 'span-1';

describe(toPortableText, () => {
  it('resolves a linkRef mark to its link document href', () => {
    const markDef = mockRawPortableTextMarkDef();

    const result = toPortableText({
      _type: 'block',
      _key: BLOCK_KEY,
      markDefs: [markDef],
    });

    expect(result.markDefs?.[0]).toEqual({
      _key: markDef._key,
      _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
      link: { href: markDef.link?.url, target: undefined },
    });
  });

  it('degrades a dangling link reference to an absent link, keeping its key', () => {
    const result = toPortableText({
      _type: 'block',
      _key: BLOCK_KEY,
      markDefs: [mockRawPortableTextMarkDef({ _key: 'mark-42', link: null })],
    });

    expect(result.markDefs?.[0]).toEqual({
      _key: 'mark-42',
      _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
      link: undefined,
    });
  });

  it('spreads every other block field unchanged', () => {
    const block = {
      _type: 'block' as const,
      _key: BLOCK_KEY,
      style: 'normal' as const,
      children: [{ _type: 'span' as const, _key: SPAN_KEY, text: 'Hi.' }],
      markDefs: null,
    };

    const result = toPortableText(block);

    expect(result).toEqual({ ...block, markDefs: undefined });
  });

  it('normalises a span with no text to an empty string', () => {
    const result = toPortableText({
      _type: 'block',
      _key: BLOCK_KEY,
      children: [{ _type: 'span', _key: SPAN_KEY }],
      markDefs: null,
    });

    expect(result.children[0]).toEqual({
      _type: 'span',
      _key: SPAN_KEY,
      text: '',
    });
  });

  it('leaves markDefs undefined and children empty when the block has neither', () => {
    const result = toPortableText({
      _type: 'block',
      _key: BLOCK_KEY,
      markDefs: null,
    });

    expect(result).toEqual({
      _type: 'block',
      _key: BLOCK_KEY,
      children: [],
      markDefs: undefined,
    });
  });
});
