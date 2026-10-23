import {
  MOCK_SECTION_PAGES_PARENT_PATH,
  mockRawSectionPage,
} from '@blog/service/testing/modules/fixtures';
import { mockRawHeadingBlock } from '@blog/service/testing/shared/fixtures';

import { toSectionPageCards } from './transformer';

const TITLE = 'FAQ';

describe(toSectionPageCards, () => {
  it('maps each page to a card titled by its heading, summarised by its text', () => {
    const [card] = toSectionPageCards(
      [mockRawSectionPage()],
      MOCK_SECTION_PAGES_PARENT_PATH,
    );
    const { image, ...fields } = card ?? {};

    expect(fields).toEqual({
      id: 'page-faq',
      title: TITLE,
      summary: 'Answers to common questions.',
      path: 'section-home/faq',
    });
    expect(image).toBeDefined();
  });

  it('builds each nested path from the hosting page path and the child slug', () => {
    const [card] = toSectionPageCards(
      [mockRawSectionPage({ slug: 'billing' })],
      'guides/faq',
    );

    expect(card?.path).toBe('guides/faq/billing');
  });

  it('keeps the children in the order they were returned', () => {
    const cards = toSectionPageCards(
      [mockRawSectionPage({ _id: 'b' }), mockRawSectionPage({ _id: 'a' })],
      MOCK_SECTION_PAGES_PARENT_PATH,
    );

    expect(cards.map((card) => card.id)).toEqual(['b', 'a']);
  });

  it('leaves the summary and image undefined when the child has neither', () => {
    const [card] = toSectionPageCards(
      [
        mockRawSectionPage({
          headingBlock: mockRawHeadingBlock(TITLE),
          image: null,
        }),
      ],
      MOCK_SECTION_PAGES_PARENT_PATH,
    );

    expect(card?.summary).toBeUndefined();
    expect(card?.image).toBeUndefined();
  });
});
