import userEvent, { type UserEvent } from '@testing-library/user-event';
import { customRender, fireEvent, screen } from '@web/testing/custom-render';
import { mockSidebarNavItems } from '@web/testing/shared/sidebar-nav/fixtures';

import { SidebarNav } from './sidebar-nav';

vi.mock('@web/i18n/navigation');

const setup = customRender(SidebarNav, {
  items: mockSidebarNavItems,
  activeKey: '/modules/pricing',
  label: 'In this section',
  ariaCurrent: 'page',
});

const getMobileTrigger = () =>
  screen.getByRole('button', { name: /In this section/ });

describe(`<${SidebarNav.name}/>`, () => {
  describe('with an active item', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
      setup();
    });

    it('renders a single nav landmark named by its label', () => {
      expect(
        screen.getAllByRole('navigation', { name: 'In this section' }),
      ).toHaveLength(1);
    });

    it('labels the desktop list with a real heading that names the nav landmark', () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: 'In this section',
      });
      expect(
        screen.getByRole('navigation', { name: 'In this section' }),
      ).toContainElement(heading);
    });

    it('shows the active item in the mobile selector', () => {
      expect(
        screen.getByRole('button', { name: 'In this section Pricing' }),
      ).toBeVisible();
    });

    it('renders every item as a link to its href in the always-visible desktop list, in order', () => {
      expect(
        screen.getAllByRole('link').map((link) => link.getAttribute('href')),
      ).toEqual(mockSidebarNavItems.map(({ href }) => href));
    });

    it('marks only the item whose href matches activeKey with the given aria-current', () => {
      expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      mockSidebarNavItems
        .filter(({ label }) => label !== 'Pricing')
        .forEach(({ label }) => {
          expect(screen.getByRole('link', { name: label })).not.toHaveAttribute(
            'aria-current',
          );
        });
    });

    it('starts with the mobile disclosure closed and its links hidden', () => {
      expect(getMobileTrigger()).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getAllByRole('link')).toHaveLength(
        mockSidebarNavItems.length,
      );
    });

    it('opens the mobile disclosure on trigger click, exposing its links as plain links', async () => {
      await user.click(getMobileTrigger());

      expect(getMobileTrigger()).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getAllByRole('link')).toHaveLength(
        mockSidebarNavItems.length * 2,
      );
    });

    it('never puts WAI-ARIA menu roles on either copy of the list', async () => {
      await user.click(getMobileTrigger());

      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    });

    it('lets Tab move through the open mobile disclosure and out, without trapping focus', async () => {
      await user.click(getMobileTrigger());

      const lastLinkInPanel = screen
        .getAllByRole('link', { name: mockSidebarNavItems.at(-1)?.label })
        .at(-1);
      lastLinkInPanel?.focus();

      await user.tab();

      expect(lastLinkInPanel).not.toHaveFocus();
      expect(
        screen
          .getAllByRole('link', { name: mockSidebarNavItems.at(0)?.label })
          .at(0),
      ).not.toHaveFocus();
    });

    it('closes the mobile disclosure on Escape', async () => {
      const trigger = getMobileTrigger();

      await user.click(trigger);
      fireEvent.keyDown(document, { key: 'Escape' });

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getAllByRole('link')).toHaveLength(
        mockSidebarNavItems.length,
      );
    });

    it('closes the mobile disclosure on an outside click', async () => {
      const trigger = getMobileTrigger();

      await user.click(trigger);
      fireEvent.mouseDown(document.body);

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(screen.getAllByRole('link')).toHaveLength(
        mockSidebarNavItems.length,
      );
    });

    it('closes the mobile disclosure when one of its links is clicked', async () => {
      const trigger = getMobileTrigger();

      await user.click(trigger);
      const panelLink = screen
        .getAllByRole('link', { name: mockSidebarNavItems.at(0)?.label })
        .at(-1)!;
      await user.click(panelLink);

      expect(trigger).toHaveAttribute('aria-expanded', 'false');
      expect(
        screen.getAllByRole('list', { hidden: true }).at(-1),
      ).not.toBeVisible();
    });
  });

  describe('with location semantics', () => {
    beforeEach(() => {
      setup({ ariaCurrent: 'location' });
    });

    it('marks the active item with aria-current="location"', () => {
      expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute(
        'aria-current',
        'location',
      );
    });
  });

  describe('without a matching active item', () => {
    beforeEach(() => {
      setup({ activeKey: undefined });
    });

    it('marks no item current', () => {
      screen.getAllByRole('link').forEach((link) => {
        expect(link).not.toHaveAttribute('aria-current');
      });
    });
  });
});
