import { EMAIL_TEMPLATE_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import en from '@platform/i18n/messages/en.json';
import { sendTestEmailAction } from '@platform/server/email/send-test-email-action';
import { screen } from '@platform/testing/custom-render';
import { SEND_TEST_TO_ME } from '@platform/testing/email/fixtures';
import {
  mockEmailDraft,
  MOCK_EMAIL_DRAFT_SUBJECT,
} from '@platform/testing/email-draft';
import { customRenderInSettingsForm } from '@platform/testing/render-in-settings-form';
import { MOCK_TENANT_EMAIL_BRAND } from '@platform/testing/tenant-email-brand';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';

import { EmailPreviewPane } from './email-preview-pane';

vi.mock('@platform/server/email/send-test-email-action');

const { EN } = LOCALE_ISO_CODES;
const { MAGIC_LINK } = EMAIL_TEMPLATE_TYPE;

const setup = customRenderInSettingsForm(EmailPreviewPane, {
  tenantId: MOCK_TENANT_ID,
  draft: mockEmailDraft(),
  templateType: MAGIC_LINK,
  locale: EN,
  defaultLocale: EN,
  brand: MOCK_TENANT_EMAIL_BRAND,
  brandName: MOCK_TENANT_NAME,
});

describe(`<${EmailPreviewPane.name}/>`, () => {
  it("previews the template's subject in the chosen language", () => {
    setup();

    const previewRegion = screen.getByRole('region', {
      name: en.emailPreview.heading,
    });

    expect(previewRegion).toHaveTextContent(MOCK_EMAIL_DRAFT_SUBJECT);
  });

  it('sends the previewed template as a test', async () => {
    const user = userEvent.setup();
    setup();

    const sendTestButton = screen.getByRole('button', {
      name: SEND_TEST_TO_ME,
    });
    await user.click(sendTestButton);

    expect(sendTestEmailAction).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      expect.objectContaining({
        templateType: MAGIC_LINK,
        copy: expect.objectContaining({ subject: MOCK_EMAIL_DRAFT_SUBJECT }),
      }),
    );
  });
});
