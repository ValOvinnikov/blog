import { ACTION_OUTCOME, LOCALE_ISO_CODES } from '@blog/config';
import { updateTenantLanguagesAction } from '@platform/server/tenants/update-tenant-languages-action';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import {
  ALL_CHANGES_SAVED,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import { TENANT_ID } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LanguagesSettings } from './languages-settings';

vi.mock('@platform/server/tenants/update-tenant-languages-action', () => ({
  updateTenantLanguagesAction: vi.fn(),
}));

const updateTenantLanguagesActionMock = vi.mocked(updateTenantLanguagesAction);

mockRouterRefresh();

const { EN, NL, FR, DE, ES } = LOCALE_ISO_CODES;

const setup = customRender(LanguagesSettings, {
  tenantId: TENANT_ID,
  defaultLocale: EN,
  locales: { stored: [], live: [], limit: 2 },
});

const DATA_DISABLED = 'data-disabled';
const DATA_CHECKED = 'data-checked';
const DATA_UNCHECKED = 'data-unchecked';
const SWITCH = 'switch';
const DUTCH = 'Dutch';
const FRENCH = 'French';
const GERMAN = 'German';
const SPANISH = 'Spanish';

describe(`<${LanguagesSettings.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows the default language apart from the helper sentence', () => {
    setup({ defaultLocale: NL });

    const defaultLanguage = screen.getByText(DUTCH);
    const helper = screen.getByText('Every page is written in it first.');

    expect(defaultLanguage).toBeVisible();
    expect(helper).toBeVisible();
  });

  it('does not offer the default language as an additional one', () => {
    setup();

    const englishSwitch = screen.queryByRole(SWITCH, { name: 'English' });
    const switches = screen.getAllByRole(SWITCH);

    expect(englishSwitch).not.toBeInTheDocument();
    expect(switches).toHaveLength(4);
  });

  it('stops offering languages once the plan allowance is used', async () => {
    setup();

    const dutchSwitch = screen.getByRole(SWITCH, { name: DUTCH });
    const frenchSwitch = screen.getByRole(SWITCH, { name: FRENCH });
    await user.click(dutchSwitch);
    await user.click(frenchSwitch);

    const germanSwitch = screen.getByRole(SWITCH, { name: GERMAN });

    expect(germanSwitch).toHaveAttribute(DATA_DISABLED, '');
    expect(dutchSwitch).not.toHaveAttribute(DATA_DISABLED);
  });

  it('saves the chosen additional languages', async () => {
    updateTenantLanguagesActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    setup();

    const frenchSwitch = screen.getByRole(SWITCH, { name: FRENCH });
    const dutchSwitch = screen.getByRole(SWITCH, { name: DUTCH });
    await user.click(frenchSwitch);
    await user.click(dutchSwitch);

    const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
    await user.click(saveButton);

    await waitFor(() => {
      expect(updateTenantLanguagesActionMock).toHaveBeenCalledWith(TENANT_ID, [
        NL,
        FR,
      ]);
    });
  });

  it('says why each language past the allowance cannot be switched on', () => {
    setup({ locales: { stored: [NL, FR], live: [NL, FR], limit: 2 } });

    const germanSwitch = screen.getByRole(SWITCH, { name: GERMAN });
    const reasons = screen.getAllByText('Turn one off to switch this on');

    expect(germanSwitch).toHaveAttribute(DATA_DISABLED, '');
    expect(reasons).toHaveLength(2);
  });

  it('shows the languages the site serves as live', () => {
    setup({ locales: { stored: [NL, FR, DE], live: [NL, DE], limit: 2 } });

    const germanSwitch = screen.getByRole(SWITCH, { name: GERMAN });
    const frenchSwitch = screen.getByRole(SWITCH, { name: FRENCH });

    expect(germanSwitch).toHaveAttribute(DATA_CHECKED, '');
    expect(frenchSwitch).toHaveAttribute(DATA_UNCHECKED, '');
  });

  it('explains the upgrade and offers nothing when the plan allows only the default', () => {
    setup({ locales: { stored: [], live: [], limit: 0 } });

    const upgradeNotice = screen.getByText(
      'Your plan publishes the default language only. Upgrade to add more languages.',
    );
    const toggles = screen.getAllByRole(SWITCH);

    expect(upgradeNotice).toBeInTheDocument();
    for (const toggle of toggles) {
      expect(toggle).toHaveAttribute(DATA_DISABLED, '');
    }
  });

  describe('after a downgrade', () => {
    it('says which languages stay live and marks the rest as kept', () => {
      setup({ locales: { stored: [NL, FR, DE], live: [NL, FR], limit: 2 } });

      const stayLiveNotice = screen.getByText(/The first 2 stay live/);
      const germanSwitch = screen.getByRole(SWITCH, { name: GERMAN });
      const keptNotice = screen.getByText('Kept, not live on your plan');

      expect(stayLiveNotice).toBeInTheDocument();
      expect(germanSwitch).toHaveAttribute(DATA_UNCHECKED, '');
      expect(keptNotice).toBeInTheDocument();
    });

    it('locks every live language and says why', () => {
      setup({ locales: { stored: [NL, FR, DE], live: [NL, FR], limit: 2 } });

      const liveSwitches = [DUTCH, FRENCH].map((name) =>
        screen.getByRole(SWITCH, { name }),
      );
      const reasons = screen.getAllByText('Upgrade your plan to change this');

      for (const liveSwitch of liveSwitches) {
        expect(liveSwitch).toHaveAttribute(DATA_DISABLED, '');
      }
      expect(reasons).toHaveLength(4);
    });

    it('does not offer a language that was never saved', () => {
      setup({ locales: { stored: [NL, FR, DE], live: [NL, FR], limit: 2 } });

      const spanishSwitch = screen.getByRole(SWITCH, { name: SPANISH });

      expect(spanishSwitch).toHaveAttribute(DATA_DISABLED, '');
    });
  });

  it('offers no Save until something changes', () => {
    setup({ locales: { stored: [ES], live: [ES], limit: 2 } });

    const saveButton = screen.queryByRole('button', { name: SAVE_CHANGES });
    const savedText = screen.queryByText(ALL_CHANGES_SAVED);

    expect(saveButton).not.toBeInTheDocument();
    expect(savedText).not.toBeInTheDocument();
  });

  it('counts each toggled language and restores the saved ones on Discard', async () => {
    setup({ locales: { stored: [ES], live: [ES], limit: 2 } });

    const spanishSwitch = screen.getByRole(SWITCH, { name: SPANISH });
    const dutchSwitch = screen.getByRole(SWITCH, { name: DUTCH });
    await user.click(spanishSwitch);
    await user.click(dutchSwitch);

    const changesRegion = screen.getByRole('region', { name: UNSAVED_CHANGES });

    expect(changesRegion).toHaveTextContent('2 unsaved changes');

    const discardButton = screen.getByRole('button', { name: 'Discard' });
    await user.click(discardButton);

    expect(spanishSwitch).toHaveAttribute(DATA_CHECKED, '');
    expect(dutchSwitch).toHaveAttribute(DATA_UNCHECKED, '');
  });
});
