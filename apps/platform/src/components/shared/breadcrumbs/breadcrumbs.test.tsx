import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import {
  ARIA_CURRENT,
  ARIA_EXPANDED,
  ARIA_HASPOPUP,
} from '@platform/testing/aria';
import {
  customRender,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { Breadcrumbs } from './breadcrumbs';

vi.mock('@platform/i18n/navigation');

faker.seed(5995);

const MOCK_ARIA_LABEL = faker.lorem.word();
const MOCK_PLATFORM = faker.lorem.words(2);
const MOCK_TENANTS = faker.lorem.words(3);
const MOCK_YOUR_SITE = faker.lorem.words(2);
const MOCK_LOOK = faker.lorem.words(4);
const MOCK_OVERFLOW_WIDTH = faker.number.int({ min: 300, max: 900 });
const MOCK_DANGER_ZONE = faker.lorem.words(2);
const MOCK_TENANT_PAGE_TRAIL = [
  { label: MOCK_PLATFORM },
  { label: MOCK_TENANTS, href: adminRoutes.tenants() },
  {
    label: MOCK_TENANT_NAME,
    href: adminRoutes.dashboard(),
    isShrinkable: true,
  },
  { label: MOCK_DANGER_ZONE },
];

const { showFullPath, fullPathMenuLabel } = messages.topbar;

const setup = customRender(Breadcrumbs, {
  ariaLabel: MOCK_ARIA_LABEL,
  items: [{ label: MOCK_PLATFORM }],
});

describe(`<${Breadcrumbs.name}/>`, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders every ancestor with an href as a real link', () => {
    setup({
      items: [
        { label: MOCK_PLATFORM },
        { label: MOCK_TENANTS, href: adminRoutes.tenants() },
        { label: MOCK_TENANT_NAME },
      ],
    });

    const tenantsLink = screen.getByRole('link', { name: MOCK_TENANTS });

    expect(tenantsLink).toHaveAttribute('href', adminRoutes.tenants());
  });

  it('renders the last item as the current, non-clickable label even with an href', () => {
    setup({
      items: [
        { label: MOCK_YOUR_SITE, href: adminRoutes.dashboard() },
        { label: MOCK_LOOK, href: adminRoutes.dashboardLook() },
      ],
    });

    const yourSiteLink = screen.getByRole('link', { name: MOCK_YOUR_SITE });
    const lookLink = screen.queryByRole('link', { name: MOCK_LOOK });
    const current = screen.getByText(MOCK_LOOK);

    expect(yourSiteLink).toHaveAttribute('href', adminRoutes.dashboard());
    expect(lookLink).not.toBeInTheDocument();
    expect(current).toHaveAttribute(ARIA_CURRENT, 'page');
  });

  it('renders an ancestor with no href as a non-clickable label, not a link', () => {
    setup({ items: [{ label: MOCK_PLATFORM }, { label: MOCK_TENANTS }] });

    const platformLink = screen.queryByRole('link', { name: MOCK_PLATFORM });
    const platformText = screen.getByText(MOCK_PLATFORM);

    expect(platformLink).not.toBeInTheDocument();
    expect(platformText).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('titles a shrinkable link with its full label', () => {
    setup({
      items: [
        { label: MOCK_TENANTS, href: adminRoutes.tenants() },
        {
          label: MOCK_TENANT_NAME,
          href: adminRoutes.dashboard(),
          isShrinkable: true,
        },
        { label: MOCK_LOOK },
      ],
    });

    const tenantsLink = screen.getByRole('link', { name: MOCK_TENANTS });
    const tenantLink = screen.getByRole('link', { name: MOCK_TENANT_NAME });

    expect(tenantsLink).not.toHaveAttribute('title');
    expect(tenantLink).toHaveAttribute('title', MOCK_TENANT_NAME);
  });

  it('titles a shrinkable current crumb with its full label', () => {
    setup({
      items: [
        { label: MOCK_TENANTS, href: adminRoutes.tenants() },
        { label: MOCK_TENANT_NAME, isShrinkable: true },
      ],
    });

    const current = screen.getByText(MOCK_TENANT_NAME);

    expect(current).toHaveAttribute('title', MOCK_TENANT_NAME);
  });

  it('leaves a current crumb that fits untitled', () => {
    setup({ items: [{ label: MOCK_PLATFORM }, { label: MOCK_LOOK }] });

    const current = screen.getByText(MOCK_LOOK);

    expect(current).not.toHaveAttribute('title');
  });

  it('titles a current crumb cut off at its cap', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(
      MOCK_OVERFLOW_WIDTH,
    );
    setup({ items: [{ label: MOCK_PLATFORM }, { label: MOCK_LOOK }] });

    const current = screen.getByText(MOCK_LOOK);

    expect(current).toHaveAttribute('title', MOCK_LOOK);
  });

  it('renders a nav landmark labelled with the given label', () => {
    setup();

    const nav = screen.getByRole('navigation', { name: MOCK_ARIA_LABEL });

    expect(nav).toBeVisible();
  });

  describe('on a trail whose hidden crumbs include a link', () => {
    let trigger: HTMLElement;

    beforeEach(() => {
      setup({ items: MOCK_TENANT_PAGE_TRAIL });
      trigger = screen.getByRole('button', { name: showFullPath });
    });

    it('offers a collapsed menu button for the full path', () => {
      expect(trigger).toHaveAttribute(ARIA_HASPOPUP, 'menu');
      expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    describe('once opened', () => {
      let user: UserEvent;
      let menu: HTMLElement;
      let tenantsItem: HTMLElement;

      beforeEach(async () => {
        user = userEvent.setup();
        await user.click(trigger);
        menu = await screen.findByRole('menu', { name: fullPathMenuLabel });
        tenantsItem = within(menu).getByRole('menuitem', {
          name: MOCK_TENANTS,
        });
      });

      it('lists the page-less crumb as a group label over its links', () => {
        const group = within(menu).getByRole('group', { name: MOCK_PLATFORM });
        const groupItems = within(group).getAllByRole('menuitem');
        const items = within(menu).getAllByRole('menuitem');

        expect(items).toEqual([tenantsItem]);
        expect(groupItems).toEqual([tenantsItem]);
        expect(tenantsItem).toHaveAttribute('href', adminRoutes.tenants());
      });

      it('moves focus to the first link', async () => {
        await waitFor(() => {
          expect(tenantsItem).toHaveFocus();
        });
      });

      it('returns focus to the button on Escape', async () => {
        await user.keyboard('{Escape}');

        await waitFor(() => {
          expect(trigger).toHaveFocus();
        });
      });
    });
  });

  it.each([
    ['one crumb', [{ label: MOCK_PLATFORM }]],
    [
      'two crumbs',
      [
        { label: MOCK_TENANTS, href: adminRoutes.tenants() },
        { label: MOCK_LOOK },
      ],
    ],
    [
      'three crumbs hiding only a label',
      [
        { label: MOCK_PLATFORM },
        { label: MOCK_TENANTS, href: adminRoutes.tenants() },
        { label: MOCK_LOOK },
      ],
    ],
  ])('renders %s in full with no menu button', (_, items) => {
    setup({ items });

    const trigger = screen.queryByRole('button', { name: showFullPath });

    expect(trigger).not.toBeInTheDocument();
  });
});
