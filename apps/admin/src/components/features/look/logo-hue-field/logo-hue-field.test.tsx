import { renderWithIntl, screen, waitFor } from '@admin/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { LogoHueField } from './logo-hue-field';

const render = renderWithIntl;

describe(LogoHueField, () => {
  it('shows the follows-accent state, distinct from any explicit hue, when logoHue is unset', () => {
    render(
      <LogoHueField
        accentHue={250}
        logoHue={undefined}
        onChange={vi.fn()}
        isDark={false}
      />,
    );

    expect(screen.getByText('follows accent')).toBeVisible();
    expect(
      screen.getByRole('switch', { name: 'Follow accent hue' }),
    ).toHaveAttribute('data-checked', '');
    expect(screen.getByRole('slider', { name: 'Logo hue' })).toBeDisabled();
  });

  it('shows the explicit hue value, distinguishable from following, once one is set', () => {
    render(
      <LogoHueField
        accentHue={250}
        logoHue={90}
        onChange={vi.fn()}
        isDark={false}
      />,
    );

    expect(screen.getByText('hue 90°')).toBeVisible();
    expect(
      screen.getByRole('switch', { name: 'Follow accent hue' }),
    ).toHaveAttribute('data-unchecked', '');
  });

  it("switching follow off seeds the explicit hue from the accent's current value", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <LogoHueField
        accentHue={200}
        logoHue={undefined}
        onChange={handleChange}
        isDark={false}
      />,
    );

    await user.click(screen.getByRole('switch', { name: 'Follow accent hue' }));

    await waitFor(() => expect(handleChange).toHaveBeenCalledWith(200));
  });

  it('switching follow back on reports undefined', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <LogoHueField
        accentHue={200}
        logoHue={90}
        onChange={handleChange}
        isDark={false}
      />,
    );

    await user.click(screen.getByRole('switch', { name: 'Follow accent hue' }));

    await waitFor(() => expect(handleChange).toHaveBeenCalledWith(undefined));
  });
});
