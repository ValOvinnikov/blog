import { makeRawChildPage } from '@blog/service/testing/modules/fixtures';

import { toChildPageCards } from './transformer';

describe(toChildPageCards, () => {
  it('maps each child page to a card titled by its heading, summarised by its supporting text', () => {
    const [card] = toChildPageCards([makeRawChildPage()], 'modules');

    expect(card).toMatchObject({
      id: 'page-faq',
      title: 'FAQ',
      summary: 'Answers to common questions.',
      path: 'modules/faq',
    });
    expect(card?.image).toBeDefined();
  });

  it('builds each nested path from the hosting page path and the child slug', () => {
    const [card] = toChildPageCards(
      [makeRawChildPage({ slug: 'billing' })],
      'modules/faq',
    );

    expect(card?.path).toBe('modules/faq/billing');
  });

  it('keeps the children in the order they were returned', () => {
    const cards = toChildPageCards(
      [makeRawChildPage({ _id: 'b' }), makeRawChildPage({ _id: 'a' })],
      'modules',
    );

    expect(cards.map((card) => card.id)).toEqual(['b', 'a']);
  });

  it('leaves the summary and image undefined when the child has neither', () => {
    const [card] = toChildPageCards(
      [
        makeRawChildPage({
          headingBlock: { heading: 'FAQ', supportingText: null },
          image: null,
        }),
      ],
      'modules',
    );

    expect(card?.summary).toBeUndefined();
    expect(card?.image).toBeUndefined();
  });
});
