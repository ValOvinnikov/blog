import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  SidebarCollapseProvider,
  useSidebarCollapse,
} from './sidebar-collapse-provider';

const Probe = () => {
  const { isCollapsed, toggle } = useSidebarCollapse();
  return (
    <button type="button" onClick={toggle}>
      {isCollapsed ? 'collapsed' : 'expanded'}
    </button>
  );
};

describe(SidebarCollapseProvider, () => {
  afterEach(() => {
    document.cookie =
      'admin-sidebar-collapsed=; max-age=0; path=/; SameSite=Lax';
  });

  it('throws when read outside a provider', () => {
    expect(() => renderHook(() => useSidebarCollapse())).toThrow(
      'useSidebarCollapse must be used within a SidebarCollapseProvider',
    );
  });

  it('seeds state from isInitiallyCollapsed and carries it as data-collapsed on the wrapping element', () => {
    renderWithIntl(
      <SidebarCollapseProvider isInitiallyCollapsed={true}>
        <Probe />
      </SidebarCollapseProvider>,
    );

    expect(screen.getByText('collapsed')).toBeVisible();
    expect(
      screen.getByText('collapsed').closest('[data-collapsed]'),
    ).toHaveAttribute('data-collapsed', 'true');
  });

  it('omits data-collapsed once expanded', () => {
    renderWithIntl(
      <SidebarCollapseProvider isInitiallyCollapsed={false}>
        <Probe />
      </SidebarCollapseProvider>,
    );

    expect(
      screen.getByText('expanded').closest('.group\\/shell'),
    ).not.toHaveAttribute('data-collapsed');
  });

  it('flips state and persists the new value to the sidebar-collapsed cookie on toggle', async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <SidebarCollapseProvider isInitiallyCollapsed={false}>
        <Probe />
      </SidebarCollapseProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'expanded' }));

    expect(screen.getByText('collapsed')).toBeVisible();
    expect(document.cookie).toContain('admin-sidebar-collapsed=true');

    await user.click(screen.getByRole('button', { name: 'collapsed' }));

    expect(screen.getByText('expanded')).toBeVisible();
    expect(document.cookie).toContain('admin-sidebar-collapsed=false');
  });
});
