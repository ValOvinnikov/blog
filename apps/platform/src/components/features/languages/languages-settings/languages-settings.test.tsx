import { ACTION_OUTCOME, LOCALE_ISO_CODES } from '@blog/config';
import messages from '@platform/i18n/messages/en.json';
import { updateTenantLanguagesAction } from '@platform/server/tenants/update-tenant-languages-action';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  ALL_CHANGES_SAVED,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LanguagesSettings } from './languages-settings';

vi.mock('@platform/server/tenants/update-tenant-languages-action', () => ({
  updateTenantLanguagesAction: vi.fn(),
}));

const updateTenantLanguagesActionMock = vi.mocked(updateTenantLanguagesAction);

const { EN, NL, FR, DE, ES } = LOCALE_ISO_CODES;
const ADDITIONAL_LOCALE_LIMIT = 2;

const { languageNames, languagesSettings, saveBar } = messages;
const t = makeEnTranslator('languagesSettings');
const tSaveBar = makeEnTranslator('saveBar');

const SWITCH = 'switch';

const setup = customRender(LanguagesSettings, {
  tenantId: MOCK_TENANT_ID,
  defaultLocale: EN,
  locales: { stored: [], live: [], limit: ADDITIONAL_LOCALE_LIMIT },
});

describe(`<${LanguagesSettings.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    mockRouterRefresh();
  });

  it('shows the default language apart from the helper sentence', () => {
    setup({ defaultLocale: NL });

    const defaultLanguage = screen.getByText(languageNames[NL]);
    const helper = screen.getByText(languagesSettings.defaultDescription);

    expect(defaultLanguage).toBeVisible();
    expect(helper).toBeVisible();
  });

  describe('with no additional language saved', () => {
    beforeEach(() => {
      setup();
    });

    it('does not offer the default language as an additional one', () => {
      const englishSwitch = screen.queryByRole(SWITCH, {
        name: languageNames[EN],
      });
      const switches = screen.getAllByRole(SWITCH);

      expect(englishSwitch).not.toBeInTheDocument();
      expect(switches).toHaveLength(4);
    });

    it('stops offering languages once the plan allowance is used', async () => {
      const dutchSwitch = screen.getByRole(SWITCH, { name: languageNames[NL] });
      const frenchSwitch = screen.getByRole(SWITCH, {
        name: languageNames[FR],
      });
      await user.click(dutchSwitch);
      await user.click(frenchSwitch);

      const germanSwitch = screen.getByRole(SWITCH, {
        name: languageNames[DE],
      });

      expect(germanSwitch).toBeDisabled();
      expect(dutchSwitch).toBeEnabled();
    });

    it('saves the chosen additional languages', async () => {
      updateTenantLanguagesActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
      });

      const frenchSwitch = screen.getByRole(SWITCH, {
        name: languageNames[FR],
      });
      const dutchSwitch = screen.getByRole(SWITCH, { name: languageNames[NL] });
      await user.click(frenchSwitch);
      await user.click(dutchSwitch);

      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      await user.click(saveButton);

      await waitFor(() => {
        expect(updateTenantLanguagesActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          [NL, FR],
        );
      });
    });
  });

  it('says why each language past the allowance cannot be switched on', () => {
    setup({
      locales: {
        stored: [NL, FR],
        live: [NL, FR],
        limit: ADDITIONAL_LOCALE_LIMIT,
      },
    });

    const germanSwitch = screen.getByRole(SWITCH, { name: languageNames[DE] });
    const reasons = screen.getAllByText(languagesSettings.atLimitLockedReason);

    expect(germanSwitch).toBeDisabled();
    expect(reasons).toHaveLength(2);
  });

  it('shows the languages the site serves as live', () => {
    setup({
      locales: {
        stored: [NL, FR, DE],
        live: [NL, DE],
        limit: ADDITIONAL_LOCALE_LIMIT,
      },
    });

    const germanSwitch = screen.getByRole(SWITCH, { name: languageNames[DE] });
    const frenchSwitch = screen.getByRole(SWITCH, { name: languageNames[FR] });

    expect(germanSwitch).toBeChecked();
    expect(frenchSwitch).not.toBeChecked();
  });

  it('explains the upgrade and offers nothing when the plan allows only the default', () => {
    setup({ locales: { stored: [], live: [], limit: 0 } });

    const upgradeNotice = screen.getByText(languagesSettings.upgradeNotice);
    const toggles = screen.getAllByRole(SWITCH);

    expect(upgradeNotice).toBeVisible();
    for (const toggle of toggles) {
      expect(toggle).toBeDisabled();
    }
  });

  describe('after a downgrade', () => {
    const STORED_LOCALES = [NL, FR, DE];

    beforeEach(() => {
      setup({
        locales: {
          stored: STORED_LOCALES,
          live: [NL, FR],
          limit: ADDITIONAL_LOCALE_LIMIT,
        },
      });
    });

    it('says which languages stay live and marks the rest as kept', () => {
      const stayLiveNotice = screen.getByText(
        t('downgradeNotice', {
          allowed: ADDITIONAL_LOCALE_LIMIT,
          stored: STORED_LOCALES.length,
        }),
      );
      const germanSwitch = screen.getByRole(SWITCH, {
        name: languageNames[DE],
      });
      const keptNotice = screen.getByText(languagesSettings.keptBadge);

      expect(stayLiveNotice).toBeVisible();
      expect(germanSwitch).not.toBeChecked();
      expect(keptNotice).toBeVisible();
    });

    it('locks every live language and says why', () => {
      const dutchSwitch = screen.getByRole(SWITCH, { name: languageNames[NL] });
      const frenchSwitch = screen.getByRole(SWITCH, {
        name: languageNames[FR],
      });
      const reasons = screen.getAllByText(
        languagesSettings.overLimitLockedReason,
      );

      expect(dutchSwitch).toBeDisabled();
      expect(frenchSwitch).toBeDisabled();
      expect(reasons).toHaveLength(4);
    });

    it('does not offer a language that was never saved', () => {
      const spanishSwitch = screen.getByRole(SWITCH, {
        name: languageNames[ES],
      });

      expect(spanishSwitch).toBeDisabled();
    });
  });

  describe('with Spanish saved and live', () => {
    beforeEach(() => {
      setup({
        locales: { stored: [ES], live: [ES], limit: ADDITIONAL_LOCALE_LIMIT },
      });
    });

    it('offers no Save until something changes', () => {
      const saveButton = screen.queryByRole('button', { name: SAVE_CHANGES });
      const savedText = screen.queryByText(ALL_CHANGES_SAVED);

      expect(saveButton).not.toBeInTheDocument();
      expect(savedText).not.toBeInTheDocument();
    });

    it('counts each toggled language and restores the saved ones on Discard', async () => {
      const spanishSwitch = screen.getByRole(SWITCH, {
        name: languageNames[ES],
      });
      const dutchSwitch = screen.getByRole(SWITCH, { name: languageNames[NL] });
      await user.click(spanishSwitch);
      await user.click(dutchSwitch);

      const changesRegion = screen.getByRole('region', {
        name: UNSAVED_CHANGES,
      });

      expect(changesRegion).toHaveTextContent(
        tSaveBar('unsavedChanges', { count: 2 }),
      );

      const discardButton = screen.getByRole('button', {
        name: saveBar.discard,
      });
      await user.click(discardButton);

      expect(spanishSwitch).toBeChecked();
      expect(dutchSwitch).not.toBeChecked();
    });
  });
});
