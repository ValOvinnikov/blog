import { Size } from '@blog/config';
import { render, screen } from '@testing-library/react';

import { Heading } from './heading';

describe(`<${Heading.name}/>`, () => {
  it('renders h1 for level 1', () => {
    render(<Heading level={1}>Title</Heading>);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Title' }),
    ).toBeVisible();
  });

  it('renders h2 for level 2', () => {
    render(<Heading level={2}>Subtitle</Heading>);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Subtitle' }),
    ).toBeVisible();
  });

  it('renders h3 for level 3', () => {
    render(<Heading level={3}>Section</Heading>);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Section' }),
    ).toBeVisible();
  });

  it('renders h4 for level 4', () => {
    render(<Heading level={4}>Subsection</Heading>);
    expect(
      screen.getByRole('heading', { level: 4, name: 'Subsection' }),
    ).toBeVisible();
  });

  it('applies size override', () => {
    render(
      <Heading level={1} size={Size.SM}>
        Small Heading
      </Heading>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Small Heading' })
        .className,
    ).toContain('text-xl');
  });

  it('applies default size for level 1', () => {
    render(<Heading level={1}>Default</Heading>);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Default' }).className,
    ).toContain('text-display');
  });

  it('applies default size for level 4', () => {
    render(<Heading level={4}>Default</Heading>);
    expect(
      screen.getByRole('heading', { level: 4, name: 'Default' }).className,
    ).toContain('text-2xl');
  });

  it('applies visual variant hero', () => {
    render(
      <Heading level={1} visual="hero">
        Hero
      </Heading>,
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Hero' }).className,
    ).toContain('text-hero');
  });

  it('visual variant skips default size class', () => {
    render(
      <Heading level={1} visual="card">
        Card
      </Heading>,
    );
    const cls = screen.getByRole('heading', {
      level: 1,
      name: 'Card',
    }).className;
    expect(cls).toContain('text-card-title');
    expect(cls).not.toContain('text-display');
  });
});
