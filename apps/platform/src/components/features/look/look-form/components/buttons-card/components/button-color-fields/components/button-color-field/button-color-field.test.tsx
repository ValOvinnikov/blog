import messages from '@platform/i18n/messages/en.json';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import {
  BUTTON_COLOR_FOLLOWS_ACCENT,
  followSwitch,
  hexInputs,
} from '@platform/testing/look/look-button-color';
import {
  MOCK_PINK_HEX,
  MOCK_YELLOW_HEX,
} from '@shinefold/config/testing/button-colors';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ButtonColorField } from './button-color-field';

const MOCK_INPUT_ID = 'button-color';
const MOCK_UNLOCKED = {
  isDisabled: false,
  isLocked: false,
  aria: { labelledBy: undefined, describedBy: undefined },
  labelId: 'label',
  growthBadgeId: undefined,
};
const MOCK_LOCKED = { ...MOCK_UNLOCKED, isLocked: true };

const onChange = vi.fn();

const setup = customRender(ButtonColorField, {
  color: undefined,
  seedColor: MOCK_YELLOW_HEX,
  onChange,
  followLabel: BUTTON_COLOR_FOLLOWS_ACCENT,
  inputId: MOCK_INPUT_ID,
  isInvalid: false,
  lock: MOCK_UNLOCKED,
});

describe(`<${ButtonColorField.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    onChange.mockReset();
  });

  it('seeds the colour when following is switched off', async () => {
    setup();
    const switchControl = followSwitch(BUTTON_COLOR_FOLLOWS_ACCENT);

    await user.click(switchControl);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(MOCK_YELLOW_HEX);
    });
  });

  describe('with a colour picked', () => {
    it('clears the colour when following is switched back on', async () => {
      setup({ color: MOCK_PINK_HEX });
      const switchControl = followSwitch(BUTTON_COLOR_FOLLOWS_ACCENT);

      await user.click(switchControl);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(undefined);
      });
    });

    it('disables both controls while disabled', () => {
      setup({
        color: MOCK_PINK_HEX,
        lock: { ...MOCK_UNLOCKED, isDisabled: true },
      });

      const switchControl = followSwitch(BUTTON_COLOR_FOLLOWS_ACCENT);
      const [hexInput] = hexInputs();

      expect(switchControl).toBeDisabled();
      expect(hexInput).toBeDisabled();
    });

    it('keeps the locked picker and hex field focusable but unchangeable', async () => {
      setup({ color: MOCK_PINK_HEX, lock: MOCK_LOCKED });
      const picker = screen.getByLabelText(
        messages.buttonColorField.pickerAriaLabel,
      );
      const [hexInput] = hexInputs();

      await user.type(hexInput!, MOCK_YELLOW_HEX);

      expect(picker).toBeEnabled();
      expect(picker).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(hexInput).toBeEnabled();
      expect(hexInput).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
