import { ARIA_CURRENT } from '@shinefold/ui/testing/aria';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { SESSION_STATUS } from '@web/constants/session';
import { usePathname } from '@web/i18n/navigation';
import {
  customRender,
  fireEvent,
  screen,
  within,
} from '@web/testing/custom-render';
import { ARIA_EXPANDED } from '@web/testing/shared/aria/constants';
import { KEY_ESCAPE } from '@web/testing/shared/keyboard/constants';
import {
  MOCK_ABOUT_LINK,
  MOCK_BLOG_LINK,
  MOCK_HOME_LINK,
  MOCK_TOPICS_GROUP,
  MOCK_TOPICS_LINK,
} from '@web/testing/shared/link/fixtures';
import {
  stubHidePopover,
  unstubHidePopover,
} from '@web/testing/shared/popover/stub-hide-popover';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { useSession, type SessionContextValue } from 'next-auth/react';
import type { Mock } from 'vitest';

import { SiteNavigation } from './site-navigation';

vi.mock('@web/i18n/navigation');

vi.mock('next-auth/react');

const TOGGLE_NAME = 'Toggle navigation menu';
const SIGNED_OUT_SESSION: SessionContextValue = {
  data: null,
  status: SESSION_STATUS.UNAUTHENTICATED,
  update: vi.fn(),
};
const BLOG_POST_PATH = `${MOCK_BLOG_LINK.href}/hello-world`;

const links = [MOCK_HOME_LINK, MOCK_BLOG_LINK, MOCK_ABOUT_LINK];

const setup = customRender(SiteNavigation, {
  links,
  hasReaderAccounts: true,
});

describe(`<${SiteNavigation.name}/>`, () => {
  let user: UserEvent;
  let hidePopover: Mock;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(useSession).mockReturnValue(SIGNED_OUT_SESSION);
    hidePopover = stubHidePopover();
  });

  afterEach(() => {
    unstubHidePopover();
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

  it('marks a sub-item active on its own page', () => {
    vi.mocked(usePathname).mockReturnValue(MOCK_ABOUT_LINK.href);
    setup({ links: [MOCK_TOPICS_GROUP] });

    const aboutLinks = screen.getAllByRole('link', {
      name: MOCK_ABOUT_LINK.label,
      hidden: true,
    });
    const topicsLinks = screen.getAllByRole('link', {
      name: MOCK_TOPICS_LINK.label,
      hidden: true,
    });

    for (const aboutLink of aboutLinks) {
      expect(aboutLink).toHaveAttribute(ARIA_CURRENT, 'page');
    }
    for (const topicsLink of topicsLinks) {
      expect(topicsLink).not.toHaveAttribute(ARIA_CURRENT);
    }
  });

  describe('with a sub-menu group', () => {
    let view: ReturnType<typeof setup>;

    const changeRoute = () => {
      vi.mocked(usePathname).mockReturnValue(MOCK_BLOG_LINK.href);
      view.rerender(
        <SiteNavigation links={[MOCK_TOPICS_GROUP]} hasReaderAccounts={true} />,
      );
    };

    beforeEach(() => {
      view = setup({ links: [MOCK_TOPICS_GROUP] });
    });

    it('closes an open sub-menu when the route changes', () => {
      hidePopover.mockClear();

      changeRoute();

      expect(hidePopover).toHaveBeenCalledOnce();
    });

    it('folds an open disclosure sub-menu when the route changes', async () => {
      const toggle = screen.getByRole('button', { name: TOGGLE_NAME });
      await user.click(toggle);
      const disclosure = screen.getByRole('group');
      const summary = within(disclosure).getByText(MOCK_TOPICS_GROUP.label, {
        // eslint-disable-next-line shinefold-touched/prefer-shared-constant -- the <summary> element, not TWITTER_CARD.SUMMARY
        selector: 'summary',
      });
      await user.click(summary);
      expect(disclosure).toHaveAttribute('open');

      changeRoute();

      expect(disclosure).not.toHaveAttribute('open');
    });
  });

  it('renders the actions slot', () => {
    setup({ actions: <button>Toggle</button> });

    const actionButton = screen.getByRole('button', { name: 'Toggle' });

    expect(actionButton).toBeVisible();
  });

  it('shows no menu button when the menu would be empty', () => {
    setup({ links: [] });

    const toggle = screen.queryByRole('button', { name: TOGGLE_NAME });

    expect(toggle).not.toBeInTheDocument();
  });

  it('keeps the menu button for panel actions alone', () => {
    setup({ links: [], panelActions: <button>Theme</button> });

    const toggle = screen.getByRole('button', { name: TOGGLE_NAME });

    expect(toggle).toBeVisible();
  });

  describe('mobile toggle', () => {
    let toggle: HTMLElement;
    let view: ReturnType<typeof setup>;

    beforeEach(() => {
      view = setup();
      toggle = screen.getByRole('button', { name: TOGGLE_NAME });
    });

    it('opens the panel on toggle click and reflects it via aria-expanded', async () => {
      expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'false');

      await user.click(toggle);

      expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'true');
    });

    describe('once opened', () => {
      beforeEach(async () => {
        await user.click(toggle);
      });

      it('closes on Escape and returns focus to the toggle', async () => {
        await user.keyboard(KEY_ESCAPE);

        expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'false');
        expect(toggle).toHaveFocus();
      });

      it('closes on an outside click', () => {
        fireEvent.mouseDown(document.body);

        expect(toggle).toHaveAttribute(ARIA_EXPANDED, 'false');
      });

      it('closes automatically when the route changes', () => {
        vi.mocked(usePathname).mockReturnValue(MOCK_BLOG_LINK.href);
        view.rerender(
          <SiteNavigation links={links} hasReaderAccounts={true} />,
        );

        const rerenderedToggle = screen.getByRole('button', {
          name: TOGGLE_NAME,
        });

        expect(rerenderedToggle).toHaveAttribute(ARIA_EXPANDED, 'false');
      });
    });
  });
});
