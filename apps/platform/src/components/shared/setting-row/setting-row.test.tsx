import { render, screen } from '@platform/testing/custom-render';

import { SettingRow } from './setting-row';

describe(SettingRow, () => {
  it('renders the label and description', () => {
    render(
      <SettingRow
        label="Terminal chrome"
        description="Window frame + terminal prompt around the site."
      >
        <button type="button">Toggle</button>
      </SettingRow>,
    );

    expect(screen.getByText('Terminal chrome')).toBeVisible();
    expect(
      screen.getByText('Window frame + terminal prompt around the site.'),
    ).toBeVisible();
  });

  it('renders without a description', () => {
    render(
      <SettingRow label="Terminal chrome">
        <button type="button">Toggle</button>
      </SettingRow>,
    );

    expect(screen.getByText('Terminal chrome')).toBeVisible();
  });

  it("renders the control slot's content", () => {
    render(
      <SettingRow label="Plan">
        <select aria-label="Plan">
          <option>Starter</option>
        </select>
      </SettingRow>,
    );

    expect(screen.getByRole('combobox', { name: 'Plan' })).toBeVisible();
  });

  it('shows the locked reason when locked', () => {
    render(
      <SettingRow
        label="Custom domains"
        isLocked={true}
        lockedReason="Available on the Growth plan."
      >
        <button type="button">Upgrade</button>
      </SettingRow>,
    );

    expect(screen.getByText('Available on the Growth plan.')).toBeVisible();
  });

  it('omits the locked reason when not locked, even if one is passed', () => {
    render(
      <SettingRow
        label="Custom domains"
        lockedReason="Available on the Growth plan."
      >
        <button type="button">Upgrade</button>
      </SettingRow>,
    );

    expect(
      screen.queryByText('Available on the Growth plan.'),
    ).not.toBeInTheDocument();
  });

  it('omits the reason row when locked but no reason is given', () => {
    render(
      <SettingRow label="Custom domains" isLocked={true}>
        <button type="button">Upgrade</button>
      </SettingRow>,
    );

    expect(screen.queryByText('🔒')).not.toBeInTheDocument();
  });

  it('honours the locked state by making the control slot inert', () => {
    render(
      <SettingRow label="Custom domains" isLocked={true} lockedReason="Locked">
        <button type="button">Upgrade</button>
      </SettingRow>,
    );

    const button = screen.getByRole('button', { name: 'Upgrade' });
    const wrapper = button.closest('div');

    expect(wrapper?.getAttribute('inert')).toBe('');
  });

  it('does not mark the control slot inert when not locked', () => {
    render(
      <SettingRow label="Custom domains">
        <button type="button">Upgrade</button>
      </SettingRow>,
    );

    const button = screen.getByRole('button', { name: 'Upgrade' });
    const wrapper = button.closest('div');

    expect(wrapper?.hasAttribute('inert')).toBe(false);
  });
});
