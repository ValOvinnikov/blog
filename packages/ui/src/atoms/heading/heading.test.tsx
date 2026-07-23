import { Size } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';

import { Heading } from './heading';

const setup = customRender(Heading, {
  level: 1,
  children: 'Title',
});

describe(`<${Heading.name}/>`, () => {
  it('renders h1 for level 1', () => {
    setup();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Title' }),
    ).toBeVisible();
  });

  it('renders h2 for level 2', () => {
    setup({ level: 2, children: 'Subtitle' });
    expect(
      screen.getByRole('heading', { level: 2, name: 'Subtitle' }),
    ).toBeVisible();
  });

  it('renders h3 for level 3', () => {
    setup({ level: 3, children: 'Section' });
    expect(
      screen.getByRole('heading', { level: 3, name: 'Section' }),
    ).toBeVisible();
  });

  it('renders h4 for level 4', () => {
    setup({ level: 4, children: 'Subsection' });
    expect(
      screen.getByRole('heading', { level: 4, name: 'Subsection' }),
    ).toBeVisible();
  });

  it('applies size override', () => {
    setup({ level: 1, size: Size.SM, children: 'Small Heading' });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Small Heading' })
        .className,
    ).toContain('text-xl');
  });

  it('applies default size for level 1', () => {
    setup({ level: 1, children: 'Default' });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Default' }).className,
    ).toContain('text-display');
  });

  it('applies default size for level 4', () => {
    setup({ level: 4, children: 'Default' });
    expect(
      screen.getByRole('heading', { level: 4, name: 'Default' }).className,
    ).toContain('text-2xl');
  });

  it('applies visual variant hero', () => {
    setup({ level: 1, visual: 'hero', children: 'Hero' });
    expect(
      screen.getByRole('heading', { level: 1, name: 'Hero' }).className,
    ).toContain('text-hero');
  });

  it('visual variant skips default size class', () => {
    setup({ level: 1, visual: 'card', children: 'Card' });
    const cls = screen.getByRole('heading', {
      level: 1,
      name: 'Card',
    }).className;
    expect(cls).toContain('text-card-title');
    expect(cls).not.toContain('text-display');
  });
});
