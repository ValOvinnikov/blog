import { Switch } from '@platform/components/shared/switch';
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

  it('describes its switch by the description and the locked reason', () => {
    render(
      <SettingRow
        label="Analytics"
        description="Enable on-site analytics tracking."
        isLocked={true}
        lockedReason="Growth plan"
      >
        <Switch
          isChecked={false}
          onCheckedChange={vi.fn()}
          ariaLabel="Analytics"
          labels={{ on: 'On', off: 'Off' }}
          isDisabled={true}
          aria-describedby="archived-notice"
        />
      </SettingRow>,
    );

    expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute(
      'aria-describedby',
      expect.stringMatching(/^archived-notice \S+ \S+$/),
    );
    expect(
      screen.getByRole('switch', { name: 'Analytics' }),
    ).toHaveAccessibleDescription(
      'Enable on-site analytics tracking. Growth plan',
    );
  });

  it('keeps a locked switch in the accessibility tree as disabled', () => {
    render(
      <SettingRow label="Analytics" isLocked={true} lockedReason="Growth plan">
        <Switch
          isChecked={false}
          onCheckedChange={vi.fn()}
          ariaLabel="Analytics"
          labels={{ on: 'On', off: 'Off' }}
          isDisabled={true}
        />
      </SettingRow>,
    );

    expect(screen.getByRole('switch', { name: 'Analytics' })).toBeDisabled();
  });
});
