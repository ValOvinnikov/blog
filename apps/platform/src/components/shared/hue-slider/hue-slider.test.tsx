import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { HueSlider } from './hue-slider';

const ACCENT_HUE = 'Accent hue';

describe(HueSlider, () => {
  it('exposes the given aria-label on the slider thumb', () => {
    render(<HueSlider ariaLabel={ACCENT_HUE} value={100} onChange={vi.fn()} />);

    expect(screen.getByRole('slider', { name: ACCENT_HUE })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
  });

  it('reports an incremented value when the focused thumb receives ArrowRight', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <HueSlider ariaLabel={ACCENT_HUE} value={100} onChange={handleChange} />,
    );

    await user.click(screen.getByRole('slider', { name: ACCENT_HUE }));
    await user.keyboard('{ArrowRight}');

    expect(handleChange).toHaveBeenCalledWith(101);
  });

  it('marks the slider disabled when isDisabled is passed', () => {
    render(
      <HueSlider
        ariaLabel="Logo hue"
        value={50}
        onChange={vi.fn()}
        isDisabled={true}
      />,
    );

    expect(screen.getByRole('slider', { name: 'Logo hue' })).toBeDisabled();
  });

  it('forwards aria-describedby to the slider', () => {
    render(
      <HueSlider
        ariaLabel="Logo hue"
        value={50}
        onChange={vi.fn()}
        isDisabled={true}
        aria-describedby="archived-notice"
      />,
    );

    expect(screen.getByRole('slider', { name: 'Logo hue' })).toHaveAttribute(
      'aria-describedby',
      'archived-notice',
    );
  });
});
