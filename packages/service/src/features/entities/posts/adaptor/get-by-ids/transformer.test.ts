import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { makeRawHeadingBlock } from '@blog/service/testing/shared/fixtures';

import { toPostsByIds } from './transformer';

const { EN, NL } = LOCALE_ISO_CODES;

describe(toPostsByIds, () => {
  it('maps every raw post card into a domain post card', () => {
    const raw = [
      {
        ...makeRawPostCard({
          _id: 'a',
          headingBlock: makeRawHeadingBlock('First'),
        }),
        language: EN,
      },
      {
        ...makeRawPostCard({
          _id: 'b',
          headingBlock: makeRawHeadingBlock('Second'),
        }),
        language: NL,
      },
    ];

    const result = toPostsByIds(raw);

    expect(result.map((post) => post.id)).toEqual(['a', 'b']);
    expect(result[0]?.title).toBe('First');
    expect(result[1]?.title).toBe('Second');
    expect(result.map((post) => post.language)).toEqual([EN, NL]);
  });

  it('returns an empty array when there are no matches', () => {
    expect(toPostsByIds([])).toEqual([]);
  });
});
