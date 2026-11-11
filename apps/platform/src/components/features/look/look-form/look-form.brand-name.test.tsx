import { BRAND_NAME_MAX_LENGTH } from '@blog/db/constants';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { screen } from '@platform/testing/custom-render';
import {
  brandNameInput,
  enterBrandName,
  MOCK_BRAND_NAME,
  previewHeader,
} from '@platform/testing/look/look-brand-name';
import {
  clickSave,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { saveAndExpectLook } from '@platform/testing/look/look-form-save';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;
const TOO_LONG_BRAND_NAME = 'x'.repeat(BRAND_NAME_MAX_LENGTH + 1);
const BRAND_NAME_TOO_LONG = LOOK_FORM.brandNameTooLong.replace(
  '{max}',
  String(BRAND_NAME_MAX_LENGTH),
);
const UNSAVED_BRAND_NAME = `${LOOK_FORM.brandNameLabel} ${LOOK_FORM.fieldUnsavedLabel}`;

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(async () => {
    user = userEvent.setup();
    setupLookForm();
    await openLookRow(user, LOOK_ROW.BRAND);
  });

  it('previews the tenant name when no brand name is saved', () => {
    const header = previewHeader();

    expect(header).toHaveTextContent(MOCK_TENANT_NAME);
  });

  describe('once the owner enters a brand name', () => {
    beforeEach(async () => {
      await enterBrandName(user, MOCK_BRAND_NAME);
    });

    it('previews it in place of the tenant name', () => {
      const header = previewHeader();

      expect(header).toHaveTextContent(MOCK_BRAND_NAME);
      expect(header).not.toHaveTextContent(MOCK_TENANT_NAME);
    });

    it('marks the field with an unsaved dot', () => {
      const unsavedInput = screen.getByRole('textbox', {
        name: UNSAVED_BRAND_NAME,
      });

      expect(unsavedInput).toHaveValue(MOCK_BRAND_NAME);
    });

    it('saves it with the rest of the Look', async () => {
      await saveAndExpectLook(user, { brandName: MOCK_BRAND_NAME });
    });
  });

  describe('after entering a name over the limit', () => {
    beforeEach(async () => {
      await enterBrandName(user, TOO_LONG_BRAND_NAME);
    });

    it('shows a field error', () => {
      const error = screen.getByText(BRAND_NAME_TOO_LONG);
      const input = brandNameInput();

      expect(error).toBeVisible();
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('refuses to save', async () => {
      await clickSave(user);

      expect(updateLookAction).not.toHaveBeenCalled();
    });
  });
});
