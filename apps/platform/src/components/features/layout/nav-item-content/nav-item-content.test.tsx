import { ICONS } from '@blog/config';
import { render, screen } from '@platform/testing/custom-render';

import { NavItemContent } from './nav-item-content';

describe(`<${NavItemContent.name}/>`, () => {
  it('renders the icon and label', () => {
    render(<NavItemContent icon={ICONS.GRID} label="Tenants" />);

    expect(screen.getByText('Tenants')).toBeVisible();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders a disabled reason only when given one', () => {
    const { rerender } = render(
      <NavItemContent icon={ICONS.GRID} label="Domain" />,
    );
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();

    rerender(
      <NavItemContent
        icon={ICONS.GRID}
        label="Domain"
        disabledReason="Coming soon"
      />,
    );
    expect(screen.getByText('Coming soon')).toBeVisible();
  });

  it('renders no badge when none is given', () => {
    render(<NavItemContent icon={ICONS.GRID} label="Tenants" />);
    expect(screen.queryByTestId('status-badge-dot')).not.toBeInTheDocument();
  });

  it('renders the badge label and tone dot by default', () => {
    render(
      <NavItemContent
        icon={ICONS.GRID}
        label="Tenants"
        badge={{ label: 'this milestone', tone: 'neutral' }}
      />,
    );

    expect(screen.getByText('this milestone')).toBeVisible();
    expect(screen.getByTestId('status-badge-dot')).toBeInTheDocument();
  });

  it('omits the tone dot when the badge sets hasDot to false', () => {
    render(
      <NavItemContent
        icon={ICONS.GRID}
        label="Platform"
        badge={{ label: 'platform', tone: 'neutral', hasDot: false }}
      />,
    );

    expect(screen.getByText('platform')).toBeVisible();
    expect(screen.queryByTestId('status-badge-dot')).not.toBeInTheDocument();
  });
});
