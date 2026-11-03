import { PRESET_ID } from '@blog/config';
import { ACCENT_SWATCH_TEST_ID } from '@platform/constants/accent-swatch';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { SiteLookFields } from './site-look-fields';

const {
  accentLabel: ACCENT_LABEL,
  presetLabel: PRESET_LABEL,
  presetHint: PRESET_HINT,
} = messages.onboardingForm;
const { console: CONSOLE, consoleDescription: CONSOLE_DESCRIPTION } =
  messages.presetPicker;
const MOCK_HUE = 28;

const setup = customRender(SiteLookFields, {
  preset: PRESET_ID.EDITORIAL,
  accentHue: MOCK_HUE,
  onPresetChange: vi.fn(),
  onAccentHueChange: vi.fn(),
});

describe(`<${SiteLookFields.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('names the preset group from its visible legend and describes it with the hint', () => {
      const group = screen.getByRole('radiogroup', { name: PRESET_LABEL });

      expect(group).toHaveAccessibleDescription(PRESET_HINT);
    });

    it('names each preset from its name and describes it with its description', () => {
      const consolePreset = screen.getByRole('radio', { name: CONSOLE });

      expect(consolePreset).toHaveAccessibleDescription(CONSOLE_DESCRIPTION);
    });

    it('names the hue slider from the visible accent label', () => {
      const slider = screen.getByRole('slider', { name: ACCENT_LABEL });

      expect(slider).toHaveAttribute('aria-valuetext', `hue ${MOCK_HUE}°`);
    });

    it('shows no value text beside the slider', () => {
      const valueText = screen.queryByText(`hue ${MOCK_HUE}°`);

      expect(valueText).not.toBeInTheDocument();
    });
  });

  it('reports the hue the user moves the slider to', async () => {
    const handleAccentHueChange = vi.fn();
    setup({ onAccentHueChange: handleAccentHueChange });

    const slider = screen.getByRole('slider', { name: ACCENT_LABEL });
    await userEvent.click(slider);
    await userEvent.keyboard('{ArrowRight}');

    expect(handleAccentHueChange).toHaveBeenCalledWith(MOCK_HUE + 1);
  });

  it('colours the swatch for the current hue', () => {
    const { unmount } = setup();
    const before = screen
      .getByTestId(ACCENT_SWATCH_TEST_ID)
      .getAttribute('style');
    unmount();

    setup({ accentHue: MOCK_HUE + 120 });
    const after = screen
      .getByTestId(ACCENT_SWATCH_TEST_ID)
      .getAttribute('style');

    expect(after).not.toBe(before);
  });
});
