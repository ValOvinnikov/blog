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

  describe('with an authored section title', () => {
    beforeEach(() => {
      setup({
        sectionNavigation: makeLandingSectionNavigation({ title: 'Guides' }),
      });
    });

    it('names the nav landmark with the authored title', () => {
      expect(screen.getByRole('navigation', { name: 'Guides' })).toBeVisible();
    });

    it('does not fall back to "In this section"', () => {
      expect(
        screen.queryByRole('navigation', { name: 'In this section' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('in a section nested inside another section', () => {
    beforeEach(() => {
      setup({
        sectionNavigation: makeLandingSectionNavigation({
          parentSection: { title: 'Library', path: 'library' },
        }),
      });
    });

    it('starts with a back link to the parent section', () => {
      expect(screen.getAllByRole('link').at(0)).toBe(
        screen.getByRole('link', { name: 'Back to Library' }),
      );
    });

    it("points the back link at the parent section's path", () => {
      expect(
        screen.getByRole('link', { name: 'Back to Library' }),
      ).toHaveAttribute('href', '/library');
    });
  });

  describe('in a top-level section', () => {
    beforeEach(() => {
      setup();
    });

    it('renders no back link', () => {
      expect(
        screen.queryByRole('link', { name: /^Back to/ }),
      ).not.toBeInTheDocument();
    });
  });
});
