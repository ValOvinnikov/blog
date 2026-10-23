import userEvent, { type UserEvent } from '@testing-library/user-event';
import { usePathname } from '@web/i18n/navigation';
import { fireEvent, renderElement, screen } from '@web/testing/custom-render';
import {
  MOCK_ABOUT_LINK,
  MOCK_BLOG_LINK,
  MOCK_HOME_LINK,
} from '@web/testing/shared/link/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { SiteNavigation } from './site-navigation';

vi.mock('@web/i18n/navigation');

const ARIA_CURRENT = 'aria-current';
const ARIA_EXPANDED = 'aria-expanded';
const TOGGLE_NAME = 'Toggle navigation menu';
const BLOG_POST_PATH = `${MOCK_BLOG_LINK.href}/hello-world`;

const links = [MOCK_HOME_LINK, MOCK_BLOG_LINK, MOCK_ABOUT_LINK];

const getToggle = () => screen.getByRole('button', { name: TOGGLE_NAME });

describe(`<${SiteNavigation.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue(MOCK_HOME_LINK.href);
  });

  it('marks the Home item active only on the exact root path', () => {
    renderElement(<SiteNavigation links={links} />);

    const homeLink = screen.getByRole('link', { name: MOCK_HOME_LINK.label });
    const blogLink = screen.getByRole('link', { name: MOCK_BLOG_LINK.label });
    const aboutLink = screen.getByRole('link', { name: MOCK_ABOUT_LINK.label });

    expect(homeLink).toHaveAttribute(ARIA_CURRENT, 'page');
    expect(blogLink).not.toHaveAttribute(ARIA_CURRENT);
    expect(aboutLink).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('does not mark Home active on a nested route', () => {
    vi.mocked(usePathname).mockReturnValue(MOCK_BLOG_LINK.href);
    renderElement(<SiteNavigation links={links} />);

    const homeLink = screen.getByRole('link', { name: MOCK_HOME_LINK.label });

    expect(homeLink).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('marks a section item active via prefix match on nested routes', () => {
    vi.mocked(usePathname).mockReturnValue(BLOG_POST_PATH);
    renderElement(<SiteNavigation links={links} />);

    const blogLink = screen.getByRole('link', { name: MOCK_BLOG_LINK.label });
    const aboutLink = screen.getByRole('link', { name: MOCK_ABOUT_LINK.label });

    expect(blogLink).toHaveAttribute(ARIA_CURRENT, 'page');
    expect(aboutLink).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('marks the matching item active on a prerendered tenant-scoped path', () => {
    vi.mocked(usePathname).mockReturnValue(
      `/${MOCK_TENANT_ID}/EN${BLOG_POST_PATH}`,
    );
    renderElement(<SiteNavigation links={links} />);

    const blogLink = screen.getByRole('link', { name: MOCK_BLOG_LINK.label });

    expect(blogLink).toHaveAttribute(ARIA_CURRENT, 'page');
  });

  it('marks Home active on the prerendered tenant-scoped home path', () => {
    vi.mocked(usePathname).mockReturnValue(`/${MOCK_TENANT_ID}/EN`);
    renderElement(<SiteNavigation links={links} />);

    const homeLink = screen.getByRole('link', { name: MOCK_HOME_LINK.label });

    expect(homeLink).toHaveAttribute(ARIA_CURRENT, 'page');
  });

  it('does not match a path that merely shares the section prefix', () => {
    vi.mocked(usePathname).mockReturnValue('/blogging');
    renderElement(<SiteNavigation links={links} />);

    const blogLink = screen.getByRole('link', { name: MOCK_BLOG_LINK.label });

    expect(blogLink).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('renders the actions slot', () => {
    renderElement(
      <SiteNavigation links={links} actions={<button>Toggle</button>} />,
    );

    const actionButton = screen.getByRole('button', { name: 'Toggle' });

    expect(actionButton).toBeVisible();
  });

  describe('mobile toggle', () => {
    let user: UserEvent;
    let view: ReturnType<typeof renderElement>;
    let toggle: HTMLElement;

    beforeEach(() => {
      user = userEvent.setup();
      view = renderElement(<SiteNavigation links={links} />);
      toggle = getToggle();
    });

    it('passes a real, non-generic accessible name for the toggle', () => {
      expect(toggle).toHaveAccessibleName(TOGGLE_NAME);
    });

    it('opens the panel on toggle click and reflects it via aria-expanded', async () => {
      expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'false');

      await user.click(toggle);

      expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'true');
    });

    it('closes on Escape and returns focus to the toggle', async () => {
      await user.click(toggle);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'false');
      expect(toggle).toHaveFocus();
    });

    it('closes on an outside click', async () => {
      await user.click(toggle);

      fireEvent.mouseDown(document.body);

      expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    it('closes automatically when the route changes', async () => {
      await user.click(toggle);
      expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'true');

      vi.mocked(usePathname).mockReturnValue(MOCK_BLOG_LINK.href);
      view.rerender(<SiteNavigation links={links} />);

      const rerenderedToggle = getToggle();

      expect(rerenderedToggle).toHaveAttribute(ARIA_EXPANDED, 'false');
    });
  });
});
