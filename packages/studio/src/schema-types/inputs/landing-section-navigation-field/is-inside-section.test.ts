import { LANDING_PARENT_CHAIN_QUERY } from '@blog/studio/schema-types/queries/landing-parent-chain/landing-parent-chain';
import { mockLandingPage } from '@blog/studio/testing/mock-documents';
import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';

import { isInsideSection } from './is-inside-section';

const isParentInsideSection = async (dataset: object[], parentId: string) => {
  const chain = await mockGroqFetch(dataset)(LANDING_PARENT_CHAIN_QUERY, {
    parentId,
  });

  return isInsideSection(chain);
};

const MODULES_ID = 'modules';

describe(isInsideSection, () => {
  it('is inside a section when the parent has section navigation on', async () => {
    expect(
      await isParentInsideSection(
        [
          mockLandingPage({
            _id: MODULES_ID,
            sectionNavigation: true,
          }),
        ],
        MODULES_ID,
      ),
    ).toBe(true);
  });

  it('is inside a section when a higher ancestor has section navigation on', async () => {
    const dataset = [
      mockLandingPage({
        _id: MODULES_ID,
        sectionNavigation: true,
      }),
      mockLandingPage({
        _id: 'faq',
        parent: MODULES_ID,
        sectionNavigation: false,
      }),
    ];

    expect(await isParentInsideSection(dataset, 'faq')).toBe(true);
  });

  it('is outside a section when no ancestor has section navigation on', async () => {
    const dataset = [
      mockLandingPage({ _id: MODULES_ID, slug: MODULES_ID }),
      mockLandingPage({
        _id: 'faq',
        parent: MODULES_ID,
        sectionNavigation: false,
      }),
    ];

    expect(await isParentInsideSection(dataset, 'faq')).toBe(false);
  });

  it('is outside a section without a parent', () => {
    expect(isInsideSection(null)).toBe(false);
  });
});
