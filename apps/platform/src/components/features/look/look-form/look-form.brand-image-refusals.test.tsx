import { UPLOAD_REFUSAL } from '@platform/constants/upload';
import { clearBrandAssetAction } from '@platform/server/site-config/clear-brand-asset-action';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import { screen, waitFor } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import {
  findLogoPickerWithError,
  pickAndSaveLogo,
  stageAssetRemoval,
} from '@platform/testing/look/brand-image-interactions';
import {
  FAVICON_HINT,
  UPLOAD_FAVICON,
} from '@platform/testing/look/look-form-fixtures';
import { clickSave } from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { MOCK_LOGO_URL } from '@platform/testing/site-config/fixtures';
import { stubStagedImageUrl } from '@platform/testing/staged-image';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { ACTION_OUTCOME } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const tUploadErrors = makeEnTranslator('uploadErrors');

const FAVICON_REMOVE_FAILED = tUploadErrors('removeFailed', {
  kind: 'favicon',
});

const MOCK_UPLOAD_LIMIT = '4 MB';

const LOGO_TOO_LARGE = tUploadErrors('fileTooLarge', {
  limit: MOCK_UPLOAD_LIMIT,
});

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    stubStagedImageUrl();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('brand images', () => {
    it('fails the save with the refusal message when the upload is refused', async () => {
      vi.mocked(uploadBrandAssetAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.REFUSED,
        reason: UPLOAD_REFUSAL.FILE_TOO_LARGE,
        values: { limit: MOCK_UPLOAD_LIMIT },
      });
      setupLookForm();

      await pickAndSaveLogo(user);

      await findLogoPickerWithError(LOGO_TOO_LARGE);
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
        `${FAVICON_HINT} ${FAVICON_REMOVE_FAILED}`,
      );
    });
  });
});
