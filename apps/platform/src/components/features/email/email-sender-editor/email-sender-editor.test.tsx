import { EMAIL_SENDER_FIELD_ERROR } from '@platform/constants/email-sender';
import { screen } from '@platform/testing/custom-render';
import {
  ARCHIVED_NOTICE_TEXT,
  customRenderInSettingsForm,
} from '@platform/testing/render-in-settings-form';
import userEvent from '@testing-library/user-event';

import { EmailSenderEditor } from './email-sender-editor';

const SENDER = {
  senderName: 'Acme',
  replyToAddress: '',
  footerPostalAddress: '',
  contactRecipient: '',
};

const setup = customRenderInSettingsForm(EmailSenderEditor, {
  sender: SENDER,
  logo: { url: undefined },
  onSenderChange: vi.fn(),
  onLogoStage: vi.fn(),
  fieldIds: {
    senderName: 'sender-name',
    contactRecipient: 'contact-recipient',
  },
});

describe(`<${EmailSenderEditor.name}/>`, () => {
  it('is titled like the item that opens it', () => {
    setup();

    expect(
      screen.getByRole('heading', { name: 'Sender & footer' }),
    ).toBeVisible();
  });

  it('reports an edited field with the rest of the sender unchanged', async () => {
    const onSenderChange = vi.fn();
    setup({ onSenderChange });

    await userEvent
      .setup()
      .type(screen.getByLabelText('Reply-to address'), 'h');

    expect(onSenderChange).toHaveBeenCalledWith({
      ...SENDER,
      replyToAddress: 'h',
    });
  });

  it('shows what a blank sender name and reply-to address send', () => {
    setup({ sender: { ...SENDER, senderName: '' } });

    expect(screen.getByLabelText('Sender name')).toHaveAttribute(
      'placeholder',
      'Default sender',
    );
    expect(screen.getByLabelText('Reply-to address')).toHaveAttribute(
      'placeholder',
      'No reply-to address',
    );
  });

  it('shows a sender-name error against the field', () => {
    setup({
      fieldErrors: {
        senderName: { reason: EMAIL_SENDER_FIELD_ERROR.SENDER_NAME_INVALID },
      },
    });

    expect(screen.getByLabelText('Sender name')).toHaveAccessibleDescription(
      expect.stringContaining('not an email address'),
    );
  });

  it('reports an edited contact recipient with the rest of the sender unchanged', async () => {
    const onSenderChange = vi.fn();
    setup({ onSenderChange });

    await userEvent
      .setup()
      .type(screen.getByLabelText('Send contact messages to'), 'a');

    expect(onSenderChange).toHaveBeenCalledWith({
      ...SENDER,
      contactRecipient: 'a',
    });
  });

  it('leaves the contact recipient out when the plan has no contact form', () => {
    setup({ sender: { ...SENDER, contactRecipient: undefined } });

    expect(
      screen.queryByLabelText('Send contact messages to'),
    ).not.toBeInTheDocument();
  });

  it('shows a contact-recipient error against the field', () => {
    setup({
      fieldErrors: {
        contactRecipient: {
          reason: EMAIL_SENDER_FIELD_ERROR.CONTACT_RECIPIENT_INVALID,
        },
      },
    });

    expect(
      screen.getByLabelText('Send contact messages to'),
    ).toHaveAccessibleDescription(
      expect.stringContaining('Enter a valid email address'),
    );
  });

  it('locks every field and describes it with the notice while archived', () => {
    setup({}, { isArchived: true });

    const fields = [
      screen.getByLabelText('Sender name'),
      screen.getByLabelText('Footer postal address'),
      screen.getByRole('button', { name: 'Upload email logo' }),
    ];
    for (const field of fields) {
      expect(field).toBeDisabled();
      expect(field).toHaveAccessibleDescription(
        expect.stringContaining(ARCHIVED_NOTICE_TEXT),
      );
    }
  });

  it('locks every field while a save is pending', () => {
    setup({}, { isPending: true });

    expect(screen.getByLabelText('Sender name')).toBeDisabled();
    expect(screen.getByLabelText('Footer postal address')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Upload email logo' }),
    ).toBeDisabled();
  });
});
