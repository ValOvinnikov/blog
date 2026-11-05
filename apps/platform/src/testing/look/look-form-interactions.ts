import { faker } from '@faker-js/faker';
import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import { ASSET_UPLOAD_INPUT_TEST_ID } from '@platform/constants/asset-upload';
import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_EXPANDED } from '@platform/testing/aria';
import { screen, waitFor, within } from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import {
  BRAND_IMAGES_HINT,
  EDITORIAL,
} from '@platform/testing/look/look-form-fixtures';
import {
  GO_TO_THE_FIRST_ONE,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  CURRENT_LOGO,
  MOCK_STAGED_LOGO_BLOB_URL,
  REPLACE_LOGO,
} from '@platform/testing/site-config/fixtures';
import type { UserEvent } from '@testing-library/user-event';

const { lookForm: LOOK_FORM } = messages;

const MOCK_LOGO_FILE = new File(['bytes'], faker.system.commonFileName('png'), {
  type: 'image/png',
});

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

export const pickLogo = async (user: UserEvent) => {
  await openLookRow(user, LOOK_ROW.BRAND);
  const [logoInput] = screen.getAllByTestId(ASSET_UPLOAD_INPUT_TEST_ID);
  if (!logoInput) throw new Error('logo input not found');
  await user.upload(logoInput, MOCK_LOGO_FILE);
  await waitFor(() => {
    const logo = screen.getByAltText(CURRENT_LOGO);
    expect(logo).toHaveAttribute('src', MOCK_STAGED_LOGO_BLOB_URL);
  });
};

export const findLogoPickerWithError = async (message: string) => {
  const replaceLogoButton = await screen.findByRole('button', {
    name: REPLACE_LOGO,
  });
  await waitFor(() => {
    expect(replaceLogoButton).toHaveAccessibleDescription(
      `${BRAND_IMAGES_HINT} ${message}`,
    );
  });
  return replaceLogoButton;
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

export const pickAndSaveLogo = async (user: UserEvent) => {
  await pickLogo(user);
  await clickSave(user);
};

export const stageAssetRemoval = async (user: UserEvent) => {
  await openLookRow(user, LOOK_ROW.BRAND);
  const removeButton = screen.getByRole('button', {
    name: messages.assetUploadField.remove,
  });
  await user.click(removeButton);
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
