import { ACTION_OUTCOME } from '@blog/config';
import { LOOK_EDIT_PANEL_TEST_ID } from '@platform/constants/look-form';
import messages from '@platform/i18n/messages/en.json';
import { clearBrandAssetAction } from '@platform/server/site-config/clear-brand-asset-action';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import type { TUploadResult } from '@platform/server/uploads/upload-error';
import { screen, waitFor } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  DISCARD,
  hueValue,
  NUDGED_ACCENT_HUE,
  savedLookValues,
  SAVING,
} from '@platform/testing/look/look-form-fixtures';
import {
  clickSave,
  nudgeAccentHue,
  pickAndSaveLogo,
  pickLogo,
  stageAssetRemoval,
} from '@platform/testing/look/look-form-interactions';
import {
  setupLookForm,
  setupWithSavedLogo,
} from '@platform/testing/look/look-form-setup';
import {
  ALL_CHANGES_SAVED,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  CURRENT_LOGO,
  MOCK_LOGO_URL,
  MOCK_STAGED_LOGO_BLOB_URL,
  MOCK_UPLOADED_LOGO_URL,
} from '@platform/testing/site-config/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

const tSaveBar = makeEnTranslator('saveBar');

const optimizedImageSrc = (url: string) =>
  `/_next/image?url=${encodeURIComponent(url)}&w=3840&q=75`;

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(uploadBrandAssetAction).mockReset();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('brand images', () => {
    describe('with a picked logo', () => {
      beforeEach(async () => {
        setupLookForm();
        await pickLogo(user);
      });

      it('stages a picked logo as an unsaved change without uploading it', () => {
        const brandHeading = screen.getByRole('heading', {
          name: `${LOOK_FORM.brandHeading}${UNSAVED_CHANGES}`,
        });
        const logo = screen.getByAltText(CURRENT_LOGO);

        expect(brandHeading).toBeVisible();
        expect(logo).toHaveAttribute('src', MOCK_STAGED_LOGO_BLOB_URL);
        expect(uploadBrandAssetAction).not.toHaveBeenCalled();
      });

      it('marks only the logo field as unsaved, beside its optional tag', () => {
        const logoGroup = screen.getByRole('group', {
          name: `${LOOK_FORM.logoFieldLabel} ${LOOK_FORM.optionalTag} ${LOOK_FORM.fieldUnsavedLabel}`,
        });
        const faviconGroup = screen.getByRole('group', {
          name: `${LOOK_FORM.faviconFieldLabel} ${LOOK_FORM.optionalTag}`,
        });

        expect(logoGroup).toBeVisible();
        expect(faviconGroup).toBeVisible();
      });

      it('uploads a staged logo on Save, then saves the rest of the look', async () => {
        await clickSave(user);

        const savedNote = await screen.findByText(ALL_CHANGES_SAVED);
        const logo = screen.getByAltText(CURRENT_LOGO);
        const [uploadCall] = vi.mocked(uploadBrandAssetAction).mock.calls;
        const [uploadTenantId, uploadKind, uploadForm] = uploadCall ?? [];
        expect(savedNote).toBeVisible();
        expect(uploadBrandAssetAction).toHaveBeenCalledTimes(1);
        expect(uploadTenantId).toBe(MOCK_TENANT_ID);
        expect(uploadKind).toBe('logo');
        expect(uploadForm).toBeInstanceOf(FormData);
        expect(updateLookAction).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          savedLookValues(),
        );
        expect(logo).toHaveAttribute(
          'src',
          optimizedImageSrc(MOCK_UPLOADED_LOGO_URL),
        );
      });
    });

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
