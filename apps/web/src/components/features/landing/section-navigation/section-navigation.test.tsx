import { customRender, screen } from '@web/testing/custom-render';
import { makeLandingSectionNavigation } from '@web/testing/pages/landing-page/fixtures';

import { SectionNavigation } from './section-navigation';

vi.mock('@web/i18n/navigation');

const setup = customRender(SectionNavigation, {
  sectionNavigation: makeLandingSectionNavigation(),
});

describe(`<${SectionNavigation.name}/>`, () => {
  it('renders an "In this section" nav landmark', () => {
    setup();

    expect(
      screen.getByRole('navigation', { name: 'In this section' }),
    ).toBeVisible();
  });

  it('links the section root first, then its pages in the given order', () => {
    setup();

    expect(
      screen
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Modules', '/modules'],
      ['FAQ', '/modules/faq'],
      ['Pricing', '/modules/pricing'],
    ]);
  });

  it('marks the current page with aria-current="page", and no other', () => {
    setup();

    expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Modules' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('link', { name: 'Pricing' })).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('marks the section root as current when the reader is on it', () => {
    setup({
      sectionNavigation: makeLandingSectionNavigation({
        root: { title: 'Modules', path: 'modules', isCurrent: true },
        pages: [{ title: 'FAQ', path: 'modules/faq', isCurrent: false }],
      }),
    });

    expect(screen.getByRole('link', { name: 'Modules' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('button', { name: 'In this section Modules' }),
    ).toBeVisible();
  });
});
