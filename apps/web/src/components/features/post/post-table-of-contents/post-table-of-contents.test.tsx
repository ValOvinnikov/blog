import { customRender, screen } from '@web/testing/custom-render';
import { mockPostHeadings } from '@web/testing/shared/post-table-of-contents/fixtures';

import { PostTableOfContents } from './post-table-of-contents';

const { useActiveHeadingIdMock } = vi.hoisted(() => ({
  useActiveHeadingIdMock: vi.fn(() => null as string | null),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/hooks/use-active-heading-id', () => ({
  useActiveHeadingId: useActiveHeadingIdMock,
}));

const setup = customRender(PostTableOfContents, { headings: mockPostHeadings });

describe(`<${PostTableOfContents.name}/>`, () => {
  describe('before any heading is active', () => {
    beforeEach(() => {
      useActiveHeadingIdMock.mockReturnValue(null);
      setup();
    });

    it('renders a "Contents" nav landmark', () => {
      expect(screen.getByRole('navigation', { name: 'Contents' })).toBeVisible();
    });

    it('renders every heading as a link to its anchor', () => {
      mockPostHeadings.forEach((heading) => {
        expect(
          screen.getByRole('link', { name: heading.text }),
        ).toHaveAttribute('href', `#${heading.key}`);
      });
    });

    it('shows the mobile selector defaulting to the first heading', () => {
      expect(
        screen.getByRole('button', { name: 'Contents Getting started' }),
      ).toBeVisible();
    });

    it('marks the first heading as the current location', () => {
      expect(
        screen.getByRole('link', { name: 'Getting started' }),
      ).toHaveAttribute('aria-current', 'location');
      mockPostHeadings.slice(1).forEach((heading) => {
        expect(
          screen.getByRole('link', { name: heading.text }),
        ).not.toHaveAttribute('aria-current');
      });
    });

    it('passes the heading ids to useActiveHeadingId in document order', () => {
      expect(useActiveHeadingIdMock).toHaveBeenCalledWith([
        'getting-started',
        'prerequisites',
        'configuration',
        'deployment',
      ]);
    });
  });

  describe('once useActiveHeadingId reports a heading', () => {
    beforeEach(() => {
      useActiveHeadingIdMock.mockReturnValue('configuration');
      setup();
    });

    it('marks that heading as the current location, and no other', () => {
      expect(
        screen.getByRole('link', { name: 'Configuration' }),
      ).toHaveAttribute('aria-current', 'location');
      expect(
        screen.getByRole('link', { name: 'Getting started' }),
      ).not.toHaveAttribute('aria-current');
    });

    it('shows that heading in the mobile selector', () => {
      expect(
        screen.getByRole('button', { name: 'Contents Configuration' }),
      ).toBeVisible();
    });
  });
});
