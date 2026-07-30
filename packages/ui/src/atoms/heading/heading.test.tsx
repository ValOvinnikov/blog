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
});
