import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { HueSlider } from './hue-slider';

describe(HueSlider, () => {
  it('exposes the given aria-label on the slider thumb', () => {
    render(<HueSlider ariaLabel="Accent hue" value={100} onChange={vi.fn()} />);

    expect(screen.getByRole('slider', { name: 'Accent hue' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
  });

  it('reports an incremented value when the focused thumb receives ArrowRight', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <HueSlider ariaLabel="Accent hue" value={100} onChange={handleChange} />,
    );

    screen.getByRole('slider', { name: 'Accent hue' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(handleChange).toHaveBeenCalledWith(101);
  });

  it('marks the slider disabled when disabled is passed', () => {
    render(
      <HueSlider
        ariaLabel="Logo hue"
        value={50}
        onChange={vi.fn()}
        disabled={true}
      />,
    );

    expect(screen.getByRole('slider', { name: 'Logo hue' })).toBeDisabled();
  });
});
