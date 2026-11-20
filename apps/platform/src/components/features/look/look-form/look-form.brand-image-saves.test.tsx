import { LOOK_EDIT_PANEL_TEST_ID } from '@platform/constants/look-form';
import { clearBrandAssetAction } from '@platform/server/site-config/clear-brand-asset-action';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import type { TUploadResult } from '@platform/server/uploads/upload-error';
import { screen, waitFor } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  DISCARD,
  hueValue,
  NUDGED_ACCENT_HUE,
} from '@platform/testing/look/look-form-fixtures';
import {
  clickSave,
  nudgeAccentHue,
  pickAndSaveLogo,
  pickLogo,
  stageAssetRemoval,
} from '@platform/testing/look/look-form-interactions';
import {
  prepareBrandImageForm,
  setupLookForm,
  setupWithSavedLogo,
} from '@platform/testing/look/look-form-setup';
import { optimizedImageSrc } from '@platform/testing/next-image';
import {
  ALL_CHANGES_SAVED,
  UNSAVED_CHANGES,
  SAVING,
} from '@platform/testing/render-in-settings-form';
import {
  CURRENT_LOGO,
  MOCK_LOGO_URL,
  MOCK_UPLOADED_LOGO_URL,
} from '@platform/testing/site-config/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import type { UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/components/features/look/look-preview');

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const tSaveBar = makeEnTranslator('saveBar');

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = prepareBrandImageForm();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('brand images', () => {
    describe('while the logo upload is pending', () => {
      let resolveUpload: (value: TUploadResult) => void = () => {};

      beforeEach(async () => {
        vi.mocked(uploadBrandAssetAction).mockImplementationOnce(
          () =>
            new Promise((resolve) => {
              resolveUpload = resolve;
            }),
        );
        setupLookForm();
        await pickAndSaveLogo(user);
      });

      const resolveUploadSuccessfully = () => {
        resolveUpload({
          outcome: ACTION_OUTCOME.SUCCESS,
          url: MOCK_UPLOADED_LOGO_URL,
        });
      };

      it('locks the edit panel while a save is running', async () => {
        const lockedPanel = await screen.findByTestId(LOOK_EDIT_PANEL_TEST_ID);
        expect(lockedPanel).toHaveAttribute('inert');

        resolveUploadSuccessfully();

        await waitFor(() => {
          const editPanel = screen.getByTestId(LOOK_EDIT_PANEL_TEST_ID);
          expect(editPanel).not.toHaveAttribute('inert');
        });
      });

      it('keeps an edit made while the logo uploads as an unsaved change', async () => {
        await screen.findByRole('button', { name: SAVING });
        await nudgeAccentHue(user);
        resolveUploadSuccessfully();

        await waitFor(() => {
          const unsavedRegion = screen.getByRole('region', {
            name: UNSAVED_CHANGES,
          });
          expect(unsavedRegion).toHaveTextContent(
            tSaveBar('unsavedChanges', { count: 1 }),
          );
        });
        const hueReadout = screen.getByText(hueValue(NUDGED_ACCENT_HUE));
        const logo = screen.getByAltText(CURRENT_LOGO);
        expect(hueReadout).toBeVisible();
        expect(logo).toHaveAttribute(
          'src',
          optimizedImageSrc(MOCK_UPLOADED_LOGO_URL),
        );
      });
    });

    describe('with a saved logo', () => {
      beforeEach(() => {
        setupWithSavedLogo();
      });

      it('clears a staged removal on Save', async () => {
        await stageAssetRemoval(user);
        expect(clearBrandAssetAction).not.toHaveBeenCalled();

        await clickSave(user);

        await waitFor(() => {
          expect(clearBrandAssetAction).toHaveBeenCalledWith(
            MOCK_TENANT_ID,
            'logo',
          );
        });
      });

      it('drops a staged logo on Discard, keeping the saved one', async () => {
        await pickLogo(user);
        const discardButton = screen.getByRole('button', { name: DISCARD });
        await user.click(discardButton);

        const logo = screen.getByAltText(CURRENT_LOGO);
        const savedNote = screen.queryByText(ALL_CHANGES_SAVED);
        expect(logo).toHaveAttribute('src', optimizedImageSrc(MOCK_LOGO_URL));
        expect(savedNote).not.toBeInTheDocument();
        expect(uploadBrandAssetAction).not.toHaveBeenCalled();
      });
    });
  });
});
