import type { TMaybeNull } from '@blog/config/types';
import { mockMigrationContext } from '@blog/studio/testing/mock-migration';
import { faker } from '@faker-js/faker';

import {
  getReferencedTaxonomyListIds,
  stripDraftPrefix,
} from './referenced-taxonomy-list-ids';

faker.seed(17);

const MOCK_LIST_ID = faker.string.uuid();
const MOCK_OTHER_LIST_ID = faker.string.uuid();
const TOPIC_INDEX_TYPE = 'page_topicIndex';
const TAG_INDEX_TYPE = 'page_tagIndex';

const mockContext = (
  docs: {
    taxonomyRef?: TMaybeNull<string>;
    moduleRefs?: TMaybeNull<TMaybeNull<string>[]>;
  }[],
) => {
  const fetch = vi.fn().mockResolvedValue(docs);

  return { fetch, context: mockMigrationContext({ fetch }) };
};

describe(stripDraftPrefix, () => {
  it.each([
    ['removes a drafts. prefix', `drafts.${MOCK_LIST_ID}`],
    ['leaves a published id unchanged', MOCK_LIST_ID],
  ])('%s', (_title, id) => {
    expect(stripDraftPrefix(id)).toBe(MOCK_LIST_ID);
  });
});

describe(getReferencedTaxonomyListIds, () => {
  it('collects ids from both taxonomyList and modules[] refs', async () => {
    const { context } = mockContext([
      { taxonomyRef: MOCK_LIST_ID, moduleRefs: [] },
      { taxonomyRef: null, moduleRefs: [MOCK_OTHER_LIST_ID] },
    ]);

    const ids = await getReferencedTaxonomyListIds(context, TOPIC_INDEX_TYPE);

    expect(ids).toEqual(new Set([MOCK_LIST_ID, MOCK_OTHER_LIST_ID]));
  });

  it('normalises drafts. ids to their canonical form', async () => {
    const { context } = mockContext([
      { taxonomyRef: `drafts.${MOCK_LIST_ID}`, moduleRefs: [] },
    ]);

    const ids = await getReferencedTaxonomyListIds(context, TOPIC_INDEX_TYPE);

    expect(ids).toEqual(new Set([MOCK_LIST_ID]));
  });

  it('produces an empty set when no page references anything', async () => {
    const { context } = mockContext([{ taxonomyRef: null, moduleRefs: null }]);

    const ids = await getReferencedTaxonomyListIds(context, TOPIC_INDEX_TYPE);

    expect(ids).toEqual(new Set());
  });

  describe('with one page type already looked up', () => {
    let context: ReturnType<typeof mockContext>['context'];
    let fetch: ReturnType<typeof mockContext>['fetch'];

    beforeEach(async () => {
      ({ context, fetch } = mockContext([
        { taxonomyRef: MOCK_LIST_ID, moduleRefs: [] },
      ]));
      await getReferencedTaxonomyListIds(context, TOPIC_INDEX_TYPE);
    });

    it('fetches once for repeated lookups of the same page type', async () => {
      await getReferencedTaxonomyListIds(context, TOPIC_INDEX_TYPE);

      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('fetches again for a different page type', async () => {
      await getReferencedTaxonomyListIds(context, TAG_INDEX_TYPE);

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
