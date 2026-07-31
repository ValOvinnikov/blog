import userEvent from '@testing-library/user-event';
import {
  customRender,
  fireEvent,
  screen,
  within,
} from '@web/testing/custom-render';
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

  it('labels the desktop list with a real "On this page" heading that names the nav landmark', () => {
    setup();

    // The desktop label is a real `<h2>` — it joins the document outline
    // (reachable via screen-reader heading navigation) — and it's what names
    // the surrounding `<nav>` landmark via `aria-labelledby`.
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'On this page',
    });
    expect(
      screen.getByRole('navigation', { name: 'On this page' }),
    ).toContainElement(heading);
  });

  it('shows the mobile toggle\'s own "On this page" copy, matching the desktop heading', () => {
    setup();

    expect(
      screen.getByRole('button', { name: 'On this page' }),
    ).toBeInTheDocument();
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

  it('opens the mobile disclosure on trigger click, exposing its own copy of the links as plain links', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'On this page' }));

    expect(
      screen.getByRole('button', { name: 'On this page' }),
    ).toHaveAttribute('aria-expanded', 'true');
    // Both the always-visible desktop copy and the now-visible mobile
    // disclosure's copy stay plain links — this is in-page navigation, not a
    // command menu, so neither carries a `role="menu"`/`"menuitem"` override.
    expect(screen.getAllByRole('link')).toHaveLength(
      mockPostHeadings.length * 2,
    );
  });

  it('never puts WAI-ARIA menu roles on either copy of the list', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'On this page' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('lets Tab carry focus through the open mobile disclosure and out into the page, instead of trapping it inside the panel', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'On this page' }));

    const links = screen.getAllByRole('link', {
      name: mockPostHeadings.at(-1)?.text,
    });
    const lastLinkInPanel = links.at(-1);
    lastLinkInPanel?.focus();

    await user.tab();

    expect(document.activeElement).not.toBe(lastLinkInPanel);
    expect(document.activeElement).not.toBe(
      screen.getAllByRole('link', { name: mockPostHeadings.at(0)?.text }).at(0),
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

  it('closes the mobile disclosure when one of its own links is clicked, so the target heading is not left hidden behind the still-open overlay', async () => {
    const user = userEvent.setup();
    setup();
    const trigger = screen.getByRole('button', { name: 'On this page' });
    const panelId = trigger.getAttribute('aria-controls') ?? '';

    await user.click(trigger);
    const panel = document.getElementById(panelId)!;
    const panelLink = within(panel).getByRole('link', {
      name: mockPostHeadings.at(0)?.text,
    });
    await user.click(panelLink);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(panel).toHaveAttribute('hidden');
    // The panel's own copy of the links is gone from the accessibility tree
    // again — only the always-visible desktop copy remains.
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
