import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { ShellFrame } from './shell-frame';

faker.seed(2402);

const MOCK_SIDEBAR = faker.lorem.words(2);
const MOCK_TOPBAR = faker.lorem.words(3);
const MOCK_PAGE_CONTENT = faker.lorem.sentence();
const MOCK_NOTICE = faker.lorem.sentence();
const SIDEBAR_COLLAPSE_ROOT_TEST_ID = 'sidebar-collapse-root';

const setup = customRender(ShellFrame, {
  sidebar: <p>{MOCK_SIDEBAR}</p>,
  topbar: <p>{MOCK_TOPBAR}</p>,
  children: <p>{MOCK_PAGE_CONTENT}</p>,
});

describe(`<${ShellFrame.name}/>`, () => {
  it('renders the sidebar, topbar and page content together', () => {
    setup();

    const sidebar = screen.getByText(MOCK_SIDEBAR);
    const topbar = screen.getByText(MOCK_TOPBAR);
    const pageContent = screen.getByText(MOCK_PAGE_CONTENT);

    expect(sidebar).toBeVisible();
    expect(topbar).toBeVisible();
    expect(pageContent).toBeVisible();
  });

  it('renders a notice above the page content', () => {
    setup({ notice: <p>{MOCK_NOTICE}</p> });

    const notice = screen.getByText(MOCK_NOTICE);
    const main = screen.getByRole('main');

    expect(notice).toBeVisible();
    expect(main).not.toContainElement(notice);
  });

  it('can open with the sidebar collapsed', () => {
    setup({ isSidebarInitiallyCollapsed: true });

    const collapseRoot = screen.getByTestId(SIDEBAR_COLLAPSE_ROOT_TEST_ID);

    expect(collapseRoot).toHaveAttribute('data-collapsed', 'true');
  });
});
