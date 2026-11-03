import {
  ACTION_OUTCOME,
  isAccentHueAccessible,
  LOCALE_ISO_CODES,
} from '@blog/config';
import type * as BlogConfig from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import messages from '@platform/i18n/messages/en.json';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import { ARIA_EXPANDED } from '@platform/testing/aria';
import {
  customRender,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  nudgeAccentHue,
  pickLogo,
} from '@platform/testing/look/look-form-interactions';
import {
  GO_TO_THE_FIRST_ONE,
  SAVE_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  MOCK_STAGED_LOGO_BLOB_URL,
  REPLACE_LOGO,
} from '@platform/testing/site-config/fixtures';
import {
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@blog/config', async (importOriginal) => ({
  ...(await importOriginal<typeof BlogConfig>()),
  isAccentHueAccessible: vi.fn(() => true),
}));

vi.mock('@platform/server/site-config/update-look-action', () => ({
  updateLookAction: vi.fn(),
}));

vi.mock('@platform/server/site-config/upload-brand-asset-action', () => ({
  uploadBrandAssetAction: vi.fn(),
}));

vi.mock('@platform/server/site-config/clear-brand-asset-action', () => ({
  clearBrandAssetAction: vi.fn(),
}));

faker.seed(6391);

const { lookForm: LOOK_FORM } = messages;
const tSaveBar = makeEnTranslator('saveBar');

const UNSAVED_DOT = tSaveBar('regionLabel');
const ACCENT_HUE = LOOK_FORM.accentHueLabel;
const NUDGED_ACCENT_HUE = defaultLookFormValues().accentHue + 1;
const RESET_TO_PRESET = LOOK_FORM.resetButton;
const ROW_TITLES = [
  LOOK_FORM.colourHeading,
  LOOK_FORM.brandHeading,
  LOOK_FORM.typeHeading,
  LOOK_FORM.shapeHeading,
  LOOK_FORM.buttonsHeading,
  LOOK_FORM.headerHeading,
  LOOK_FORM.footerHeading,
  LOOK_FORM.languageSwitcherLabel,
];

const setup = customRender(LookForm, {
  tenantId: MOCK_TENANT_ID,
  tenantName: MOCK_TENANT_NAME,
  siteHost: MOCK_TENANT_DOMAIN,
  initialValues: defaultLookFormValues(),
  plan: TENANT_PLAN.GROWTH,
  liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR],
  hasReaderAccounts: true,
  hasCookieBanner: true,
});

const rowTrigger = (title: string) => {
  const heading = screen.getByRole('heading', {
    level: 3,
    name: new RegExp(`^${title}`),
  });

  return within(heading).getByRole('button');
};

describe('the Look rows folding', () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
    setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(ROW_TITLES)('loads the %s row folded', (title) => {
    const trigger = rowTrigger(title);

    expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
  });

  it('folds the open Footer row when Language switcher opens', async () => {
    const footerTrigger = rowTrigger(LOOK_FORM.footerHeading);
    const languageSwitcherTrigger = rowTrigger(LOOK_FORM.languageSwitcherLabel);

    await user.click(footerTrigger);
    await user.click(languageSwitcherTrigger);

    const expandedTriggers = ROW_TITLES.filter(
      (title) => rowTrigger(title).getAttribute(ARIA_EXPANDED) === 'true',
    );
    expect(expandedTriggers).toEqual([LOOK_FORM.languageSwitcherLabel]);
  });

  it('folds an open Style row when a Site parts row opens', async () => {
    const colourTrigger = rowTrigger(LOOK_FORM.colourHeading);
    const headerTrigger = rowTrigger(LOOK_FORM.headerHeading);

    await user.click(colourTrigger);
    await user.click(headerTrigger);

    expect(colourTrigger).toHaveAttribute(ARIA_EXPANDED, 'false');
    expect(headerTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
  });

  it('names an open row body after the row title', async () => {
    const colourTrigger = rowTrigger(LOOK_FORM.colourHeading);
    await user.click(colourTrigger);

    const body = screen.getByRole('group', { name: LOOK_FORM.colourHeading });
    const slider = within(body).getByRole('slider', { name: ACCENT_HUE });

    expect(slider).toBeVisible();
  });

  it('keeps a typed value when its row folds and opens again', async () => {
    const colourTrigger = rowTrigger(LOOK_FORM.colourHeading);
    await user.click(colourTrigger);
    await nudgeAccentHue(user);
    await user.click(colourTrigger);
    await user.click(colourTrigger);

    const slider = screen.getByRole('slider', { name: ACCENT_HUE });
    expect(slider).toHaveValue(String(NUDGED_ACCENT_HUE));
  });

  it('shows the unsaved dot on the changed row only', async () => {
    const colourTrigger = rowTrigger(LOOK_FORM.colourHeading);
    await user.click(colourTrigger);
    await nudgeAccentHue(user);
    await user.click(colourTrigger);

    const dots = screen.getAllByRole('img', { name: UNSAVED_DOT });
    const colourDot = within(colourTrigger).getByRole('img', {
      name: UNSAVED_DOT,
    });
    expect(dots).toEqual([colourDot]);
  });

  describe('with a diverged preset', () => {
    beforeEach(async () => {
      const colourTrigger = rowTrigger(LOOK_FORM.colourHeading);
      await user.click(colourTrigger);
      await nudgeAccentHue(user);
    });

    it('keeps Reset to preset on a card that is not a folding row', () => {
      const presetTrigger = screen.queryByRole('button', {
        name: LOOK_FORM.presetLabel,
      });
      const resetButton = screen.getByRole('button', { name: RESET_TO_PRESET });

      expect(presetTrigger).not.toBeInTheDocument();
      expect(resetButton).toBeVisible();
    });
  });

  describe('when the accent hue is rejected', () => {
    beforeEach(async () => {
      vi.mocked(isAccentHueAccessible).mockImplementation(
        (hue) => hue !== NUDGED_ACCENT_HUE,
      );
      const colourTrigger = rowTrigger(LOOK_FORM.colourHeading);
      const footerTrigger = rowTrigger(LOOK_FORM.footerHeading);
      await user.click(colourTrigger);
      await nudgeAccentHue(user);
      await user.click(colourTrigger);
      await user.click(footerTrigger);
    });

    it('opens the Colour row, keeps Footer open and focuses the slider', async () => {
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);
      const goToFirstOneLink = screen.getByRole('link', {
        name: GO_TO_THE_FIRST_ONE,
      });
      await user.click(goToFirstOneLink);

      const colourTrigger = rowTrigger(LOOK_FORM.colourHeading);
      const footerTrigger = rowTrigger(LOOK_FORM.footerHeading);
      const slider = screen.getByRole('slider', { name: ACCENT_HUE });
      expect(colourTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(footerTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(slider).toHaveFocus();
    });
  });

  describe('when the logo upload fails', () => {
    beforeEach(async () => {
      vi.mocked(uploadBrandAssetAction).mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      const brandTrigger = rowTrigger(LOOK_FORM.brandHeading);
      const colourTrigger = rowTrigger(LOOK_FORM.colourHeading);
      await user.click(brandTrigger);
      await pickLogo(user);
      await user.click(brandTrigger);
      await user.click(colourTrigger);
    });

    it('opens the Brand row, folds nothing else and focuses the picker', async () => {
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);
      const goToFirstOneLink = await screen.findByRole('link', {
        name: GO_TO_THE_FIRST_ONE,
      });
      await user.click(goToFirstOneLink);

      const brandTrigger = rowTrigger(LOOK_FORM.brandHeading);
      const colourTrigger = rowTrigger(LOOK_FORM.colourHeading);
      const replaceLogoButton = screen.getByRole('button', {
        name: REPLACE_LOGO,
      });
      await waitFor(() => {
        expect(replaceLogoButton).toHaveFocus();
      });
      expect(brandTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      expect(colourTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
    });
  });
});
