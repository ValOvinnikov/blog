import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_DISABLED, ARIA_PRESSED } from '@platform/testing/aria';
import { screen, within } from '@platform/testing/custom-render';
import {
  GROWTH,
  GROWTH_BADGE_TEXT,
} from '@platform/testing/look/look-form-fixtures';
import {
  growthBadgesOutsideNote,
  lookRowTrigger,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import {
  setupArchived,
  setupLookForm,
} from '@platform/testing/look/look-form-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;
const SWITCHER_OPTION = LOOK_FORM.languageSwitcherOptionLabel;

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe.each([
    { languages: 'one language', liveLocales: [LOCALE_ISO_CODES.EN] },
    {
      languages: 'two languages',
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.FR],
    },
  ])('on Free with $languages', ({ liveLocales }) => {
    beforeEach(() => {
      setupLookForm({ plan: TENANT_PLAN.FREE, liveLocales });
    });

    it('folds to the published style and One language, with a Growth badge', () => {
      const trigger = lookRowTrigger(LOOK_ROW.LANGUAGE_SWITCHER);
      const badge = within(trigger).getByText(GROWTH, { exact: true });

      expect(trigger).toHaveTextContent(
        `${SWITCHER_OPTION.MENU_CODE} · ${LOOK_FORM.summaryOneLanguage}`,
      );
      expect(badge).toBeVisible();
    });

    it('says why the card is quiet and shows the style locked at Code, described below', async () => {
      await openLookRow(user, LOOK_ROW.LANGUAGE_SWITCHER);

      const freeLine = screen.getByText(
        LOOK_FORM.languageSwitcherFreeDescription,
      );
      const singleLanguageNote = screen.queryByText(
        LOOK_FORM.languageSwitcherSingleLanguage,
      );
      const styleGroup = screen.getByRole('group', {
        name: `${LOOK_FORM.languageSwitcherStyleLabel} ${GROWTH_BADGE_TEXT}`,
      });
      const menuCodeButton = within(styleGroup).getByRole('button', {
        name: SWITCHER_OPTION.MENU_CODE,
      });
      const codesButton = within(styleGroup).getByRole('button', {
        name: SWITCHER_OPTION.CODES,
      });

      expect(freeLine).toBeVisible();
      expect(singleLanguageNote).not.toBeInTheDocument();
      expect(menuCodeButton).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(codesButton).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(styleGroup).toHaveAccessibleDescription(
        expect.stringContaining(
          LOOK_FORM.languageSwitcherOptionDescription.MENU_CODE,
        ),
      );
    });
  });

  it('keeps the Free message and a disabled style, unbadged, on an archived Free site', async () => {
    setupArchived({
      plan: TENANT_PLAN.FREE,
      liveLocales: [LOCALE_ISO_CODES.EN],
    });
    await openLookRow(user, LOOK_ROW.LANGUAGE_SWITCHER);

    const freeLine = screen.getByText(
      LOOK_FORM.languageSwitcherFreeDescription,
    );
    const singleLanguageNote = screen.queryByText(
      LOOK_FORM.languageSwitcherSingleLanguage,
    );
    const codesButton = screen.getByRole('button', {
      name: SWITCHER_OPTION.CODES,
    });
    const badges = growthBadgesOutsideNote();

    expect(freeLine).toBeVisible();
    expect(singleLanguageNote).not.toBeInTheDocument();
    expect(codesButton).toBeDisabled();
    expect(badges).toHaveLength(0);
  });
});
