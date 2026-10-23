import { LANDING_PARENT_CHAIN_QUERY } from '@blog/studio/schema-types/queries/landing-parent-chain/landing-parent-chain';
import { mockLandingPage } from '@blog/studio/testing/mock-documents';
import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import type { SanityDocument } from 'sanity';

import { isInsideSection } from './is-inside-section';

const isParentInsideSection = async (dataset: object[], parentId: string) => {
  const chain = await mockGroqFetch(dataset)(LANDING_PARENT_CHAIN_QUERY, {
    parentId,
  });

  return isInsideSection(chain);
};

const MODULES_ID = 'modules';

describe(isInsideSection, () => {
  let sectionModules: SanityDocument;
  let faqWithoutSection: SanityDocument;

  beforeEach(() => {
    sectionModules = mockLandingPage({
      _id: MODULES_ID,
      sectionNavigation: true,
    });
    faqWithoutSection = mockLandingPage({
      _id: 'faq',
      parent: MODULES_ID,
      sectionNavigation: false,
    });
  });

  it('is inside a section when the parent has section navigation on', async () => {
    expect(await isParentInsideSection([sectionModules], MODULES_ID)).toBe(
      true,
    );
  });

  it('is inside a section when a higher ancestor has section navigation on', async () => {
    const dataset = [sectionModules, faqWithoutSection];

    expect(await isParentInsideSection(dataset, 'faq')).toBe(true);
  });

  it('is outside a section when no ancestor has section navigation on', async () => {
    const dataset = [
      mockLandingPage({ _id: MODULES_ID, slug: MODULES_ID }),
      faqWithoutSection,
    ];

    expect(await isParentInsideSection(dataset, 'faq')).toBe(false);
  });

  it('is outside a section without a parent', () => {
    expect(isInsideSection(null)).toBe(false);
  });
});
