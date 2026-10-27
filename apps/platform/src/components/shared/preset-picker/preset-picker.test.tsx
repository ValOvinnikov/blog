import { PRESET_ID } from '@blog/config';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen } from '@platform/testing/custom-render';
import { ARCHIVED_NOTICE_ID } from '@platform/testing/render-in-settings-form';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { PresetPicker } from './preset-picker';

const {
  ariaLabel: PRESET_GROUP,
  console: CONSOLE,
  editorial: EDITORIAL,
  editorialDescription: EDITORIAL_DESCRIPTION,
} = messages.presetPicker;

const setup = customRender(PresetPicker, {
  value: PRESET_ID.EDITORIAL,
  onChange: vi.fn(),
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

      expect(preset).toHaveAttribute('aria-checked', checked);
    });

    it('describes each preset with its description', () => {
      const editorial = screen.getByRole('radio', { name: EDITORIAL });

      expect(editorial).toHaveAccessibleDescription(EDITORIAL_DESCRIPTION);
    });
  });

  it('reports the newly picked preset on click', async () => {
    const handleChange = vi.fn();
    setup({ value: PRESET_ID.CONSOLE, onChange: handleChange });

    const editorial = screen.getByRole('radio', { name: EDITORIAL });
    await user.click(editorial);

    expect(handleChange).toHaveBeenCalledWith(PRESET_ID.EDITORIAL);
  });

  describe('when disabled', () => {
    let handleChange: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      handleChange = vi.fn();
      setup({
        value: PRESET_ID.CONSOLE,
        onChange: handleChange,
        isDisabled: true,
        'aria-describedby': ARCHIVED_NOTICE_ID,
      });
    });

    it('disables every option', () => {
      const editorial = screen.getByRole('radio', { name: EDITORIAL });

      expect(editorial).toHaveAttribute('aria-disabled', 'true');
    });

    it('points the group at the reason it is disabled', () => {
      const group = screen.getByRole('radiogroup', { name: PRESET_GROUP });

      expect(group).toHaveAttribute('aria-describedby', ARCHIVED_NOTICE_ID);
    });

    it('stops reporting clicks', async () => {
      const editorial = screen.getByRole('radio', { name: EDITORIAL });
      await user.click(editorial);

      expect(handleChange).not.toHaveBeenCalled();
    });
  });
});
