import { LOOK_ROW } from '@platform/constants/look-row';
import {
  brandNameInput,
  MOCK_BRAND_NAME,
  previewHeader,
} from '@platform/testing/look/look-brand-name';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import { saveAndExpectLook } from '@platform/testing/look/look-form-save';
import {
  setupArchived,
  setupLookForm,
} from '@platform/testing/look/look-form-setup';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('disables the brand name on an archived site', async () => {
    setupArchived();
    await openLookRow(user, LOOK_ROW.BRAND);

    const input = brandNameInput();

    expect(input).toBeDisabled();
  });

  describe('with a saved brand name', () => {
    beforeEach(async () => {
      setupLookForm({
        initialValues: {
          ...defaultLookFormValues(),
          brandName: MOCK_BRAND_NAME,
        },
      });
      await openLookRow(user, LOOK_ROW.BRAND);
    });

    it('previews the saved brand name', () => {
      const header = previewHeader();

      expect(header).toHaveTextContent(MOCK_BRAND_NAME);
    });

    describe('once the field is cleared', () => {
      beforeEach(async () => {
        await user.clear(brandNameInput());
      });

      it('falls back to the tenant name', () => {
        const header = previewHeader();

        expect(header).toHaveTextContent(MOCK_TENANT_NAME);
      });

      it('saves the brand name as blank', async () => {
        await saveAndExpectLook(user, { brandName: '' });
      });
    });
  });
});
