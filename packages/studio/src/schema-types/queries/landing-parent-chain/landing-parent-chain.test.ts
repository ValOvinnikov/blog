import { LANDING_PAGE_MAX_DEPTH } from '@blog/config/constants';
import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import {
  flattenLandingParentChain,
  LANDING_PARENT_CHAIN_PROJECTION,
} from '@blog/studio/schema-types/queries/landing-parent-chain/landing-parent-chain';
import { evaluate, parse } from 'groq-js';

const page = (_id: string, slug: string, parent?: string) => ({
  _id,
  _type: PAGE_LANDING_TYPE,
  slug: { _type: 'slug', current: slug },
  ...(parent ? { parent: { _type: 'reference', _ref: parent } } : {}),
});

const fetchChain = async (dataset: object[], id: string) => {
  const result = await evaluate(
    parse(`*[_id == $id][0]${LANDING_PARENT_CHAIN_PROJECTION}`),
    { dataset, params: { id } },
  );

  return flattenLandingParentChain(await result.get());
};

describe(flattenLandingParentChain, () => {
  it('lists a page and its ancestors nearest first', async () => {
    const dataset = [
      page('modules', 'modules'),
      page('faq', 'faq', 'modules'),
      page('billing', 'billing', 'faq'),
    ];

    const chain = await fetchChain(dataset, 'billing');

    expect(chain.map(({ slug }) => slug)).toEqual([
      'billing',
      'faq',
      'modules',
    ]);
  });

  it('stops after the maximum depth even when the chain loops', async () => {
    const dataset = [page('a', 'a', 'b'), page('b', 'b', 'a')];

    const chain = await fetchChain(dataset, 'a');

    expect(chain).toHaveLength(LANDING_PAGE_MAX_DEPTH);
  });

  it('returns no pages when the page is missing', async () => {
    expect(await fetchChain([], 'missing')).toEqual([]);
  });
});
