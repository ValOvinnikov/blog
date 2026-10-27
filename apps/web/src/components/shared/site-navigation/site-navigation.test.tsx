import { ARIA_CURRENT } from '@blog/ui/testing/aria';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { usePathname } from '@web/i18n/navigation';
import { customRender, fireEvent, screen } from '@web/testing/custom-render';
import {
  MOCK_ABOUT_LINK,
  MOCK_BLOG_LINK,
  MOCK_HOME_LINK,
} from '@web/testing/shared/link/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { SiteNavigation } from './site-navigation';

vi.mock('@web/i18n/navigation');

const ARIA_EXPANDED = 'aria-expanded';
const TOGGLE_NAME = 'Toggle navigation menu';
const BLOG_POST_PATH = `${MOCK_BLOG_LINK.href}/hello-world`;

const links = [MOCK_HOME_LINK, MOCK_BLOG_LINK, MOCK_ABOUT_LINK];

const setup = customRender(SiteNavigation, {
  links,
});

describe(`<${SiteNavigation.name}/>`, () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReset();
  });

  it('marks the Home item active only on the exact root path', () => {
    setup();

    const homeLink = screen.getByRole('link', { name: MOCK_HOME_LINK.label });
    const blogLink = screen.getByRole('link', { name: MOCK_BLOG_LINK.label });
    const aboutLink = screen.getByRole('link', { name: MOCK_ABOUT_LINK.label });

    expect(homeLink).toHaveAttribute(ARIA_CURRENT, 'page');
    expect(blogLink).not.toHaveAttribute(ARIA_CURRENT);
    expect(aboutLink).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('does not mark Home active on a nested route', () => {
    vi.mocked(usePathname).mockReturnValue(MOCK_BLOG_LINK.href);
    setup();

    const homeLink = screen.getByRole('link', { name: MOCK_HOME_LINK.label });

    expect(homeLink).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('marks a section item active via prefix match on nested routes', () => {
    vi.mocked(usePathname).mockReturnValue(BLOG_POST_PATH);
    setup();

    const blogLink = screen.getByRole('link', { name: MOCK_BLOG_LINK.label });
    const aboutLink = screen.getByRole('link', { name: MOCK_ABOUT_LINK.label });

    expect(blogLink).toHaveAttribute(ARIA_CURRENT, 'page');
    expect(aboutLink).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('marks the matching item active on a prerendered tenant-scoped path', () => {
    vi.mocked(usePathname).mockReturnValue(
      `/${MOCK_TENANT_ID}/EN${BLOG_POST_PATH}`,
    );
    setup();

    const blogLink = screen.getByRole('link', { name: MOCK_BLOG_LINK.label });

    expect(blogLink).toHaveAttribute(ARIA_CURRENT, 'page');
  });

  it('marks Home active on the prerendered tenant-scoped home path', () => {
    vi.mocked(usePathname).mockReturnValue(`/${MOCK_TENANT_ID}/EN`);
    setup();

    const homeLink = screen.getByRole('link', { name: MOCK_HOME_LINK.label });

    expect(homeLink).toHaveAttribute(ARIA_CURRENT, 'page');
  });

  it('does not match a path that merely shares the section prefix', () => {
    vi.mocked(usePathname).mockReturnValue('/blogging');
    setup();

    const blogLink = screen.getByRole('link', { name: MOCK_BLOG_LINK.label });

    expect(blogLink).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('renders the actions slot', () => {
    setup({ actions: <button>Toggle</button> });

    const actionButton = screen.getByRole('button', { name: 'Toggle' });

    expect(actionButton).toBeVisible();
  });

  describe('mobile toggle', () => {
    let user: UserEvent;
    let toggle: HTMLElement;
    let view: ReturnType<typeof setup>;

    beforeEach(() => {
      user = userEvent.setup();
      view = setup();
      toggle = screen.getByRole('button', { name: TOGGLE_NAME });
    });

    it('opens the panel on toggle click and reflects it via aria-expanded', async () => {
      expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'false');

      await user.click(toggle);

      expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'true');
    });

    it('closes on Escape and returns focus to the toggle', async () => {
      await user.click(toggle);

      await user.keyboard('{Escape}');

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

      const rerenderedToggle = screen.getByRole('button', {
        name: TOGGLE_NAME,
      });

      expect(rerenderedToggle).toHaveAttribute(ARIA_EXPANDED, 'false');
    });
  });
});
