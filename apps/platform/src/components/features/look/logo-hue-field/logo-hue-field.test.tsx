import messages from '@platform/i18n/messages/en.json';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { ARCHIVED_NOTICE_ID } from '@platform/testing/render-in-settings-form';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LogoHueField } from './logo-hue-field';

const { followAccentHue: FOLLOW_ACCENT_HUE, logoHueAriaLabel: LOGO_HUE } =
  messages.logoHueField;
const MOCK_ACCENT_HUE = 200;
const MOCK_LOGO_HUE = 90;

const tLogoHue = makeEnTranslator('logoHueField');

const setup = customRender(LogoHueField, {
  accentHue: MOCK_ACCENT_HUE,
  logoHue: undefined,
  onChange: vi.fn(),
});

describe(`<${LogoHueField.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows the follows-accent state with the hue slider disabled when unset', () => {
    setup();

    const followsAccent = screen.getByText(messages.logoHueField.followsAccent);
    const followSwitch = screen.getByRole('switch', {
      name: FOLLOW_ACCENT_HUE,
    });
    const hueSlider = screen.getByRole('slider', { name: LOGO_HUE });

    expect(followsAccent).toBeVisible();
    expect(followSwitch).toBeChecked();
    expect(hueSlider).toBeDisabled();
  });

  it('shows the explicit hue with following switched off once one is set', () => {
    setup({ logoHue: MOCK_LOGO_HUE });

    const hueValue = screen.getByText(
      tLogoHue('hueValue', { hue: MOCK_LOGO_HUE }),
    );
    const followSwitch = screen.getByRole('switch', {
      name: FOLLOW_ACCENT_HUE,
    });

    expect(hueValue).toBeVisible();
    expect(followSwitch).not.toBeChecked();
  });

  it("seeds the explicit hue from the accent's when following is switched off", async () => {
    const onChange = vi.fn();
    setup({ onChange });

    const followSwitch = screen.getByRole('switch', {
      name: FOLLOW_ACCENT_HUE,
    });
    await user.click(followSwitch);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(MOCK_ACCENT_HUE);
    });
  });

  it('clears the explicit hue when following is switched back on', async () => {
    const onChange = vi.fn();
    setup({ logoHue: MOCK_LOGO_HUE, onChange });

    const followSwitch = screen.getByRole('switch', {
      name: FOLLOW_ACCENT_HUE,
    });
    await user.click(followSwitch);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });

  it('disables and describes both controls when disabled, even with a hue set', () => {
    setup({
      logoHue: MOCK_LOGO_HUE,
      isDisabled: true,
      'aria-describedby': ARCHIVED_NOTICE_ID,
    });

    const followSwitch = screen.getByRole('switch', {
      name: FOLLOW_ACCENT_HUE,
    });
    const hueSlider = screen.getByRole('slider', { name: LOGO_HUE });

    expect(followSwitch).toBeDisabled();
    expect(followSwitch).toHaveAttribute(
      'aria-describedby',
      ARCHIVED_NOTICE_ID,
    );
    expect(hueSlider).toBeDisabled();
  });
});
