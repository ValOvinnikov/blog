import { render, screen } from '@testing-library/react';
import { Size } from '@blog/config';

import { Heading } from './heading';

describe(`<${Heading.name}/>`, () => {
  it('renders h1 for level 1', () => {
    render(<Heading level={1}>Title</Heading>);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Title' })
    ).toBeInTheDocument();
  });

  it('renders h2 for level 2', () => {
    render(<Heading level={2}>Subtitle</Heading>);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Subtitle' })
    ).toBeInTheDocument();
  });

  it('renders h3 for level 3', () => {
    render(<Heading level={3}>Section</Heading>);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Section' })
    ).toBeInTheDocument();
  });

  it('renders h4 for level 4', () => {
    render(<Heading level={4}>Subsection</Heading>);
    expect(
      screen.getByRole('heading', { level: 4, name: 'Subsection' })
    ).toBeInTheDocument();
  });

  it('merges extra className', () => {
    render(
      <Heading level={1} className="mt-8">
        Styled
      </Heading>
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Styled' }).className
    ).toContain('mt-8');
  });

  it('applies size override', () => {
    render(
      <Heading level={1} size={Size.SM}>
        Small Heading
      </Heading>
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Small Heading' }).className
    ).toContain('text-xl');
  });

  it('applies default size for level 1', () => {
    render(<Heading level={1}>Default</Heading>);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Default' }).className
    ).toContain('text-5xl');
  });

  it('applies default size for level 4', () => {
    render(<Heading level={4}>Default</Heading>);
    expect(
      screen.getByRole('heading', { level: 4, name: 'Default' }).className
    ).toContain('text-2xl');
  });
});
