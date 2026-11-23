import { faker } from '@faker-js/faker';
import { ASSET_UPLOAD_INPUT_TEST_ID } from '@platform/constants/asset-upload';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen, waitFor } from '@platform/testing/custom-render';
import { BRAND_IMAGES_HINT } from '@platform/testing/look/look-form-fixtures';
import {
  clickSave,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import {
  CURRENT_LOGO,
  MOCK_STAGED_LOGO_BLOB_URL,
  REPLACE_LOGO,
} from '@platform/testing/site-config/fixtures';
import type { UserEvent } from '@testing-library/user-event';

const MOCK_LOGO_FILE = new File(['bytes'], faker.system.commonFileName('png'), {
  type: 'image/png',
});

const pickBrandImage = async (
  user: UserEvent,
  inputIndex: number,
  currentAlt: string,
) => {
  await openLookRow(user, LOOK_ROW.BRAND);
  const input = screen.getAllByTestId(ASSET_UPLOAD_INPUT_TEST_ID)[inputIndex];
  if (!input) throw new Error(`${currentAlt} input not found`);
  await user.upload(input, MOCK_LOGO_FILE);
  await waitFor(() => {
    const image = screen.getByAltText(currentAlt);
    expect(image).toHaveAttribute('src', MOCK_STAGED_LOGO_BLOB_URL);
  });
};

export const pickLogo = (user: UserEvent) =>
  pickBrandImage(user, 0, CURRENT_LOGO);

export const pickLogoDark = (user: UserEvent) =>
  pickBrandImage(user, 1, messages.assetUploadField.logoDark.currentAlt);

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
