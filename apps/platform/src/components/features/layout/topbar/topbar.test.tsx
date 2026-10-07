import { ICONS } from '@blog/config';
import {
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { Topbar } from './topbar';

vi.mock('@platform/i18n/navigation');

const render = renderWithIntl;

const roleChip = { name: 'Jane Doe', role: 'ADMIN', scope: 'Platform' };

describe(Topbar, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders the given crumb node and the role chip', () => {
    render(<Topbar crumb={<p>Platform</p>} roleChip={roleChip} />);

    expect(screen.getByText('Platform')).toBeVisible();
    expect(screen.getByText('ADMIN')).toBeVisible();
    expect(screen.getByText('· Platform')).toBeVisible();
  });

  it('renders no nav menu trigger when no sections are passed', () => {
    render(<Topbar crumb={<p>Platform</p>} roleChip={roleChip} />);

    expect(
      screen.queryByRole('button', { name: 'Menu' }),
    ).not.toBeInTheDocument();
  });

  it('renders a nav menu trigger that opens the passed sections', async () => {
    render(
      <Topbar
        crumb={<p>Platform</p>}
        roleChip={roleChip}
        sections={[
          {
            label: 'Platform',
            items: [{ label: 'Tenants', icon: ICONS.GRID, href: '/tenants' }],
          },
        ]}
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Menu' });
    expect(trigger).toBeVisible();

    await user.click(trigger);
    const menu = await screen.findByRole('menu');
    expect(
      within(menu).getByRole('menuitem', { name: 'Tenants' }),
    ).toBeVisible();
  });

  it('renders the switcher slot above the section items inside the opened nav menu', async () => {
    render(
      <Topbar
        crumb={<p>Platform</p>}
        roleChip={roleChip}
        switcher={<div>Tenant switcher</div>}
        sections={[
          {
            label: 'Platform',
            items: [{ label: 'Tenants', icon: ICONS.GRID, href: '/tenants' }],
          },
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    const menu = await screen.findByRole('menu');
    const text = menu.textContent ?? '';

    expect(within(menu).getByText('Tenant switcher')).toBeVisible();
    expect(text.indexOf('Tenant switcher')).toBeLessThan(
      text.indexOf('Platform'),
    );
  });
});
