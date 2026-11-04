import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import {
  DEFAULT_ACCENT_HUE,
  EDITORIAL,
  EDITORIAL_ACCENT_HUE,
  hueValue,
  MOCK_SAVED_ACCENT_HUE,
} from '@platform/testing/look/look-form-fixtures';
import {
  chooseEditorial,
  openLookRow,
  pickLogo,
} from '@platform/testing/look/look-form-interactions';
import {
  setupLookForm,
  setupWithSavedLogo,
} from '@platform/testing/look/look-form-setup';
import {
  CURRENT_LOGO,
  MOCK_STAGED_LOGO_BLOB_URL,
  UPLOAD_LOGO,
} from '@platform/testing/site-config/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import {
  settingsDraftStorageKey,
  writeSettingsDraft,
} from '@platform/utils/settings-draft-storage/settings-draft-storage';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const MOCK_DRAFT_TAKEN_AT = '2026-08-20T09:00:00.000Z';

const RESTORE_CHANGES = /^Restore \d+ changes$/;

const clickRestoreChanges = async (user: UserEvent) => {
  const restoreChangesButton = screen.getByRole('button', {
    name: RESTORE_CHANGES,
  });
  await user.click(restoreChangesButton);
};

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('restores unsaved changes after leaving, keeping the current brand images', async () => {
    const { unmount } = setupLookForm();
    await chooseEditorial(user);
    unmount();

    setupWithSavedLogo();
    await clickRestoreChanges(user);

    const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
    await openLookRow(user, LOOK_ROW.COLOUR);
    const hueReadout = screen.getByText(hueValue(EDITORIAL_ACCENT_HUE));
    expect(editorialPreset).toBeChecked();
    expect(hueReadout).toBeVisible();

    await openLookRow(user, LOOK_ROW.BRAND);
    const logo = screen.getByAltText(CURRENT_LOGO);
    expect(logo).toBeVisible();
  });

  it('drops a draft saved before the header buttons style existed', async () => {
    const olderValues = Object.fromEntries(
      Object.entries(defaultLookFormValues()).filter(
        ([key]) => key !== 'headerControlStyle',
      ),
    );
    writeSettingsDraft(
      settingsDraftStorageKey({ tenantId: MOCK_TENANT_ID, page: 'look' }),
      {
        values: { ...olderValues, accentHue: MOCK_SAVED_ACCENT_HUE },
        baseline: olderValues,
        takenAt: MOCK_DRAFT_TAKEN_AT,
      },
    );
    setupLookForm();
    await openLookRow(user, LOOK_ROW.COLOUR);

    const restoreButton = screen.queryByRole('button', { name: /^Restore/ });
    const hueReadout = screen.getByText(hueValue(DEFAULT_ACCENT_HUE));
    expect(restoreButton).not.toBeInTheDocument();
    expect(hueReadout).toBeVisible();
  });

  describe('brand images', () => {
    it('restores a draft without its staged logo and asks to pick it again', async () => {
      const { unmount } = setupLookForm();
      await chooseEditorial(user);
      await pickLogo(user);
      unmount();

      setupLookForm();
      await clickRestoreChanges(user);
      await openLookRow(user, LOOK_ROW.BRAND);

      const editorialPreset = screen.getByRole('radio', { name: EDITORIAL });
      const uploadLogoButton = screen.getByRole('button', {
        name: UPLOAD_LOGO,
      });
      const repickNote = screen.getByText(
        messages.brandAssetField.logo.pickAgain,
      );
      expect(editorialPreset).toBeChecked();
      expect(uploadLogoButton).toBeVisible();
      expect(repickNote).toBeVisible();
    });
  });
});
