import { faker } from '@faker-js/faker';
import { LOOK_ROW, type TLookRow } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_EXPANDED } from '@platform/testing/aria';
import { screen, waitFor, within } from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import { GO_TO_THE_FIRST_ONE } from '@platform/testing/render-in-settings-form';
import {
  CURRENT_LOGO,
  MOCK_STAGED_LOGO_BLOB_URL,
} from '@platform/testing/site-config/fixtures';
import type { UserEvent } from '@testing-library/user-event';

const { lookForm: LOOK_FORM } = messages;

const MOCK_LOGO_FILE = new File(['bytes'], faker.system.commonFileName('png'), {
  type: 'image/png',
});

const LOOK_ROW_TITLE = {
  [LOOK_ROW.COLOUR]: LOOK_FORM.colourHeading,
  [LOOK_ROW.BRAND]: LOOK_FORM.brandHeading,
  [LOOK_ROW.TYPE]: LOOK_FORM.typeHeading,
  [LOOK_ROW.SHAPE]: LOOK_FORM.shapeHeading,
  [LOOK_ROW.BUTTONS]: LOOK_FORM.buttonsHeading,
  [LOOK_ROW.HEADER]: LOOK_FORM.headerHeading,
  [LOOK_ROW.FOOTER]: LOOK_FORM.footerHeading,
  [LOOK_ROW.LANGUAGE_SWITCHER]: LOOK_FORM.languageSwitcherLabel,
} as const satisfies Record<TLookRow, string>;

export const lookRowTrigger = (row: TLookRow) => {
  const heading = screen.getByRole('heading', {
    level: 3,
    name: new RegExp(`^${LOOK_ROW_TITLE[row]}`),
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
  const [logoInput] = screen.getAllByTestId('asset-upload-field-input');
  if (!logoInput) throw new Error('logo input not found');
  await user.upload(logoInput, MOCK_LOGO_FILE);
  await waitFor(() => {
    const logo = screen.getByAltText(CURRENT_LOGO);
    expect(logo).toHaveAttribute('src', MOCK_STAGED_LOGO_BLOB_URL);
  });
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
