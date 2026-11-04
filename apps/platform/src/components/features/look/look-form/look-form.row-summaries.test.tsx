import { LOCALE_ISO_CODES } from '@blog/config';
import { ACCENT_SWATCH_TEST_ID } from '@platform/constants/accent-swatch';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen, within } from '@platform/testing/custom-render';
import {
  DEFAULT_ACCENT_HUE,
  NUDGED_ACCENT_HUE,
} from '@platform/testing/look/look-form-fixtures';
import {
  lookRowTrigger,
  nudgeAccentHue,
  openLookRow,
  pickLogo,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { MOCK_STAGED_LOGO_BLOB_URL } from '@platform/testing/site-config/fixtures';
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
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('folded row summaries', () => {
    beforeEach(() => {
      setupLookForm();
    });

    it('summarises a folded row and drops the summary once it opens', async () => {
      const colourTrigger = lookRowTrigger(LOOK_ROW.COLOUR);
      expect(colourTrigger).toHaveTextContent(
        `Hue ${DEFAULT_ACCENT_HUE} · logo follows accent`,
      );

      await openLookRow(user, LOOK_ROW.COLOUR);

      expect(colourTrigger).not.toHaveTextContent(/logo follows accent/);
    });

    it('updates the Colour summary and its swatch as the accent hue changes', async () => {
      const swatchBackground = () =>
        within(lookRowTrigger(LOOK_ROW.COLOUR)).getByTestId(
          ACCENT_SWATCH_TEST_ID,
        ).style.background;
      const savedBackground = swatchBackground();

      await nudgeAccentHue(user);
      await user.click(lookRowTrigger(LOOK_ROW.COLOUR));

      expect(lookRowTrigger(LOOK_ROW.COLOUR)).toHaveTextContent(
        `Hue ${NUDGED_ACCENT_HUE} · logo follows accent`,
      );
      expect(swatchBackground()).not.toBe(savedBackground);
    });

    it('hides the Colour swatch from assistive technology', () => {
      const swatchImage = within(lookRowTrigger(LOOK_ROW.COLOUR)).queryByRole(
        'img',
      );

      expect(swatchImage).not.toBeInTheDocument();
    });

    it('reads a staged logo as uploaded before saving', async () => {
      expect(lookRowTrigger(LOOK_ROW.BRAND)).toHaveTextContent(
        'No logo · No favicon',
      );

      await pickLogo(user);
      await user.click(lookRowTrigger(LOOK_ROW.BRAND));

      expect(lookRowTrigger(LOOK_ROW.BRAND)).toHaveTextContent(
        'Logo uploaded · No favicon',
      );
    });
  });

  describe('with one language', () => {
    beforeEach(() => {
      setupLookForm({ liveLocales: [LOCALE_ISO_CODES.EN] });
    });

    it('adds One language to the Language switcher summary', () => {
      expect(lookRowTrigger(LOOK_ROW.LANGUAGE_SWITCHER)).toHaveTextContent(
        /· One language$/,
      );
    });

    it('shows a single-language note and no switcher choice', async () => {
      await openLookRow(user, LOOK_ROW.LANGUAGE_SWITCHER);

      const note = screen.getByText(LOOK_FORM.languageSwitcherSingleLanguage);
      const compactCodesButton = screen.queryByRole('button', {
        name: LOOK_FORM.languageSwitcherOptionLabel.CODES,
      });

      expect(note).toBeVisible();
      expect(compactCodesButton).not.toBeInTheDocument();
    });
  });
});
