import { screen, waitFor } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  findLogoPickerWithError,
  pickAndSaveLogo,
  pickLogo,
} from '@platform/testing/look/brand-image-interactions';
import { BRAND_IMAGES_HINT } from '@platform/testing/look/look-form-fixtures';
import { clickGoToTheFirstOne } from '@platform/testing/look/look-form-interactions';
import {
  prepareBrandImageForm,
  setupLookFormWithFailingUpload,
} from '@platform/testing/look/look-form-setup';
import {
  GO_TO_THE_FIRST_ONE,
  ONE_FIELD_NEEDS_ATTENTION,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import { REPLACE_LOGO } from '@platform/testing/site-config/fixtures';
import type { UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/components/features/look/look-preview');

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const tUploadErrors = makeEnTranslator('uploadErrors');

const tSaveBar = makeEnTranslator('saveBar');

const LOGO_UPLOAD_FAILED = tUploadErrors('uploadFailed', { kind: 'logo' });

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = prepareBrandImageForm();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('brand images', () => {
    describe('when the upload fails', () => {
      beforeEach(() => {
        setupLookFormWithFailingUpload();
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
          expect(saveBar).toHaveTextContent(ONE_FIELD_NEEDS_ATTENTION);

          await clickGoToTheFirstOne(user);

          const replaceLogoButton = screen.getByRole('button', {
            name: REPLACE_LOGO,
          });
          expect(replaceLogoButton).toHaveFocus();
        });

        it('keeps the upload message on the picker, with no page alert', async () => {
          await findLogoPickerWithError(LOGO_UPLOAD_FAILED);

          const alert = screen.queryByRole('alert');

          expect(alert).not.toBeInTheDocument();
        });

        it('clears the picker error once a new logo is picked', async () => {
          const replaceLogoButton =
            await findLogoPickerWithError(LOGO_UPLOAD_FAILED);
          await pickLogo(user);

          const attentionLink = screen.queryByRole('link', {
            name: GO_TO_THE_FIRST_ONE,
          });
          expect(replaceLogoButton).toHaveAccessibleDescription(
            BRAND_IMAGES_HINT,
          );
          expect(attentionLink).not.toBeInTheDocument();
        });
      });
    });
  });
});
