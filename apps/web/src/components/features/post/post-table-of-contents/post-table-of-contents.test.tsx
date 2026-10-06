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
  beforeEach(() => {
    useActiveHeadingIdMock.mockReturnValue(null);
  });

  it('renders a "Topics" nav landmark', () => {
    setup();

    expect(screen.getByRole('navigation', { name: 'Topics' })).toBeVisible();
  });

  it('renders every heading as a link to its anchor', () => {
    setup();

    mockPostHeadings.forEach((heading) => {
      expect(screen.getByRole('link', { name: heading.text })).toHaveAttribute(
        'href',
        `#${heading.key}`,
      );
    });
  });

  it('shows the mobile selector defaulting to the first heading before any scroll', () => {
    setup();

    expect(
      screen.getByRole('button', { name: 'Topics Getting started' }),
    ).toBeVisible();
  });

  it('marks the first heading as the current location when no heading is active yet', () => {
    setup();

    expect(
      screen.getByRole('link', { name: 'Getting started' }),
    ).toHaveAttribute('aria-current', 'location');
    mockPostHeadings.slice(1).forEach((heading) => {
      expect(
        screen.getByRole('link', { name: heading.text }),
      ).not.toHaveAttribute('aria-current');
    });
  });

  it('marks the heading reported by useActiveHeadingId as the current location', () => {
    useActiveHeadingIdMock.mockReturnValue('configuration');
    setup();

    expect(screen.getByRole('link', { name: 'Configuration' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    expect(
      screen.getByRole('button', { name: 'Topics Configuration' }),
    ).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Getting started' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('passes the heading ids to useActiveHeadingId in document order', () => {
    setup();

    expect(useActiveHeadingIdMock).toHaveBeenCalledWith([
      'getting-started',
      'prerequisites',
      'configuration',
      'deployment',
    ]);
  });
});
