import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import type { UserEvent } from '@testing-library/user-event';

const { lookForm: LOOK_FORM, buttonColorField: BUTTON_COLOR_FIELD } = messages;

export const BUTTON_COLOR_FOLLOWS_ACCENT = LOOK_FORM.buttonColorFollowAccent;
export const BUTTON_COLOR_DARK_FOLLOWS = LOOK_FORM.buttonColorDarkFollow;

export const followSwitch = (name: string) =>
  screen.getByRole('switch', { name });

export const hexInputs = () =>
  screen.getAllByRole('textbox', { name: BUTTON_COLOR_FIELD.hexLabel });

export const pickButtonColor = async (user: UserEvent, hex: string) => {
  await user.click(followSwitch(BUTTON_COLOR_FOLLOWS_ACCENT));
  const [hexInput] = hexInputs();
  await user.clear(hexInput!);
  await user.type(hexInput!, hex);
};
