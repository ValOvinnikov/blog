import { SidebarCollapseProvider } from '@platform/components/features/layout/sidebar-collapse-provider';
import { SIDEBAR_ID } from '@platform/constants/sidebar';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_HIDDEN } from '@platform/testing/aria';
import {
  renderWithIntl,
  screen,
  waitFor,
} from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { SidebarCollapseToggle } from './sidebar-collapse-toggle';

const { ariaLabel, collapseToggle, expandToggle } = messages.sidebar;

const renderToggle = (isInitiallyCollapsed: boolean) =>
  renderWithIntl(
    <SidebarCollapseProvider isInitiallyCollapsed={isInitiallyCollapsed}>
      <aside id={SIDEBAR_ID} aria-label={ariaLabel} />
      <SidebarCollapseToggle />
    </SidebarCollapseProvider>,
  );

describe(`<${SidebarCollapseToggle.name}/>`, () => {
  it.each([
    { isInitiallyCollapsed: false, name: collapseToggle, expanded: 'true' },
    { isInitiallyCollapsed: true, name: expandToggle, expanded: 'false' },
  ])(
    'is named for its action and controls the sidebar when collapsed is $isInitiallyCollapsed',
    ({ isInitiallyCollapsed, name, expanded }) => {
      renderToggle(isInitiallyCollapsed);

      const toggle = screen.getByRole('button', { name });
      const sidebar = screen.getByRole('complementary', { name: ariaLabel });

      expect(toggle).toHaveAttribute('aria-expanded', expanded);
      expect(toggle).toHaveAttribute('aria-controls', sidebar.id);
      expect(toggle).not.toHaveAttribute('title');
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

    describe('once it takes keyboard focus', () => {
      beforeEach(async () => {
        await user.tab();
      });

      it('shows its name in a hidden-from-assistive-tech tooltip at once', () => {
        const toggle = screen.getByRole('button', { name: collapseToggle });
        const tooltip = screen.getByText(collapseToggle);

        expect(toggle).toHaveFocus();
        expect(tooltip).toHaveAttribute(ARIA_HIDDEN, 'true');
        expect(toggle).not.toHaveAccessibleDescription();
      });

      it('toggles on Enter and closes the tooltip', async () => {
        await user.keyboard('{Enter}');

        const expandButton = screen.getByRole('button', { name: expandToggle });
        expect(expandButton).toHaveFocus();
        await waitFor(() => {
          const staleTooltip = screen.queryByText(collapseToggle);

          expect(staleTooltip).not.toBeInTheDocument();
        });
      });

      it('hides the tooltip on Escape', async () => {
        await user.keyboard('{Escape}');

        await waitFor(() => {
          const tooltip = screen.queryByText(collapseToggle);

          expect(tooltip).not.toBeInTheDocument();
        });
      });
    });
  });
});
