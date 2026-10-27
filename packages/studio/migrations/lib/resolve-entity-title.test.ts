import type { TMaybeNull } from '@blog/config/types';
import { mockMigrationContext } from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';

import { resolveEntityTitle } from './resolve-entity-title';

faker.seed(16);

const MOCK_REF = faker.string.uuid();
const MOCK_TITLE = faker.lorem.words();

const mockContext = (entity: TMaybeNull<{ title?: string }>) => {
  const fetch = vi.fn().mockResolvedValue(entity);

  return { fetch, context: mockMigrationContext({ fetch }) };
};

describe(resolveEntityTitle, () => {
  it('returns undefined without a ref, performing no lookup', async () => {
    const { context, fetch } = mockContext(null);

    const title = await resolveEntityTitle(context, undefined);

    expect(title).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns the trimmed title of the referenced entity', async () => {
    const { context } = mockContext({ title: `  ${MOCK_TITLE}  ` });

    const title = await resolveEntityTitle(context, MOCK_REF);

    expect(title).toBe(MOCK_TITLE);
  });

  it.each([
    ['has no title', { title: '' }],
    ['cannot be found', null],
  ])(
    'returns undefined when the referenced entity %s',
    async (_label, entity) => {
      const { context } = mockContext(entity);

      const title = await resolveEntityTitle(context, MOCK_REF);

      expect(title).toBeUndefined();
    },
  );
});
