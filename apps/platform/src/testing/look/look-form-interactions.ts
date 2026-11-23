import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_EXPANDED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import { EDITORIAL, GROWTH } from '@platform/testing/look/look-form-fixtures';
import {
  GO_TO_THE_FIRST_ONE,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import type { UserEvent } from '@testing-library/user-event';

const { lookForm: LOOK_FORM } = messages;

export const growthBadgesOutsideNote = () => {
  const note = screen.queryByRole('note');

  return screen
    .queryAllByText(GROWTH, { exact: true })
    .filter((badge) => !note?.contains(badge));
};

export const lookRowTrigger = (row: TLookRow) => {
  const heading = screen.getByRole('heading', {
    level: 3,
    name: new RegExp(`^${LOOK_FORM[LOOK_ROW_TITLE_KEY[row]]}`),
  });

  return within(heading).getByRole('button');
};

export const openLookRow = async (user: UserEvent, row: TLookRow) => {
  const trigger = lookRowTrigger(row);
  if (trigger.getAttribute(ARIA_EXPANDED) === 'true') return;
  await user.click(trigger);
};

export const nudgeAccentHue = async (user: UserEvent) => {
  await openLookRow(user, LOOK_ROW.COLOUR);
  const accentHueSlider = screen.getByRole('slider', {
    name: LOOK_FORM.accentHueLabel,
  });
  await user.click(accentHueSlider);
  await user.keyboard(USER_EVENT_KEY.ARROW_RIGHT);
};

export const clickGoToTheFirstOne = async (user: UserEvent) => {
  const goToFirstOneLink = screen.getByRole('link', {
    name: GO_TO_THE_FIRST_ONE,
  });
  await user.click(goToFirstOneLink);
};

export const clickSave = async (user: UserEvent) => {
  const saveBar = screen.getByRole('region', { name: UNSAVED_CHANGES });
  const saveChangesButton = within(saveBar).getByRole('button', {
    name: SAVE_CHANGES,
  });
  await user.click(saveChangesButton);
};

export const chooseOption = async (
  user: UserEvent,
  selectName: string,
  optionName: string,
) => {
  const select = screen.getByRole('combobox', { name: selectName });
  await user.click(select);
  const option = await screen.findByRole('option', { name: optionName });
  await user.click(option);
};

export const chooseSegment = async (
  user: UserEvent,
  groupName: string,
  optionName: string,
) => {
  const group = screen.getByRole('group', { name: groupName });
  const option = within(group).getByRole('button', { name: optionName });
  await user.click(option);
};

export const chooseEditorial = async (user: UserEvent) => {
  const editorialRadio = screen.getByRole('radio', { name: EDITORIAL });
  await user.click(editorialRadio);
};
