import { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config/constants';
import {
  MOCK_EXTERNAL_URL,
  mockRawPortableTextMarkDef,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toPortableText } from './to-portable-text-mark-def';

faker.seed(6017);

const MOCK_BLOCK_KEY = faker.string.uuid();
const MOCK_SPAN_KEY = faker.string.uuid();
const MOCK_MARK_KEY = faker.string.uuid();
const MOCK_SPAN_TEXT = faker.lorem.sentence();

describe(toPortableText, () => {
  it('resolves a linkRef mark to its link document href', () => {
    const result = toPortableText({
      _type: 'block',
      _key: MOCK_BLOCK_KEY,
      markDefs: [mockRawPortableTextMarkDef({ _key: MOCK_MARK_KEY })],
    });

    expect(result).toEqual({
      _type: 'block',
      _key: MOCK_BLOCK_KEY,
      children: [],
      markDefs: [
        {
          _key: MOCK_MARK_KEY,
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
          link: { href: MOCK_EXTERNAL_URL, target: undefined },
        },
      ],
    });
  });

  it('degrades a dangling link reference to an absent link, keeping its key', () => {
    const result = toPortableText({
      _type: 'block',
      _key: MOCK_BLOCK_KEY,
      markDefs: [
        mockRawPortableTextMarkDef({ _key: MOCK_MARK_KEY, link: null }),
      ],
    });

    expect(result).toEqual({
      _type: 'block',
      _key: MOCK_BLOCK_KEY,
      children: [],
      markDefs: [
        {
          _key: MOCK_MARK_KEY,
          _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
          link: undefined,
        },
      ],
    });
  });

  it('spreads every other block field unchanged', () => {
    const block = {
      _type: 'block' as const,
      _key: MOCK_BLOCK_KEY,
      style: 'normal' as const,
      children: [
        { _type: 'span' as const, _key: MOCK_SPAN_KEY, text: MOCK_SPAN_TEXT },
      ],
      markDefs: null,
    };

    const result = toPortableText(block);

    expect(result).toEqual({ ...block, markDefs: undefined });
  });

  it('normalises a span with no text to an empty string', () => {
    const result = toPortableText({
      _type: 'block',
      _key: MOCK_BLOCK_KEY,
      children: [{ _type: 'span', _key: MOCK_SPAN_KEY }],
      markDefs: null,
    });

    expect(result).toEqual({
      _type: 'block',
      _key: MOCK_BLOCK_KEY,
      children: [{ _type: 'span', _key: MOCK_SPAN_KEY, text: '' }],
      markDefs: undefined,
    });
  });

  it('leaves markDefs undefined and children empty when the block has neither', () => {
    const result = toPortableText({
      _type: 'block',
      _key: MOCK_BLOCK_KEY,
      markDefs: null,
    });

    expect(result).toEqual({
      _type: 'block',
      _key: MOCK_BLOCK_KEY,
      children: [],
      markDefs: undefined,
    });
  });
});
