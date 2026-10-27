import { isInsideSection } from '@blog/studio/schema-types/inputs/landing-section-navigation-field/is-inside-section';
import { LANDING_PARENT_CHAIN_QUERY } from '@blog/studio/schema-types/queries/landing-parent-chain/landing-parent-chain';
import { mockLandingPage } from '@blog/studio/testing/mock-documents';
import { mockGroqFetch } from '@blog/studio/testing/mock-groq-fetch';
import { faker } from '@faker-js/faker';
import type { SanityDocument } from 'sanity';

faker.seed(4104);

const MOCK_SECTION_ID = faker.string.uuid();
const MOCK_CHILD_ID = faker.string.uuid();
const MOCK_SECTION_SLUG = faker.lorem.slug();

const isParentInsideSection = async (dataset: object[], parentId: string) => {
  const chain = await mockGroqFetch(dataset)(LANDING_PARENT_CHAIN_QUERY, {
    parentId,
  });

  return isInsideSection(chain);
};

describe(isInsideSection, () => {
  let sectionPage: SanityDocument;
  let childWithoutSection: SanityDocument;

  beforeEach(() => {
    sectionPage = mockLandingPage({
      _id: MOCK_SECTION_ID,
      sectionNavigation: true,
    });
    childWithoutSection = mockLandingPage({
      _id: MOCK_CHILD_ID,
      parent: MOCK_SECTION_ID,
      sectionNavigation: false,
    });
  });

  it('is inside a section when the parent has section navigation on', async () => {
    const isInside = await isParentInsideSection(
      [sectionPage],
      MOCK_SECTION_ID,
    );

    expect(isInside).toBe(true);
  });

  it('is inside a section when a higher ancestor has section navigation on', async () => {
    const isInside = await isParentInsideSection(
      [sectionPage, childWithoutSection],
      MOCK_CHILD_ID,
    );

    expect(isInside).toBe(true);
  });

  it('is outside a section when no ancestor has section navigation on', async () => {
    const isInside = await isParentInsideSection(
      [
        mockLandingPage({ _id: MOCK_SECTION_ID, slug: MOCK_SECTION_SLUG }),
        childWithoutSection,
      ],
      MOCK_CHILD_ID,
    );

    expect(isInside).toBe(false);
  });

  it('is outside a section without a parent', () => {
    expect(isInsideSection(null)).toBe(false);
  });
});
