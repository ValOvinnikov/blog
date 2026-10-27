import { faker } from '@faker-js/faker';
import { EMAIL_SENDER_FIELD_ERROR } from '@platform/constants/email-sender';
import en from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import {
  mockEmailSender,
  MOCK_SENDER_FIELD_IDS,
} from '@platform/testing/email-draft';
import {
  ARCHIVED_NOTICE_TEXT,
  customRenderInSettingsForm,
} from '@platform/testing/render-in-settings-form';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { EmailSenderEditor } from './email-sender-editor';

faker.seed(5993);

const {
  senderNameLabel,
  senderNameHint,
  replyToLabel,
  footerAddressLabel,
  footerAddressHint,
  logoHint,
  contactRecipientLabel,
  contactRecipientHint,
  errors,
} = en.emailSettingsForm;
const { defaultSender, noReplyTo } = en.emailPreview;
const UPLOAD_EMAIL_LOGO = en.assetUploadField.SENDER.upload;

const MOCK_SENDER = mockEmailSender({ senderName: faker.company.name() });
const MOCK_TYPED_CHARACTER = faker.string.alpha();

const onSenderChange = vi.fn();

const setup = customRenderInSettingsForm(EmailSenderEditor, {
  sender: MOCK_SENDER,
  logo: { url: undefined },
  onSenderChange,
  onLogoStage: vi.fn(),
  fieldIds: MOCK_SENDER_FIELD_IDS,
});

describe(`<${EmailSenderEditor.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('is titled like the item that opens it', () => {
    setup();

    const heading = screen.getByRole('heading', {
      name: en.emailForm.senderItemLabel,
    });

    expect(heading).toBeVisible();
  });

  it.each([
    { label: replyToLabel, field: 'replyToAddress' },
    { label: contactRecipientLabel, field: 'contactRecipient' },
  ])(
    'reports an edited $field with the rest of the sender unchanged',
    async ({ label, field }) => {
      setup();

      const input = screen.getByLabelText(label);
      await user.type(input, MOCK_TYPED_CHARACTER);

      expect(onSenderChange).toHaveBeenCalledWith({
        ...MOCK_SENDER,
        [field]: MOCK_TYPED_CHARACTER,
      });
    },
  );

  it('shows what a blank sender name and reply-to address send', () => {
    setup({ sender: mockEmailSender() });

    const senderNameInput = screen.getByLabelText(senderNameLabel);
    const replyToInput = screen.getByLabelText(replyToLabel);

    expect(senderNameInput).toHaveAttribute('placeholder', defaultSender);
    expect(replyToInput).toHaveAttribute('placeholder', noReplyTo);
  });

  it.each([
    {
      label: senderNameLabel,
      fieldErrors: {
        senderName: { reason: EMAIL_SENDER_FIELD_ERROR.SENDER_NAME_INVALID },
      },
      description: `${senderNameHint} ${errors.senderNameInvalid}`,
    },
    {
      label: contactRecipientLabel,
      fieldErrors: {
        contactRecipient: {
          reason: EMAIL_SENDER_FIELD_ERROR.CONTACT_RECIPIENT_INVALID,
        },
      },
      description: `${contactRecipientHint} ${errors.contactRecipientInvalid}`,
    },
  ])(
    'shows the error a save returns against $label',
    ({ label, fieldErrors, description }) => {
      setup({ fieldErrors });

      const input = screen.getByLabelText(label);

      expect(input).toHaveAccessibleDescription(description);
    },
  );

  it('leaves the contact recipient out when the plan has no contact form', () => {
    setup({ sender: mockEmailSender({ contactRecipient: undefined }) });

    const contactRecipientInput = screen.queryByLabelText(
      contactRecipientLabel,
    );

    expect(contactRecipientInput).not.toBeInTheDocument();
  });

  it.each([
    { state: 'archived', formState: { isArchived: true } },
    { state: 'pending', formState: { isPending: true } },
  ])('locks every field while $state', ({ formState }) => {
    setup({}, formState);

    const senderNameInput = screen.getByLabelText(senderNameLabel);
    const footerAddressInput = screen.getByLabelText(footerAddressLabel);
    const uploadButton = screen.getByRole('button', {
      name: UPLOAD_EMAIL_LOGO,
    });

    expect(senderNameInput).toBeDisabled();
    expect(footerAddressInput).toBeDisabled();
    expect(uploadButton).toBeDisabled();
  });

  it.each([
    { label: senderNameLabel, hint: senderNameHint },
    { label: footerAddressLabel, hint: footerAddressHint },
  ])('describes $label with the notice while archived', ({ label, hint }) => {
    setup({}, { isArchived: true });

    const input = screen.getByLabelText(label);

    expect(input).toHaveAccessibleDescription(
      `${ARCHIVED_NOTICE_TEXT} ${hint}`,
    );
  });

  it('describes the logo upload with the notice while archived', () => {
    setup({}, { isArchived: true });

    const uploadButton = screen.getByRole('button', {
      name: UPLOAD_EMAIL_LOGO,
    });

    expect(uploadButton).toHaveAccessibleDescription(
      `${logoHint} ${ARCHIVED_NOTICE_TEXT}`,
    );
  });
});
