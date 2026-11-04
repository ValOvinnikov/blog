import { ACTION_OUTCOME } from '@blog/config';
import { LOOK_ROW } from '@platform/constants/look-row';
import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import messages from '@platform/i18n/messages/en.json';
import { clearBrandAssetAction } from '@platform/server/site-config/clear-brand-asset-action';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import { screen, waitFor } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  hueValue,
  NUDGED_ACCENT_HUE,
  UPLOAD_FAVICON,
} from '@platform/testing/look/look-form-fixtures';
import {
  clickGoToTheFirstOne,
  clickSave,
  nudgeAccentHue,
  openLookRow,
  pickAndSaveLogo,
  pickLogo,
  stageAssetRemoval,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import {
  GO_TO_THE_FIRST_ONE,
  ONE_FIELD_NEEDS_ATTENTION,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  MOCK_LOGO_URL,
  MOCK_STAGED_LOGO_BLOB_URL,
  REPLACE_LOGO,
} from '@platform/testing/site-config/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

const tUploadErrors = makeEnTranslator('uploadErrors');

const tSaveBar = makeEnTranslator('saveBar');

const BRAND_IMAGES_HINT = LOOK_FORM.brandFieldsHint;

const LOGO_UPLOAD_FAILED = tUploadErrors('uploadFailed', { kind: 'logo' });

const FAVICON_REMOVE_FAILED = tUploadErrors('removeFailed', {
  kind: 'favicon',
});

const MOCK_UPLOAD_LIMIT = '4 MB';

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(uploadBrandAssetAction).mockReset();
    vi.mocked(clearBrandAssetAction).mockReset();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(MOCK_STAGED_LOGO_BLOB_URL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('brand images', () => {
    describe('when the upload fails', () => {
      beforeEach(() => {
        vi.mocked(uploadBrandAssetAction).mockResolvedValue({
          outcome: ACTION_OUTCOME.SERVER_ERROR,
        });
        setupLookForm();
      });

      it('fails the save on the logo picker and keeps the draft', async () => {
        await nudgeAccentHue(user);
        await pickAndSaveLogo(user);

        const replaceLogoButton = await screen.findByRole('button', {
          name: REPLACE_LOGO,
        });
        await waitFor(() => {
          expect(replaceLogoButton).toHaveFocus();
        });
        const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
        expect(replaceLogoButton).toHaveAccessibleDescription(
          `${BRAND_IMAGES_HINT} ${LOGO_UPLOAD_FAILED}`,
        );
        expect(saveButton).toBeEnabled();
        expect(updateLookAction).not.toHaveBeenCalled();

        await openLookRow(user, LOOK_ROW.COLOUR);
        const hueReadout = screen.getByText(hueValue(NUDGED_ACCENT_HUE));
        expect(hueReadout).toBeVisible();
      });

      describe('after saving a picked logo', () => {
        beforeEach(async () => {
          await pickAndSaveLogo(user);
        });

        it('says Not saved beside Save and links to the failed picker', async () => {
          const saveBar = await screen.findByRole('region', {
            name: UNSAVED_CHANGES,
          });
          await waitFor(() => {
            expect(saveBar).toHaveTextContent(tSaveBar('notSaved'));
          });
          const alert = screen.queryByRole('alert');
          expect(saveBar).toHaveTextContent(ONE_FIELD_NEEDS_ATTENTION);
          expect(alert).not.toBeInTheDocument();

          await clickGoToTheFirstOne(user);

          const replaceLogoButton = screen.getByRole('button', {
            name: REPLACE_LOGO,
          });
          expect(replaceLogoButton).toHaveFocus();
        });

        it('clears the picker error once a new logo is picked', async () => {
          await screen.findByText(LOGO_UPLOAD_FAILED);
          await pickLogo(user);

          const error = screen.queryByText(LOGO_UPLOAD_FAILED);
          const attentionLink = screen.queryByRole('link', {
            name: GO_TO_THE_FIRST_ONE,
          });
          expect(error).not.toBeInTheDocument();
          expect(attentionLink).not.toBeInTheDocument();
        });
      });
    });

    it('fails the save with the refusal message when the upload is refused', async () => {
      vi.mocked(uploadBrandAssetAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.FILE_TOO_LARGE,
        values: { limit: MOCK_UPLOAD_LIMIT },
      });
      setupLookForm();

      await pickAndSaveLogo(user);

      const error = await screen.findByText(
        tUploadErrors('fileTooLarge', { limit: MOCK_UPLOAD_LIMIT }),
      );
      expect(error).toBeVisible();
      expect(updateLookAction).not.toHaveBeenCalled();
    });

    it('fails the save with the remove message when clearing the favicon fails', async () => {
      vi.mocked(clearBrandAssetAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      setupLookForm({
        initialValues: {
          ...defaultLookFormValues(),
          favicon: { url: MOCK_LOGO_URL },
        },
      });

      await stageAssetRemoval(user);
      await clickSave(user);

      const uploadFaviconButton = await screen.findByRole('button', {
        name: UPLOAD_FAVICON,
      });
      await waitFor(() => {
        expect(uploadFaviconButton).toHaveFocus();
      });
      expect(uploadFaviconButton).toHaveAccessibleDescription(
        `${BRAND_IMAGES_HINT} ${FAVICON_REMOVE_FAILED}`,
      );
    });
  });
});
