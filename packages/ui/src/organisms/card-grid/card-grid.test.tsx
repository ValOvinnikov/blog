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
  it('renders children inside the grid wrapper', () => {
    setup();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('defaults to the three-column classes when columns is omitted', () => {
    const { container } = setup();
    expect(container.firstChild).toHaveClass(
      'grid-cols-1',
      'sm:grid-cols-2',
      'md:grid-cols-3',
    );
  });

  it('applies the three-column classes for columns={3}', () => {
    const { container } = setup({ columns: 3 });
    expect(container.firstChild).toHaveClass(
      'grid-cols-1',
      'sm:grid-cols-2',
      'md:grid-cols-3',
    );
  });

  it('applies the two-column classes for columns={2}', () => {
    const { container } = setup({ columns: 2 });
    expect(container.firstChild).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
    expect(container.firstChild).not.toHaveClass('md:grid-cols-3');
  });

  it('applies the single-column class for columns={1}', () => {
    const { container } = setup({ columns: 1 });
    expect(container.firstChild).toHaveClass('grid-cols-1');
    expect(container.firstChild).not.toHaveClass('sm:grid-cols-2');
    expect(container.firstChild).not.toHaveClass('md:grid-cols-3');
  });

  it('applies the four-column classes for columns={4}', () => {
    const { container } = setup({ columns: 4 });
    expect(container.firstChild).toHaveClass(
      'grid-cols-1',
      'sm:grid-cols-2',
      'md:grid-cols-3',
      'lg:grid-cols-4',
    );
  });
});
