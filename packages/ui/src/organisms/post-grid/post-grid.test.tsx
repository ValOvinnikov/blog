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

  it('applies grid layout class to the wrapper', () => {
    render(<PostGrid dataTestId="grid">content</PostGrid>);
    expect(screen.getByTestId('grid').className).toContain('grid');
  });

  it('merges extra className', () => {
    render(
      <PostGrid className="mt-8" dataTestId="grid">
        content
      </PostGrid>,
    );
    expect(screen.getByTestId('grid').className).toContain('mt-8');
  });
});
