import { PAGE_LANDING_TYPE } from '@blog/studio/schema-types/documents/pages/landing/landing-type';
import { LANDING_PARENT_CHAIN_QUERY } from '@blog/studio/schema-types/queries/landing-parent-chain/landing-parent-chain';
import { evaluate, parse } from 'groq-js';

import { isInsideSection } from './is-inside-section';

const page = (_id: string, parent?: string, sectionNavigation?: boolean) => ({
  _id,
  _type: PAGE_LANDING_TYPE,
  slug: { _type: 'slug', current: _id },
  ...(parent ? { parent: { _type: 'reference', _ref: parent } } : {}),
  ...(sectionNavigation === undefined ? {} : { sectionNavigation }),
});

const isParentInsideSection = async (dataset: object[], parentId: string) => {
  const result = await evaluate(parse(LANDING_PARENT_CHAIN_QUERY), {
    dataset,
    params: { parentId },
  });

  return isInsideSection(await result.get());
};

describe(isInsideSection, () => {
  it('is inside a section when the parent has section navigation on', async () => {
    expect(
      await isParentInsideSection(
        [page('modules', undefined, true)],
        'modules',
      ),
    ).toBe(true);
  });

  it('is inside a section when a higher ancestor has section navigation on', async () => {
    const dataset = [
      page('modules', undefined, true),
      page('faq', 'modules', false),
    ];

    expect(await isParentInsideSection(dataset, 'faq')).toBe(true);
  });

  it('is outside a section when no ancestor has section navigation on', async () => {
    const dataset = [page('modules'), page('faq', 'modules', false)];

    expect(await isParentInsideSection(dataset, 'faq')).toBe(false);
  });

  it('is outside a section without a parent', () => {
    expect(isInsideSection(null)).toBe(false);
  });
});
