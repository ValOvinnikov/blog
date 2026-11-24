import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import { saveChosenStyle } from '@platform/testing/look/look-form-save';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { MOCK_LOGO_DARK_URL } from '@platform/testing/site-config/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { BRAND_VARIANT } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with the default values', () => {
    beforeEach(() => {
      setupLookForm();
    });

    it.each([
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.headerBackgroundLabel,
        option: LOOK_FORM.skinLabel.INK,
        saved: { headerBackground: BRAND_VARIANT.INK },
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.breadcrumbBackgroundLabel,
        option: LOOK_FORM.skinLabel.BRAND_PRIMARY,
        saved: { breadcrumbBackground: BRAND_VARIANT.BRAND_PRIMARY },
      },
    ])('saves the chosen $group style', (style) =>
      saveChosenStyle(user, style),
    );

    it('shows the dark-logo hint under Ink while the site has no dark-mode logo', async () => {
      await openLookRow(user, LOOK_ROW.HEADER);

      const note = screen.getByText(LOOK_FORM.headerBackgroundDarkLogoNote);

      expect(note).toBeVisible();
    });
  });

  it('shows no dark-logo hint once the site has a dark-mode logo', async () => {
    setupLookForm({
      initialValues: {
        ...defaultLookFormValues(),
        logoDark: { url: MOCK_LOGO_DARK_URL },
      },
    });
    await openLookRow(user, LOOK_ROW.HEADER);

    const note = screen.queryByText(LOOK_FORM.headerBackgroundDarkLogoNote);

    expect(note).not.toBeInTheDocument();
  });
});
