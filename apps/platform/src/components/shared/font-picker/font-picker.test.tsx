import { faker } from '@faker-js/faker';
import { FONT_OPTIONS } from '@platform/config/fonts';
import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import { pickNextOptionByKeyboard } from '@platform/testing/pick-next-option-by-keyboard';
import { ARCHIVED_NOTICE_ID } from '@platform/testing/render-in-settings-form';
import { FONT_CHOICE } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { FontPicker } from './font-picker';

faker.seed(5995);

const MOCK_ARIA_LABEL = faker.lorem.words(2);

const onChange = vi.fn();
const { label: FRAUNCES_LABEL, fontFamily: FRAUNCES_FONT_FAMILY } =
  FONT_OPTIONS[FONT_CHOICE.FRAUNCES];

const setup = customRender(FontPicker, {
  aria: { label: MOCK_ARIA_LABEL },
  value: FONT_CHOICE.SPACE_GROTESK,
  onChange,
});

describe(`<${FontPicker.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows the current font on the trigger, set in its own font family', () => {
    setup({ value: FONT_CHOICE.FRAUNCES });

    const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });
    const triggerFont = within(trigger).getByText(FRAUNCES_LABEL);

    expect(triggerFont).toBeVisible();
    expect(triggerFont).toHaveStyle({ fontFamily: FRAUNCES_FONT_FAMILY });
  });

  it('reports the font chosen from the list', async () => {
    setup({ value: FONT_CHOICE.NEWSREADER });

    const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });
    await user.click(trigger);
    const interOption = await screen.findByRole('option', {
      name: FONT_OPTIONS[FONT_CHOICE.INTER].label,
    });
    await user.click(interOption);

    expect(onChange).toHaveBeenCalledWith(FONT_CHOICE.INTER);
  });

  describe('with the default font', () => {
    beforeEach(() => {
      setup();
    });

    it('picks a font with the arrow keys and Enter', async () => {
      await pickNextOptionByKeyboard(
        user,
        FONT_OPTIONS[FONT_CHOICE.NEWSREADER].label,
      );

      expect(onChange).toHaveBeenCalledWith(FONT_CHOICE.NEWSREADER);
    });

    describe('once opened', () => {
      beforeEach(async () => {
        const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });
        await user.click(trigger);
      });

      it('marks the current font as selected in the list', async () => {
        const currentOption = await screen.findByRole('option', {
          name: FONT_OPTIONS[FONT_CHOICE.SPACE_GROTESK].label,
        });

        expect(currentOption).toHaveAttribute(ARIA_ATTRIBUTE.SELECTED, 'true');
      });

      it.each(Object.values(FONT_OPTIONS))(
        'lists $label by name, set in its own font family',
        async ({ label, fontFamily }) => {
          const option = await screen.findByRole('option', { name: label });
          const optionText = within(option).getByText(label);

          expect(option).toBeVisible();
          expect(optionText).toHaveStyle({ fontFamily });
        },
      );
    });
  });

  it('keeps the current font on a locked trigger that does not open', async () => {
    setup({
      value: FONT_CHOICE.FRAUNCES,
      isLocked: true,
    });

    await user.tab();
    await user.keyboard(USER_EVENT_KEY.ENTER);
    const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });
    const triggerFont = within(trigger).getByText(FRAUNCES_LABEL);
    const listbox = screen.queryByRole('listbox');

    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
    expect(triggerFont).toHaveStyle({ fontFamily: FRAUNCES_FONT_FAMILY });
    expect(listbox).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('is disabled and described by the given notice when disabled', async () => {
    setup({
      isDisabled: true,
      aria: { label: MOCK_ARIA_LABEL, describedBy: ARCHIVED_NOTICE_ID },
    });

    const trigger = screen.getByRole('combobox', { name: MOCK_ARIA_LABEL });
    await user.click(trigger);

    const listbox = screen.queryByRole('listbox');

    expect(trigger).toHaveAttribute(
      ARIA_ATTRIBUTE.DESCRIBEDBY,
      ARCHIVED_NOTICE_ID,
    );
    expect(listbox).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
