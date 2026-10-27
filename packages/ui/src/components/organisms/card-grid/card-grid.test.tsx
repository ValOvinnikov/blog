import { customRender, screen } from '@blog/ui/testing/custom-render';

import { CardGrid } from './card-grid';

const setup = customRender(CardGrid, {
  children: (
    <>
      <article>First</article>
      <article>Second</article>
      <article>Third</article>
    </>
  ),
});

describe(`<${CardGrid.name}/>`, () => {
  it('renders every child', () => {
    setup();

    const articles = screen.getAllByRole('article');

    expect(articles).toHaveLength(3);
  });
});
