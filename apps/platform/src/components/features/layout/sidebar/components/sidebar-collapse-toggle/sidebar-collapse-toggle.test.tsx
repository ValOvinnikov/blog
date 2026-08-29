import { SidebarCollapseProvider } from '@platform/components/features/layout/sidebar-collapse-provider';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { SidebarCollapseToggle } from './sidebar-collapse-toggle';

const renderToggle = (isInitiallyCollapsed: boolean) =>
  renderWithIntl(
    <SidebarCollapseProvider isInitiallyCollapsed={isInitiallyCollapsed}>
      <SidebarCollapseToggle />
    </SidebarCollapseProvider>,
  );

describe(SidebarCollapseToggle, () => {
  it('is named and marked expanded when the sidebar starts expanded', () => {
    renderToggle(false);

    const button = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('is named and marked collapsed when the sidebar starts collapsed', () => {
    renderToggle(true);

    const button = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles the shared collapse state on click', async () => {
    const user = userEvent.setup();
    renderToggle(false);

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toBeVisible();
  });

  it('is reachable by keyboard and toggles on Enter', async () => {
    const user = userEvent.setup();
    renderToggle(false);

    await user.tab();
    expect(
      screen.getByRole('button', { name: 'Collapse sidebar' }),
    ).toHaveFocus();

    await user.keyboard('{Enter}');

    expect(
      screen.getByRole('button', { name: 'Expand sidebar' }),
    ).toBeVisible();
  });
});
