import { customRender, screen } from '@web/testing/custom-render';
import { makeLandingSectionNavigation } from '@web/testing/pages/landing-page/fixtures';

import { SectionNavigation } from './section-navigation';

vi.mock('@web/i18n/navigation');

const setup = customRender(SectionNavigation, {
  sectionNavigation: makeLandingSectionNavigation(),
});

describe(`<${SectionNavigation.name}/>`, () => {
  describe('on a page beneath the section root', () => {
    beforeEach(() => {
      setup();
    });

    it('renders an "In this section" nav landmark', () => {
      expect(
        screen.getByRole('navigation', { name: 'In this section' }),
      ).toBeVisible();
    });

    it('links the section root first, then its pages in the given order', () => {
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
  });

  describe('on the section root', () => {
    beforeEach(() => {
      setup({
        sectionNavigation: makeLandingSectionNavigation({
          root: { title: 'Modules', path: 'modules', isCurrent: true },
          pages: [{ title: 'FAQ', path: 'modules/faq', isCurrent: false }],
        }),
      });
    });

    it('marks the section root as the current page', () => {
      expect(screen.getByRole('link', { name: 'Modules' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('shows the section root in the mobile selector', () => {
      expect(
        screen.getByRole('button', { name: 'In this section Modules' }),
      ).toBeVisible();
    });
  });
});
