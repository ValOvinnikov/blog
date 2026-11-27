import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { ARCHIVED_NOTICE_ID } from '@platform/testing/render-in-settings-form';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { LogoHueField, type TLogoHueFieldProps } from './logo-hue-field';

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
  let onChange: Mock<TLogoHueFieldProps['onChange']>;

  beforeEach(() => {
    user = userEvent.setup();
    onChange = vi.fn();
  });

  it('shows only the switch, on, while the logo follows the accent', () => {
    setup();

    const followSwitch = screen.getByRole('switch', {
      name: FOLLOW_ACCENT_HUE,
    });
    const hueSlider = screen.queryByRole('slider', { name: LOGO_HUE });

    expect(followSwitch).toBeChecked();
    expect(hueSlider).not.toBeInTheDocument();
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
    setup({ logoHue: MOCK_LOGO_HUE, onChange });

    const followSwitch = screen.getByRole('switch', {
      name: FOLLOW_ACCENT_HUE,
    });
    await user.click(followSwitch);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(undefined);
    });
  });

  it('keeps both controls focusable and unchangeable when locked, with a hue set', async () => {
    setup({
      logoHue: MOCK_LOGO_HUE,
      onChange,
      isLocked: true,
      [ARIA_ATTRIBUTE.DESCRIBEDBY]: ARCHIVED_NOTICE_ID,
    });

    const followSwitch = screen.getByRole('switch', {
      name: FOLLOW_ACCENT_HUE,
    });
    const hueSlider = screen.getByRole('slider', { name: LOGO_HUE });
    await user.click(followSwitch);

    expect(followSwitch).toBeEnabled();
    expect(followSwitch).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
    expect(followSwitch).toHaveAttribute(
      ARIA_ATTRIBUTE.DESCRIBEDBY,
      ARCHIVED_NOTICE_ID,
    );
    expect(hueSlider).toBeEnabled();
    expect(hueSlider).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
    expect(onChange).not.toHaveBeenCalled();
  });
});
