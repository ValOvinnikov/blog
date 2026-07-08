import { render, screen } from '@testing-library/react';

import { PostGrid } from './post-grid';

describe(`<${PostGrid.name}/>`, () => {
  it('renders children inside the grid wrapper', () => {
    render(
      <PostGrid>
        <article>First</article>
        <article>Second</article>
        <article>Third</article>
      </PostGrid>,
    );
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });
});
