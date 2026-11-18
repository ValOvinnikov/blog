import messages from '@platform/i18n/messages/en.json';
import { updateTenantLanguagesAction } from '@platform/server/tenants/update-tenant-languages-action';
import { ARIA_DISABLED } from '@platform/testing/aria';
import {
  customRender,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  ALL_CHANGES_SAVED,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  MOCK_TENANT_CREATED_AT,
  MOCK_TENANT_ID,
  mockGrantTarget,
} from '@platform/testing/tenants/fixtures';
import { formatDate } from '@platform/utils/format-date/format-date';
import { ACTION_OUTCOME, LOCALE_ISO_CODES } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LanguagesSettings } from './languages-settings';

vi.mock('@platform/server/entitlement-grants/grant-entitlement-action');

vi.mock('@platform/server/tenants/update-tenant-languages-action', () => ({
  updateTenantLanguagesAction: vi.fn(),
}));

const updateTenantLanguagesActionMock = vi.mocked(updateTenantLanguagesAction);

const { EN, NL, FR, DE, ES } = LOCALE_ISO_CODES;
const ADDITIONAL_LOCALE_LIMIT = 2;

const { languageNames, languagesSettings, saveBar } = messages;
const t = makeEnTranslator('languagesSettings');
const tSaveBar = makeEnTranslator('saveBar');
const tLanguages = makeEnTranslator('languagesSettings');
const tGrantedBadge = makeEnTranslator('grantedBadge');

const SWITCH = 'switch';

const setup = customRender(LanguagesSettings, {
  tenantId: MOCK_TENANT_ID,
  defaultLocale: EN,
  locales: { stored: [], live: [], limit: ADDITIONAL_LOCALE_LIMIT },
  grants: { target: undefined, granted: undefined },
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

      expect(germanSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(dutchSwitch).not.toHaveAttribute(ARIA_DISABLED);
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

    expect(germanSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
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
      expect(toggle).toHaveAttribute(ARIA_DISABLED, 'true');
    }
  });

  describe('grants', () => {
    const NO_LANGUAGES_ALLOWED = { stored: [], live: [], limit: 0 };
    const GRANT_MORE_LANGUAGES = { name: messages.grantLanguages.trigger };
    const findPlanLimitNotice = () => {
      const notice = screen
        .getAllByRole('status')
        .find((status) =>
          within(status).queryByText(languagesSettings.noticeTitle),
        );
      if (!notice) throw new Error('The plan-limit notice is missing');

      return notice;
    };

    describe('for a super admin on a plan that publishes only the default', () => {
      beforeEach(() => {
        setup({
          locales: NO_LANGUAGES_ALLOWED,
          grants: { target: mockGrantTarget(), granted: undefined },
        });
      });

      it('offers the grant inside the plan-limit notice', () => {
        const notice = findPlanLimitNotice();
        const grant = within(notice).getByRole('button', GRANT_MORE_LANGUAGES);

        expect(grant).toBeVisible();
      });

      it('offers the grant once, not on each language row', () => {
        const grants = screen.getAllByRole('button', GRANT_MORE_LANGUAGES);

        expect(grants).toHaveLength(1);
      });
    });

    describe('for a super admin on a plan whose allowance is used', () => {
      beforeEach(() => {
        setup({
          locales: {
            stored: [NL, FR],
            live: [NL, FR],
            limit: ADDITIONAL_LOCALE_LIMIT,
          },
          grants: { target: mockGrantTarget(), granted: undefined },
        });
      });

      it('says the allowance is used and offers the grant in the notice', () => {
        const notice = findPlanLimitNotice();
        const usedNotice = within(notice).getByText(
          t('atLimitNotice', { allowed: ADDITIONAL_LOCALE_LIMIT }),
        );
        const grant = within(notice).getByRole('button', GRANT_MORE_LANGUAGES);

        expect(usedNotice).toBeVisible();
        expect(grant).toBeVisible();
      });
    });

    it('offers no grant while the allowance has room', () => {
      setup({
        locales: { stored: [NL], live: [NL], limit: ADDITIONAL_LOCALE_LIMIT },
        grants: { target: mockGrantTarget(), granted: undefined },
      });

      const grant = screen.queryByRole('button', GRANT_MORE_LANGUAGES);

      expect(grant).not.toBeInTheDocument();
    });

    it('offers no grant once every language is allowed', () => {
      const everyAdditional = [NL, FR, DE, ES];
      setup({
        locales: {
          stored: everyAdditional,
          live: everyAdditional,
          limit: everyAdditional.length,
        },
        grants: { target: mockGrantTarget(), granted: undefined },
      });

      const grant = screen.queryByRole('button', GRANT_MORE_LANGUAGES);

      expect(grant).not.toBeInTheDocument();
    });

    it('shows the owner no notice when the allowance is used', () => {
      setup({
        locales: {
          stored: [NL, FR],
          live: [NL, FR],
          limit: ADDITIONAL_LOCALE_LIMIT,
        },
      });

      const notice = screen.queryByText(languagesSettings.noticeTitle);

      expect(notice).not.toBeInTheDocument();
    });

    it('offers no grant to anyone who cannot grant', () => {
      setup({ locales: NO_LANGUAGES_ALLOWED });

      const grant = screen.queryByRole('button', GRANT_MORE_LANGUAGES);

      expect(grant).not.toBeInTheDocument();
    });

    describe('with a language grant raising the limit', () => {
      const GRANTED_LIMIT = 3;

      beforeEach(() => {
        setup({
          locales: { stored: [NL], live: [NL], limit: GRANTED_LIMIT },
          grants: { target: undefined, granted: { expiresAt: null } },
        });
      });

      it('drops the plan-limit notice', () => {
        const notice = screen.queryByText(languagesSettings.noticeTitle);

        expect(notice).not.toBeInTheDocument();
      });

      it('counts the languages against the granted number, not the plan', () => {
        const allowance = screen.getByText(
          tLanguages('allowanceGranted', { used: 1, allowed: GRANTED_LIMIT }),
        );

        expect(allowance).toBeVisible();
      });

      it('says Granted in the card header', () => {
        const granted = screen.getByText(messages.grantedBadge.label);

        expect(granted).toBeVisible();
      });
    });

    it('says until when a language grant lasts', () => {
      setup({
        locales: { stored: [], live: [], limit: ADDITIONAL_LOCALE_LIMIT },
        grants: {
          target: undefined,
          granted: { expiresAt: MOCK_TENANT_CREATED_AT },
        },
      });

      const granted = screen.getByText(
        tGrantedBadge('labelUntil', {
          date: formatDate(MOCK_TENANT_CREATED_AT, EN),
        }),
      );

      expect(granted).toBeVisible();
    });
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

      expect(dutchSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(frenchSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(reasons).toHaveLength(4);
    });

    it('does not offer a language that was never saved', () => {
      const spanishSwitch = screen.getByRole(SWITCH, {
        name: languageNames[ES],
      });

      expect(spanishSwitch).toHaveAttribute(ARIA_DISABLED, 'true');
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
