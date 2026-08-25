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

  it('applies the given trackStyle gradient to the track element', () => {
    render(
      <HueSlider
        ariaLabel="Accent hue"
        value={100}
        onChange={vi.fn()}
        trackStyle={{ background: 'linear-gradient(90deg, red, blue)' }}
      />,
    );

    // The accessible "slider" role lands on Base UI's native <input>, nested
    // inside the Thumb; its grandparent is the Track.
    const thumb = screen.getByRole('slider', { name: 'Accent hue' })
      .parentElement as HTMLElement;
    const track = thumb.parentElement;
    expect(track).toHaveStyle({
      background: 'linear-gradient(90deg, red, blue)',
    });
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
});
