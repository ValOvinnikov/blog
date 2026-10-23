import { ARIA_CURRENT } from '@blog/ui/testing/aria';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CONFIGURATION_HEADING,
  MOCK_GETTING_STARTED_HEADING,
  MOCK_POST_HEADINGS,
} from '@web/testing/shared/post-table-of-contents/fixtures';

import { PostTableOfContents } from './post-table-of-contents';

const { useActiveHeadingIdMock } = vi.hoisted(() => ({
  useActiveHeadingIdMock: vi.fn(() => null as string | null),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@web/hooks/use-active-heading-id', () => ({
  useActiveHeadingId: useActiveHeadingIdMock,
}));

const NAV_NAME = 'Contents';

const setup = customRender(PostTableOfContents, {
  headings: MOCK_POST_HEADINGS,
});

describe(`<${PostTableOfContents.name}/>`, () => {
  describe('before any heading is active', () => {
    beforeEach(() => {
      useActiveHeadingIdMock.mockReturnValue(null);
      setup();
    });

    it('renders a "Contents" nav landmark', () => {
      const nav = screen.getByRole('navigation', { name: NAV_NAME });

      expect(nav).toBeVisible();
    });

    it('renders every heading as a link to its anchor', () => {
      MOCK_POST_HEADINGS.forEach((heading) => {
        const link = screen.getByRole('link', { name: heading.text });

        expect(link).toHaveAttribute('href', `#${heading.key}`);
      });
    });

    it('shows the mobile selector defaulting to the first heading', () => {
      const selector = screen.getByRole('button', {
        name: `${NAV_NAME} ${MOCK_GETTING_STARTED_HEADING.text}`,
      });

      expect(selector).toBeVisible();
    });

    it('marks the first heading as the current location', () => {
      const firstLink = screen.getByRole('link', {
        name: MOCK_GETTING_STARTED_HEADING.text,
      });

      expect(firstLink).toHaveAttribute(ARIA_CURRENT, 'location');
      MOCK_POST_HEADINGS.slice(1).forEach((heading) => {
        const link = screen.getByRole('link', { name: heading.text });

        expect(link).not.toHaveAttribute(ARIA_CURRENT);
      });
    });

    it('passes the heading ids to useActiveHeadingId in document order', () => {
      expect(useActiveHeadingIdMock).toHaveBeenCalledWith(
        MOCK_POST_HEADINGS.map((heading) => heading.key),
      );
    });
  });

  describe('once useActiveHeadingId reports a heading', () => {
    beforeEach(() => {
      useActiveHeadingIdMock.mockReturnValue(MOCK_CONFIGURATION_HEADING.key);
      setup();
    });

    it('marks that heading as the current location, and no other', () => {
      const activeLink = screen.getByRole('link', {
        name: MOCK_CONFIGURATION_HEADING.text,
      });
      const firstLink = screen.getByRole('link', {
        name: MOCK_GETTING_STARTED_HEADING.text,
      });

      expect(activeLink).toHaveAttribute(ARIA_CURRENT, 'location');
      expect(firstLink).not.toHaveAttribute(ARIA_CURRENT);
    });

    it('shows that heading in the mobile selector', () => {
      const selector = screen.getByRole('button', {
        name: `${NAV_NAME} ${MOCK_CONFIGURATION_HEADING.text}`,
      });

      expect(selector).toBeVisible();
    });
  });
});
