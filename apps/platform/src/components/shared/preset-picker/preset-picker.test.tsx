import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import { ARCHIVED_NOTICE_ID } from '@platform/testing/render-in-settings-form';
import { PRESET_ID } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { PresetPicker } from './preset-picker';

const {
  ariaLabel: PRESET_GROUP,
  console: CONSOLE,
  editorial: EDITORIAL,
  editorialDescription: EDITORIAL_DESCRIPTION,
} = messages.presetPicker;

const onChange = vi.fn();

const setup = customRender(PresetPicker, {
  value: PRESET_ID.EDITORIAL,
  onChange,
  aria: { label: PRESET_GROUP },
});

describe(`<${PresetPicker.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the editorial preset selected', () => {
    beforeEach(() => {
      setup();
    });

    it.each([
      [EDITORIAL, 'true'],
      [CONSOLE, 'false'],
    ])('marks %s checked: %s', (name, checked) => {
      const preset = screen.getByRole('radio', { name });

      expect(preset).toHaveAttribute(ARIA_ATTRIBUTE.CHECKED, checked);
    });

    it('describes each preset with its description', () => {
      const editorial = screen.getByRole('radio', { name: EDITORIAL });

      expect(editorial).toHaveAccessibleDescription(EDITORIAL_DESCRIPTION);
    });
  });

  describe('with the console preset selected', () => {
    beforeEach(() => {
      setup({ value: PRESET_ID.CONSOLE });
    });

    it('reports the newly picked preset on click', async () => {
      const editorial = screen.getByRole('radio', { name: EDITORIAL });
      await user.click(editorial);

      expect(onChange).toHaveBeenCalledWith(PRESET_ID.EDITORIAL);
    });

    it('reports the preset the user arrows to', async () => {
      await user.tab();
      await user.keyboard(USER_EVENT_KEY.ARROW_RIGHT);

      expect(onChange).toHaveBeenCalledWith(PRESET_ID.EDITORIAL);
    });
  });

  describe('when disabled', () => {
    let editorial: HTMLElement;

    beforeEach(() => {
      setup({
        value: PRESET_ID.CONSOLE,
        isDisabled: true,
        aria: { label: PRESET_GROUP, describedBy: ARCHIVED_NOTICE_ID },
      });
      editorial = screen.getByRole('radio', { name: EDITORIAL });
    });

    it('disables every option', () => {
      expect(editorial).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
    });

    it('points the group at the reason it is disabled', () => {
      const group = screen.getByRole('radiogroup', { name: PRESET_GROUP });

      expect(group).toHaveAttribute(
        ARIA_ATTRIBUTE.DESCRIBEDBY,
        ARCHIVED_NOTICE_ID,
      );
    });

    it('stops reporting clicks', async () => {
      await user.click(editorial);

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
