import { SidebarCollapseProvider } from '@platform/components/features/layout/sidebar-collapse-provider';
import messages from '@platform/i18n/messages/en.json';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { SidebarCollapseToggle } from './sidebar-collapse-toggle';

const { collapseToggle, expandToggle } = messages.sidebar;

const renderToggle = (isInitiallyCollapsed: boolean) =>
  renderWithIntl(
    <SidebarCollapseProvider isInitiallyCollapsed={isInitiallyCollapsed}>
      <SidebarCollapseToggle />
    </SidebarCollapseProvider>,
  );

describe(`<${SidebarCollapseToggle.name}/>`, () => {
  it.each([
    { isInitiallyCollapsed: false, name: collapseToggle, expanded: 'true' },
    { isInitiallyCollapsed: true, name: expandToggle, expanded: 'false' },
  ])(
    'is named for its action when collapsed is $isInitiallyCollapsed',
    ({ isInitiallyCollapsed, name, expanded }) => {
      renderToggle(isInitiallyCollapsed);

      const toggle = screen.getByRole('button', { name });

      expect(toggle).toHaveAttribute('aria-expanded', expanded);
    },
  );

  describe('when the sidebar starts expanded', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
      renderToggle(false);
    });

    it('collapses the sidebar on click', async () => {
      const collapseButton = screen.getByRole('button', {
        name: collapseToggle,
      });

      await user.click(collapseButton);

      const expandButton = screen.getByRole('button', { name: expandToggle });
      expect(expandButton).toBeVisible();
    });

    it('is reachable by keyboard and toggles on Enter', async () => {
      await user.tab();

      const collapseButton = screen.getByRole('button', {
        name: collapseToggle,
      });
      expect(collapseButton).toHaveFocus();

      await user.keyboard('{Enter}');

      const expandButton = screen.getByRole('button', { name: expandToggle });
      expect(expandButton).toBeVisible();
    });
  });
});
