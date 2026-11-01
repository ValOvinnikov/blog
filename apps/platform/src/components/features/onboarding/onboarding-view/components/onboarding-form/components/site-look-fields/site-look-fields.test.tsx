import { PRESET_ID } from '@blog/config';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { SiteLookFields } from './site-look-fields';

const MOCK_HUE = 28;
const ACCENT_LABEL = 'Accent colour';
const SWATCH_TEST_ID = 'accent-swatch';

const setup = customRender(SiteLookFields, {
  preset: PRESET_ID.EDITORIAL,
  accentHue: MOCK_HUE,
  onPresetChange: vi.fn(),
  onAccentHueChange: vi.fn(),
});

describe(`<${SiteLookFields.name}/>`, () => {
  it('names the hue slider from the visible accent label', () => {
    setup();

    const slider = screen.getByRole('slider', { name: ACCENT_LABEL });

    expect(slider).toHaveAttribute('aria-valuetext', `hue ${MOCK_HUE}°`);
  });

  it('reports the hue the user moves the slider to', async () => {
    const handleAccentHueChange = vi.fn();
    setup({ onAccentHueChange: handleAccentHueChange });

    const slider = screen.getByRole('slider', { name: ACCENT_LABEL });
    await userEvent.click(slider);
    await userEvent.keyboard('{ArrowRight}');

    expect(handleAccentHueChange).toHaveBeenCalledWith(MOCK_HUE + 1);
  });

  it('shows no value text beside the slider', () => {
    setup();

    const valueText = screen.queryByText(`hue ${MOCK_HUE}°`);

    expect(valueText).not.toBeInTheDocument();
  });

  it('colours the swatch for the current hue', () => {
    const { unmount } = setup();
    const before = screen.getByTestId(SWATCH_TEST_ID).getAttribute('style');
    unmount();

    setup({ accentHue: MOCK_HUE + 120 });
    const after = screen.getByTestId(SWATCH_TEST_ID).getAttribute('style');

    expect(after).not.toBe(before);
  });
});
