import { faker } from '@faker-js/faker';
import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import {
  MOCK_FIRST_POST_TITLE,
  MOCK_SECOND_POST_TITLE,
} from '@shinefold/service/testing/entities/fixtures';
import { mockRawPostCard } from '@shinefold/service/testing/pages/fixtures';
import { mockRawHeadingBlock } from '@shinefold/service/testing/shared/fixtures';

import { toPostsByIds } from './transformer';

const { EN, NL } = LOCALE_ISO_CODES;

faker.seed(6108);

const MOCK_FIRST_POST_ID = faker.string.uuid();
const MOCK_SECOND_POST_ID = faker.string.uuid();

describe(toPostsByIds, () => {
  it('maps every raw post card into a domain post card', () => {
    const raw = [
      {
        ...mockRawPostCard({
          _id: MOCK_FIRST_POST_ID,
          headingBlock: mockRawHeadingBlock(MOCK_FIRST_POST_TITLE),
        }),
        language: EN,
      },
      {
        ...mockRawPostCard({
          _id: MOCK_SECOND_POST_ID,
          headingBlock: mockRawHeadingBlock(MOCK_SECOND_POST_TITLE),
        }),
        language: NL,
      },
    ];

    const result = toPostsByIds(raw);

    expect(result.map((post) => post.id)).toEqual([
      MOCK_FIRST_POST_ID,
      MOCK_SECOND_POST_ID,
    ]);
    expect(result[0]?.title).toBe(MOCK_FIRST_POST_TITLE);
    expect(result[1]?.title).toBe(MOCK_SECOND_POST_TITLE);
    expect(result.map((post) => post.language)).toEqual([EN, NL]);
  });

  it('returns an empty array when there are no matches', () => {
    expect(toPostsByIds([])).toEqual([]);
  });
});
