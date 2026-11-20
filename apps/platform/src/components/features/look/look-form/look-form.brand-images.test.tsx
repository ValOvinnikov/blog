import { LOOK_FIELD_LABEL_TEST_ID } from '@platform/constants/look-form';
import messages from '@platform/i18n/messages/en.json';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { uploadBrandAssetAction } from '@platform/server/site-config/upload-brand-asset-action';
import { screen } from '@platform/testing/custom-render';
import { savedLookValues } from '@platform/testing/look/look-form-fixtures';
import {
  clickSave,
  pickLogo,
} from '@platform/testing/look/look-form-interactions';
import {
  prepareBrandImageForm,
  setupLookForm,
} from '@platform/testing/look/look-form-setup';
import { optimizedImageSrc } from '@platform/testing/next-image';
import {
  ALL_CHANGES_SAVED,
  UNSAVED_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  CURRENT_LOGO,
  MOCK_STAGED_LOGO_BLOB_URL,
  MOCK_UPLOADED_LOGO_URL,
} from '@platform/testing/site-config/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import type { UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/components/features/look/look-preview');

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = prepareBrandImageForm();
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

      it('keeps the optional tag and unsaved marker out of the label focus returns to', () => {
        const focusTargetTexts = screen
          .getAllByTestId(LOOK_FIELD_LABEL_TEST_ID)
          .map(({ textContent }) => textContent);

        expect(focusTargetTexts).toContain(LOOK_FORM.logoFieldLabel);
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
  });
});
