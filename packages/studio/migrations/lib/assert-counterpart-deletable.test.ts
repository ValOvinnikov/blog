import type { TMaybeNull } from '@blog/config/types';
import { mockMigrationContext } from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';

import { assertCounterpartDeletable } from './assert-counterpart-deletable';

faker.seed(1);

const MOCK_SOURCE_ID = faker.string.uuid();
const MOCK_COUNTERPART_ID = faker.string.uuid();
const MOCK_REF_COUNT = faker.number.int({ min: 1, max: 9 });

const options = {
  sourceType: 'blog_post',
  counterpartType: 'page_post',
  counterpartIdParam: 'pagePostId',
  field: 'content',
  hasValue: (content: unknown) => Array.isArray(content) && content.length > 0,
};
const { sourceType, counterpartType, field } = options;
const cannotDelete = `Cannot delete ${sourceType} "${MOCK_SOURCE_ID}"`;

const run = (result: {
  target: TMaybeNull<Record<string, unknown>>;
  refCount: number;
}) =>
  assertCounterpartDeletable(
    mockMigrationContext({ fetch: vi.fn().mockResolvedValue(result) }),
    MOCK_SOURCE_ID,
    MOCK_COUNTERPART_ID,
    options,
  );

describe(assertCounterpartDeletable, () => {
  it('resolves when the counterpart has a value and no references remain', async () => {
    await expect(
      run({ target: { [field]: [{ _type: 'block' }] }, refCount: 0 }),
    ).resolves.toBeUndefined();
  });

  it.each([
    [
      'the counterpart does not exist',
      { target: null, refCount: 0 },
      `${cannotDelete}: its ${counterpartType} counterpart "${MOCK_COUNTERPART_ID}" does not exist.`,
    ],
    [
      'the counterpart has no value set',
      { target: { [field]: [] }, refCount: 0 },
      `${cannotDelete}: ${counterpartType} "${MOCK_COUNTERPART_ID}" has no ${field} set.`,
    ],
    [
      'the source is still referenced',
      { target: { [field]: [{ _type: 'block' }] }, refCount: MOCK_REF_COUNT },
      `${cannotDelete}: still referenced by ${MOCK_REF_COUNT} document(s).`,
    ],
  ])('throws when %s', async (_label, result, message) => {
    await expect(run(result)).rejects.toThrow(message);
  });
});
