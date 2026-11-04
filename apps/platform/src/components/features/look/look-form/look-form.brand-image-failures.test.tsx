import { ACTION_OUTCOME } from '@blog/config';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import { screen, waitFor } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  hueValue,
  NUDGED_ACCENT_HUE,
} from '@platform/testing/look/look-form-fixtures';
import {
  clickGoToTheFirstOne,
  nudgeAccentHue,
  openLookRow,
  pickAndSaveLogo,
  pickLogo,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import {
  GO_TO_THE_FIRST_ONE,
  ONE_FIELD_NEEDS_ATTENTION,
  SAVE_CHANGES,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  MOCK_STAGED_LOGO_BLOB_URL,
  REPLACE_LOGO,
} from '@platform/testing/site-config/fixtures';
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
  });
});
