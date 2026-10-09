import { customRender, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { EmailSenderEditor } from './email-sender-editor';

const SENDER = {
  senderName: 'Acme',
  replyToAddress: '',
  footerPostalAddress: '',
};

const setup = customRender(EmailSenderEditor, {
  sender: SENDER,
  logo: { url: undefined },
  onSenderChange: vi.fn(),
  onLogoStage: vi.fn(),
  isDisabled: false,
});

describe(`<${EmailSenderEditor.name}/>`, () => {
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

  it('shows a sender-name error against the field', () => {
    setup({ senderNameError: 'Enter a name.' });

    expect(screen.getByLabelText('Sender name')).toHaveAccessibleDescription(
      'The display name on the From address — unrelated to the site title. Enter a name.',
    );
  });

  it('locks every field while disabled', () => {
    setup({ isDisabled: true });

    expect(screen.getByLabelText('Sender name')).toBeDisabled();
    expect(screen.getByLabelText('Footer postal address')).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Upload email logo' }),
    ).toBeDisabled();
  });
});
