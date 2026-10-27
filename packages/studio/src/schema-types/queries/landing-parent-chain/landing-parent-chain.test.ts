import { LANDING_PAGE_MAX_DEPTH } from '@blog/config/constants';
import {
  flattenLandingParentChain,
  LANDING_PARENT_CHAIN_PROJECTION,
} from '@blog/studio/schema-types/queries/landing-parent-chain/landing-parent-chain';
import { mockLandingPage } from '@blog/studio/testing/mock-documents';
import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import { faker } from '@faker-js/faker';

faker.seed(4113);

const MOCK_ROOT_ID = faker.string.uuid();
const MOCK_PARENT_ID = faker.string.uuid();
const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_ROOT_SLUG = faker.lorem.slug();
const MOCK_PARENT_SLUG = faker.lorem.slug();
const MOCK_PAGE_SLUG = faker.lorem.slug();

const fetchChain = async (dataset: object[], id: string) => {
  const result = await mockGroqFetch(dataset)(
    `*[_id == $id][0]${LANDING_PARENT_CHAIN_PROJECTION}`,
    { id },
  );

  return flattenLandingParentChain(result);
};

describe(flattenLandingParentChain, () => {
  it('lists a page and its ancestors nearest first', async () => {
    const dataset = [
      mockLandingPage({ _id: MOCK_ROOT_ID, slug: MOCK_ROOT_SLUG }),
      mockLandingPage({
        _id: MOCK_PARENT_ID,
        slug: MOCK_PARENT_SLUG,
        parent: MOCK_ROOT_ID,
      }),
      mockLandingPage({
        _id: MOCK_PAGE_ID,
        slug: MOCK_PAGE_SLUG,
        parent: MOCK_PARENT_ID,
      }),
    ];

    const chain = await fetchChain(dataset, MOCK_PAGE_ID);

    expect(chain.map(({ slug }) => slug)).toEqual([
      MOCK_PAGE_SLUG,
      MOCK_PARENT_SLUG,
      MOCK_ROOT_SLUG,
    ]);
  });

  it('stops after the maximum depth even when the chain loops', async () => {
    const dataset = [
      mockLandingPage({
        _id: MOCK_PAGE_ID,
        slug: MOCK_PAGE_SLUG,
        parent: MOCK_PARENT_ID,
      }),
      mockLandingPage({
        _id: MOCK_PARENT_ID,
        slug: MOCK_PARENT_SLUG,
        parent: MOCK_PAGE_ID,
      }),
    ];

    const chain = await fetchChain(dataset, MOCK_PAGE_ID);

    expect(chain).toHaveLength(LANDING_PAGE_MAX_DEPTH);
  });

  it('returns no pages when the page is missing', async () => {
    const chain = await fetchChain([], MOCK_PAGE_ID);

    expect(chain).toEqual([]);
  });
});
