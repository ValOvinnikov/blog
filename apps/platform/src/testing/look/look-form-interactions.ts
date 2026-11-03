import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { screen, waitFor } from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import { GO_TO_THE_FIRST_ONE } from '@platform/testing/render-in-settings-form';
import {
  CURRENT_LOGO,
  MOCK_STAGED_LOGO_BLOB_URL,
} from '@platform/testing/site-config/fixtures';
import type { UserEvent } from '@testing-library/user-event';

const MOCK_LOGO_FILE = new File(['bytes'], faker.system.commonFileName('png'), {
  type: 'image/png',
});

export const pickLogo = async (user: UserEvent) => {
  const [logoInput] = screen.getAllByTestId('asset-upload-field-input');
  if (!logoInput) throw new Error('logo input not found');
  await user.upload(logoInput, MOCK_LOGO_FILE);
  await waitFor(() => {
    const logo = screen.getByAltText(CURRENT_LOGO);
    expect(logo).toHaveAttribute('src', MOCK_STAGED_LOGO_BLOB_URL);
  });
};

export const nudgeAccentHue = async (user: UserEvent) => {
  const accentHueSlider = screen.getByRole('slider', {
    name: messages.lookForm.accentHueLabel,
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
