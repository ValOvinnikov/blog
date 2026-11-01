import { faker } from '@faker-js/faker';
import { ARIA_CURRENT } from '@platform/testing/aria';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { Breadcrumbs } from './breadcrumbs';

vi.mock('@platform/i18n/navigation');

faker.seed(5995);

const MOCK_ARIA_LABEL = faker.lorem.word();
const MOCK_PLATFORM = faker.lorem.words(2);
const MOCK_TENANTS = faker.lorem.words(3);
const MOCK_YOUR_SITE = faker.lorem.words(2);
const MOCK_LOOK = faker.lorem.words(4);
const MOCK_OVERFLOW_WIDTH = faker.number.int({ min: 300, max: 900 });

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
});
