import {
  renderHook,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import { SIDEBAR_COLLAPSED_COOKIE } from '@platform/utils/sidebar-collapsed-cookie/sidebar-collapsed-cookie';
import userEvent from '@testing-library/user-event';

import {
  SidebarCollapseProvider,
  useSidebarCollapse,
} from './sidebar-collapse-provider';

const PROBE_COLLAPSED_TEXT = 'collapsed';
const PROBE_EXPANDED_TEXT = 'expanded';
const SIDEBAR_COLLAPSE_ROOT_TEST_ID = 'sidebar-collapse-root';
const DATA_COLLAPSED = 'data-collapsed';

const Probe = () => {
  const { isCollapsed, toggle } = useSidebarCollapse();
  return (
    <button type="button" onClick={toggle}>
      {isCollapsed ? PROBE_COLLAPSED_TEXT : PROBE_EXPANDED_TEXT}
    </button>
  );
};

const renderProvider = (isInitiallyCollapsed: boolean) =>
  renderWithIntl(
    <SidebarCollapseProvider isInitiallyCollapsed={isInitiallyCollapsed}>
      <Probe />
    </SidebarCollapseProvider>,
  );

describe(`<${SidebarCollapseProvider.name}/>`, () => {
  afterEach(() => {
    document.cookie = `${SIDEBAR_COLLAPSED_COOKIE}=; max-age=0; path=/; SameSite=Lax`;
  });

  it('throws when read outside a provider', () => {
    expect(() => renderHook(() => useSidebarCollapse())).toThrow(
      'useSidebarCollapse must be used within a SidebarCollapseProvider',
    );
  });

  it('starts collapsed and marks its root when seeded collapsed', () => {
    renderProvider(true);

    const probe = screen.getByRole('button', { name: PROBE_COLLAPSED_TEXT });
    const root = screen.getByTestId(SIDEBAR_COLLAPSE_ROOT_TEST_ID);

    expect(probe).toBeVisible();
    expect(root).toHaveAttribute(DATA_COLLAPSED, 'true');
  });

  it('leaves its root unmarked when seeded expanded', () => {
    renderProvider(false);

    const root = screen.getByTestId(SIDEBAR_COLLAPSE_ROOT_TEST_ID);

    expect(root).not.toHaveAttribute(DATA_COLLAPSED);
  });

  it.each([
    {
      isInitiallyCollapsed: false,
      from: PROBE_EXPANDED_TEXT,
      to: PROBE_COLLAPSED_TEXT,
      isCollapsedAfter: true,
    },
    {
      isInitiallyCollapsed: true,
      from: PROBE_COLLAPSED_TEXT,
      to: PROBE_EXPANDED_TEXT,
      isCollapsedAfter: false,
    },
  ])(
    'flips from $from to $to on toggle and persists it to the cookie',
    async ({ isInitiallyCollapsed, from, to, isCollapsedAfter }) => {
      const user = userEvent.setup();
      renderProvider(isInitiallyCollapsed);

      const probe = screen.getByRole('button', { name: from });
      await user.click(probe);

      const flippedProbe = screen.getByRole('button', { name: to });
      expect(flippedProbe).toBeVisible();
      expect(document.cookie).toBe(
        `${SIDEBAR_COLLAPSED_COOKIE}=${isCollapsedAfter}`,
      );
    },
  );
});
