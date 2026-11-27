import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { LOOK_ROW } from '@platform/constants/look-row';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { screen, waitFor } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import {
  pickAndSaveLogo,
  pickLogo,
} from '@platform/testing/look/brand-image-interactions';
import {
  LOGO_HINT,
  EDIT_TAB,
  hueValue,
  NUDGED_ACCENT_HUE,
  PREVIEW_TAB,
} from '@platform/testing/look/look-form-fixtures';
import {
  nudgeAccentHue,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import {
  prepareBrandImageForm,
  setupLookFormWithFailingUpload,
} from '@platform/testing/look/look-form-setup';
import { SAVE_CHANGES } from '@platform/testing/render-in-settings-form';
import { REPLACE_LOGO } from '@platform/testing/site-config/fixtures';
import type { UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/components/features/look/look-preview');

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const tUploadErrors = makeEnTranslator('uploadErrors');

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
          `${LOGO_HINT} ${LOGO_UPLOAD_FAILED}`,
        );
        expect(saveButton).toBeEnabled();
        expect(updateLookAction).not.toHaveBeenCalled();

        await openLookRow(user, LOOK_ROW.COLOUR);
        const hueReadout = screen.getByText(hueValue(NUDGED_ACCENT_HUE));
        expect(hueReadout).toBeVisible();
      });

      it('returns to the Edit tab and focuses the picker when saved from the Preview', async () => {
        await pickLogo(user);
        const previewTab = screen.getByRole('tab', { name: PREVIEW_TAB });
        await user.click(previewTab);
        await user.keyboard(USER_EVENT_KEY.CONTROL_S);

        const replaceLogoButton = await screen.findByRole('button', {
          name: REPLACE_LOGO,
        });
        const editTab = screen.getByRole('tab', { name: EDIT_TAB });
        await waitFor(() => {
          expect(replaceLogoButton).toHaveFocus();
        });
        expect(editTab).toHaveAttribute(ARIA_ATTRIBUTE.SELECTED, 'true');
      });
    });
  });
});
