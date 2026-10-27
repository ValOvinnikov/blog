import {
  MOCK_SECTION_PAGES_PARENT_PATH,
  mockRawSectionPage,
} from '@blog/service/testing/modules/fixtures';
import {
  mockRawHeadingBlock,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toSectionPageCards } from './transformer';

faker.seed(33);

const MOCK_PAGE_ID = faker.string.uuid();
const MOCK_PAGE_SLUG = faker.lorem.slug();
const MOCK_TITLE = faker.lorem.words(2);
const MOCK_SUMMARY = faker.lorem.sentence();
const MOCK_FIRST_ID = faker.string.uuid();
const MOCK_SECOND_ID = faker.string.uuid();

describe(toSectionPageCards, () => {
  it('maps each page to a card titled by its heading, summarised by its text', () => {
    const [card] = toSectionPageCards(
      [
        mockRawSectionPage({
          _id: MOCK_PAGE_ID,
          slug: MOCK_PAGE_SLUG,
          headingBlock: mockRawHeadingBlock(MOCK_TITLE, {
            supportingText: MOCK_SUMMARY,
          }),
        }),
      ],
      MOCK_SECTION_PAGES_PARENT_PATH,
    );

    expect(card).toEqual({
      id: MOCK_PAGE_ID,
      title: MOCK_TITLE,
      summary: MOCK_SUMMARY,
      image: mockSanityImageView(),
      path: `${MOCK_SECTION_PAGES_PARENT_PATH}/${MOCK_PAGE_SLUG}`,
    });
  });

  it('keeps the children in the order they were returned', () => {
    const cards = toSectionPageCards(
      [
        mockRawSectionPage({ _id: MOCK_SECOND_ID }),
        mockRawSectionPage({ _id: MOCK_FIRST_ID }),
      ],
      MOCK_SECTION_PAGES_PARENT_PATH,
    );

    expect(cards.map((card) => card.id)).toEqual([
      MOCK_SECOND_ID,
      MOCK_FIRST_ID,
    ]);
  });

  it('leaves the summary and image undefined when the child has neither', () => {
    const [card] = toSectionPageCards(
      [
        mockRawSectionPage({
          headingBlock: mockRawHeadingBlock(MOCK_TITLE),
          image: null,
        }),
      ],
      MOCK_SECTION_PAGES_PARENT_PATH,
    );

    expect(card?.summary).toBeUndefined();
    expect(card?.image).toBeUndefined();
  });
});
