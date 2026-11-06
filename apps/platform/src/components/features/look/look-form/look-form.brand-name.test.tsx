import { BRAND_NAME_MAX_LENGTH } from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { LOOK_ROW } from '@platform/constants/look-row';
import { SAMPLE_HEADER_TEST_ID } from '@platform/constants/sample-header';
import messages from '@platform/i18n/messages/en.json';
import { updateLookAction } from '@platform/server/site-config/update-look-action';
import { screen } from '@platform/testing/custom-render';
import {
  clickSave,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { saveAndExpectLook } from '@platform/testing/look/look-form-save';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { MOCK_TENANT_NAME } from '@platform/testing/tenants/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

faker.seed(6759);

const { lookForm: LOOK_FORM } = messages;
const MOCK_BRAND_NAME = faker.company.name();
const TOO_LONG_BRAND_NAME = 'x'.repeat(BRAND_NAME_MAX_LENGTH + 1);
const BRAND_NAME_TOO_LONG = LOOK_FORM.brandNameTooLong.replace(
  '{max}',
  String(BRAND_NAME_MAX_LENGTH),
);

const brandNameInput = () =>
  screen.getByRole('textbox', {
    name: new RegExp(`^${LOOK_FORM.brandNameLabel}`),
  });

const previewHeader = () => screen.getByTestId(SAMPLE_HEADER_TEST_ID);

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(updateLookAction).mockReset();
  });

  describe('with no saved brand name', () => {
    beforeEach(async () => {
      setupLookForm();
      await openLookRow(user, LOOK_ROW.BRAND);
    });

    it('previews the tenant name', () => {
      expect(previewHeader()).toHaveTextContent(MOCK_TENANT_NAME);
    });

    it('previews the brand name as the owner types it', async () => {
      await user.type(brandNameInput(), MOCK_BRAND_NAME);

      expect(previewHeader()).toHaveTextContent(MOCK_BRAND_NAME);
      expect(previewHeader()).not.toHaveTextContent(MOCK_TENANT_NAME);
    });

    it('saves the brand name with the rest of the Look', async () => {
      await user.type(brandNameInput(), MOCK_BRAND_NAME);

      await saveAndExpectLook(user, { brandName: MOCK_BRAND_NAME });
    });

    describe('after typing a name over the limit', () => {
      beforeEach(async () => {
        await user.click(brandNameInput());
        await user.paste(TOO_LONG_BRAND_NAME);
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
      expect(previewHeader()).toHaveTextContent(MOCK_BRAND_NAME);
    });

    it('falls back to the tenant name once the field is cleared', async () => {
      await user.clear(brandNameInput());

      expect(previewHeader()).toHaveTextContent(MOCK_TENANT_NAME);
    });

    it('saves a cleared brand name as blank', async () => {
      await user.clear(brandNameInput());

      await saveAndExpectLook(user, { brandName: '' });
    });
  });
});
