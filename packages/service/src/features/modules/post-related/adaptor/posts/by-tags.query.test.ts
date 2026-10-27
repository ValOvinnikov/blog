import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { MOCK_TAG_ID } from '@blog/service/testing/entities/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  evaluateRelatedPostsQuery,
  MOCK_DESIGN_NL_POST_ID,
  toIds,
} from '@blog/service/testing/shared/translated-posts-dataset';
import { faker } from '@faker-js/faker';

import { relatedByTagsQuery } from './by-tags.query';

faker.seed(13);

const MOCK_PUBLISHED_AT = faker.date.past().toISOString();
const MOCK_SCHEDULED_AT = faker.date.future().toISOString();
const MOCK_TAG_A_ID = faker.string.uuid();
const MOCK_TAG_B_ID = faker.string.uuid();
const MOCK_OTHER_TAG_ID = faker.string.uuid();
const MOCK_ANCHOR_ID = faker.string.uuid();
const MOCK_SHARES_A_ID = faker.string.uuid();
const MOCK_SHARES_B_ID = faker.string.uuid();
const MOCK_SHARES_NONE_ID = faker.string.uuid();
const MOCK_UNTAGGED_ID = faker.string.uuid();
const MOCK_SCHEDULED_ID = faker.string.uuid();

function mockPost(id: string, tagRefs: string[]) {
  return {
    _id: id,
    _type: 'page_post',
    publishedAt: MOCK_PUBLISHED_AT,
    tags: tagRefs.map((ref) => ({ _key: `${id}-${ref}`, _ref: ref })),
  };
}

const MOCK_DATASET = [
  mockPost(MOCK_ANCHOR_ID, [MOCK_TAG_A_ID, MOCK_TAG_B_ID]),
  mockPost(MOCK_SHARES_A_ID, [MOCK_TAG_A_ID, MOCK_OTHER_TAG_ID]),
  mockPost(MOCK_SHARES_B_ID, [MOCK_TAG_B_ID]),
  mockPost(MOCK_SHARES_NONE_ID, [MOCK_OTHER_TAG_ID]),
  mockPost(MOCK_UNTAGGED_ID, []),
  {
    ...mockPost(MOCK_SCHEDULED_ID, [MOCK_TAG_A_ID]),
    publishedAt: MOCK_SCHEDULED_AT,
  },
];

describe('relatedByTagsQuery', () => {
  it('returns posts sharing a tag, excluding the anchor and posts sharing none', async () => {
    const raw = await evaluateGroqExpression(
      relatedByTagsQuery.query,
      MOCK_DATASET,
      undefined,
      { currentId: MOCK_ANCHOR_ID, tagIds: [MOCK_TAG_A_ID, MOCK_TAG_B_ID] },
    );

    expect(toIds(raw).sort()).toEqual(
      [MOCK_SHARES_A_ID, MOCK_SHARES_B_ID].sort(),
    );
  });

  it('picks tag candidates only in the request language', async () => {
    const raw = await evaluateRelatedPostsQuery(relatedByTagsQuery.query, {
      tagIds: [MOCK_TAG_ID],
      locale: LOCALE_ISO_CODES.NL,
    });

    expect(toIds(raw)).toEqual([MOCK_DESIGN_NL_POST_ID]);
  });
});
