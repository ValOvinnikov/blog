import { customRender, screen } from '@web/testing/custom-render';

import { PlainSection } from './plain-section';

const setup = customRender(PlainSection, {
  heading: 'Section title',
  children: <p>Body content</p>,
});

describe(`<${PlainSection.name}/>`, () => {
  it('renders its heading and children', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Section title' }),
    ).toBeVisible();
    expect(screen.getByText('Body content')).toBeVisible();
  });

  it('renders the given headingLevel', () => {
    customRender(PlainSection, {
      heading: 'Section title',
      headingLevel: 3,
      children: <p>Body content</p>,
    })();

    expect(
      screen.getByRole('heading', { level: 3, name: 'Section title' }),
    ).toBeVisible();
  });
});
