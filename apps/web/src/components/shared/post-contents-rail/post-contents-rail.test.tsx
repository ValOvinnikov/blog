import userEvent from '@testing-library/user-event';
import { customRender, fireEvent, screen } from '@web/testing/custom-render';
import { mockPostHeadings } from '@web/testing/shared/post-contents-rail/fixtures';

import { PostContentsRail } from './post-contents-rail';

const { useActiveHeadingIdMock } = vi.hoisted(() => ({
  useActiveHeadingIdMock: vi.fn(() => null as string | null),
}));

vi.mock('@web/hooks/use-active-heading-id', () => ({
  useActiveHeadingId: useActiveHeadingIdMock,
}));

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const setup = customRender(PostContentsRail, { headings: mockPostHeadings });

describe(`<${PostContentsRail.name}/>`, () => {
  beforeEach(() => {
    useActiveHeadingIdMock.mockReturnValue(null);
  });

  it('renders a single "On this page" nav landmark', () => {
    setup();

    expect(
      screen.getAllByRole('navigation', { name: 'On this page' }),
    ).toHaveLength(1);
  });

  it('renders every heading as a link to its anchor in the always-visible desktop list', () => {
    setup();

    mockPostHeadings.forEach((heading) => {
      expect(screen.getByRole('link', { name: heading.text })).toHaveAttribute(
        'href',
        `#${heading.id}`,
      );
    });
  });

  it('starts with the mobile disclosure closed, so its copy of the links is not in the accessibility tree', () => {
    setup();

    const trigger = screen.getByRole('button', { name: 'On this page' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // One link per heading (the always-visible desktop copy) while the
    // `hidden`-attributed mobile panel's duplicate copy is excluded.
    expect(screen.getAllByRole('link')).toHaveLength(mockPostHeadings.length);
  });

  it('opens the mobile disclosure on trigger click, exposing its own copy of the links', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'On this page' }));

    expect(
      screen.getByRole('button', { name: 'On this page' }),
    ).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('link')).toHaveLength(
      mockPostHeadings.length * 2,
    );
  });

  it('closes the mobile disclosure on Escape', async () => {
    const user = userEvent.setup();
    setup();
    const trigger = screen.getByRole('button', { name: 'On this page' });

    await user.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByRole('link')).toHaveLength(mockPostHeadings.length);
  });

  it('closes the mobile disclosure on an outside click', async () => {
    const user = userEvent.setup();
    setup();
    const trigger = screen.getByRole('button', { name: 'On this page' });

    await user.click(trigger);
    fireEvent.mouseDown(document.body);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getAllByRole('link')).toHaveLength(mockPostHeadings.length);
  });

  it('marks the active heading link with aria-current="location", and no other', () => {
    useActiveHeadingIdMock.mockReturnValue('configuration');
    setup();

    expect(screen.getByRole('link', { name: 'Configuration' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    expect(
      screen.getByRole('link', { name: 'Getting started' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('renders no aria-current when no heading is active', () => {
    setup();

    mockPostHeadings.forEach((heading) => {
      expect(
        screen.getByRole('link', { name: heading.text }),
      ).not.toHaveAttribute('aria-current');
    });
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
