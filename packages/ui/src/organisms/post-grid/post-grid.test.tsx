import { customRender, screen } from '@blog/ui/testing/custom-render';

import { PostGrid } from './post-grid';

const setup = customRender(PostGrid, {
  children: (
    <>
      <article>First</article>
      <article>Second</article>
      <article>Third</article>
    </>
  ),
});

describe(`<${PostGrid.name}/>`, () => {
  it('renders children inside the grid wrapper', () => {
    setup();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });
});
