import { LANDING_PAGE_MAX_DEPTH } from '@blog/config/constants';
import {
  flattenLandingParentChain,
  LANDING_PARENT_CHAIN_PROJECTION,
} from '@blog/studio/schema-types/queries/landing-parent-chain/landing-parent-chain';
import { mockLandingPage } from '@blog/studio/testing/mock-documents';
import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';

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
      mockLandingPage({ _id: 'modules', slug: 'modules' }),
      mockLandingPage({ _id: 'faq', slug: 'faq', parent: 'modules' }),
      mockLandingPage({ _id: 'billing', slug: 'billing', parent: 'faq' }),
    ];

    const chain = await fetchChain(dataset, 'billing');

    expect(chain.map(({ slug }) => slug)).toEqual([
      'billing',
      'faq',
      'modules',
    ]);
  });

  it('stops after the maximum depth even when the chain loops', async () => {
    const dataset = [
      mockLandingPage({ _id: 'a', slug: 'a', parent: 'b' }),
      mockLandingPage({ _id: 'b', slug: 'b', parent: 'a' }),
    ];

    const chain = await fetchChain(dataset, 'a');

    expect(chain).toHaveLength(LANDING_PAGE_MAX_DEPTH);
  });

  it('returns no pages when the page is missing', async () => {
    expect(await fetchChain([], 'missing')).toEqual([]);
  });
});
