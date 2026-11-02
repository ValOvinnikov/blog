import { FONT_CHOICE } from '@blog/config';
import { faker } from '@faker-js/faker';
import { FONT_OPTIONS } from '@platform/config/fonts';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { pickNextOptionByKeyboard } from '@platform/testing/pick-next-option-by-keyboard';
import { ARCHIVED_NOTICE_ID } from '@platform/testing/render-in-settings-form';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { FontPicker } from './font-picker';

faker.seed(5995);

const MOCK_ARIA_LABEL = faker.lorem.words(2);

const setup = customRender(FontPicker, {
  aria: { label: MOCK_ARIA_LABEL },
  value: FONT_CHOICE.SPACE_GROTESK,
  onChange: vi.fn(),
});

describe(`<${FontPicker.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows the current font on the trigger, set in its own font family', () => {
    const { label, fontFamily } = FONT_OPTIONS[FONT_CHOICE.FRAUNCES];
    setup({ value: FONT_CHOICE.FRAUNCES });

    const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });
    const triggerFont = within(trigger).getByText(label);

    expect(triggerFont).toBeVisible();
    expect(triggerFont).toHaveStyle({ fontFamily });
  });

  it('marks the current font as selected in the list', async () => {
    setup();

    const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });
    await user.click(trigger);

    const currentOption = await screen.findByRole('option', {
      name: FONT_OPTIONS[FONT_CHOICE.SPACE_GROTESK].label,
    });

    expect(currentOption).toHaveAttribute('aria-selected', 'true');
  });

  it.each(Object.values(FONT_OPTIONS))(
    'lists $label by name, set in its own font family',
    async ({ label, fontFamily }) => {
      setup();

      const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });
      await user.click(trigger);

      const option = await screen.findByRole('option', { name: label });
      const optionText = within(option).getByText(label);

      expect(option).toBeVisible();
      expect(optionText).toHaveStyle({ fontFamily });
    },
  );

  it('reports the font chosen from the list', async () => {
    const handleChange = vi.fn();
    setup({ value: FONT_CHOICE.NEWSREADER, onChange: handleChange });

    const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });
    await user.click(trigger);
    const interOption = await screen.findByRole('option', {
      name: FONT_OPTIONS[FONT_CHOICE.INTER].label,
    });
    await user.click(interOption);

    expect(handleChange).toHaveBeenCalledWith(FONT_CHOICE.INTER);
  });

  it('picks a font with the arrow keys and Enter', async () => {
    const handleChange = vi.fn();
    setup({ onChange: handleChange });

    await pickNextOptionByKeyboard(
      user,
      FONT_OPTIONS[FONT_CHOICE.NEWSREADER].label,
    );

    expect(handleChange).toHaveBeenCalledWith(FONT_CHOICE.NEWSREADER);
  });

  it('keeps the current font on a locked trigger that does not open', async () => {
    const handleChange = vi.fn();
    const { label, fontFamily } = FONT_OPTIONS[FONT_CHOICE.FRAUNCES];
    setup({
      value: FONT_CHOICE.FRAUNCES,
      onChange: handleChange,
      isLocked: true,
    });

    await user.tab();
    await user.keyboard('{Enter}');
    const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });
    const triggerFont = within(trigger).getByText(label);
    const listbox = screen.queryByRole('listbox');

    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-disabled', 'true');
    expect(triggerFont).toHaveStyle({ fontFamily });
    expect(listbox).not.toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('is disabled and described by the given notice when disabled', async () => {
    const handleChange = vi.fn();
    setup({
      onChange: handleChange,
      isDisabled: true,
      aria: { label: MOCK_ARIA_LABEL, describedBy: ARCHIVED_NOTICE_ID },
    });

    const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });
    await user.click(trigger);

    const listbox = screen.queryByRole('listbox');

    expect(trigger).toHaveAttribute('aria-describedby', ARCHIVED_NOTICE_ID);
    expect(listbox).not.toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });
});
