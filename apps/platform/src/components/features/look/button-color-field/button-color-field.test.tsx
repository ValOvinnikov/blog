import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { BUTTON_COLOR_FOLLOWS_ACCENT } from '@platform/testing/look/look-button-color';
import {
  MOCK_PINK_HEX,
  MOCK_YELLOW_HEX,
} from '@shinefold/config/testing/button-colors';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ButtonColorField } from './button-color-field';

const MOCK_INPUT_ID = 'button-color';
const UNLOCKED = {
  isDisabled: false,
  isLocked: false,
  aria: { labelledBy: undefined, describedBy: undefined },
  labelId: 'label',
  growthBadgeId: undefined,
};

const onChange = vi.fn();

const setup = customRender(ButtonColorField, {
  color: undefined,
  seedColor: MOCK_YELLOW_HEX,
  onChange,
  followLabel: BUTTON_COLOR_FOLLOWS_ACCENT,
  inputId: MOCK_INPUT_ID,
  isInvalid: false,
  lock: UNLOCKED,
});

const followSwitch = () =>
  screen.getByRole('switch', { name: BUTTON_COLOR_FOLLOWS_ACCENT });

describe(`<${ButtonColorField.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    onChange.mockReset();
  });

  it('seeds the colour when following is switched off', async () => {
    setup();
    const switchControl = followSwitch();

    await user.click(switchControl);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(MOCK_YELLOW_HEX);
    });
  });

  describe('with a colour picked', () => {
    it('clears the colour when following is switched back on', async () => {
      setup({ color: MOCK_PINK_HEX });
      const switchControl = followSwitch();

      await user.click(switchControl);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(undefined);
      });
    });

    it('disables both controls while disabled', () => {
      setup({ color: MOCK_PINK_HEX, lock: { ...UNLOCKED, isDisabled: true } });

      const switchControl = followSwitch();
      const hexInput = screen.getByRole('textbox');

      expect(switchControl).toBeDisabled();
      expect(hexInput).toBeDisabled();
    });
  });
});
