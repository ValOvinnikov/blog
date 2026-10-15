import { PREVIEW_WIDTH } from '@platform/constants/preview';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { EmailPreview } from './email-preview';

const setup = customRender(EmailPreview, {
  html: '<p>Bonjour</p>',
  sender: {
    senderName: 'Acme Co',
    replyToAddress: 'hello@acme.example',
    footerPostalAddress: '',
    contactRecipient: '',
  },
  subject: 'Connexion',
});

describe(`<${EmailPreview.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows who the email is from, where replies go and its subject', () => {
    setup();

    expect(screen.getByText('Acme Co')).toBeVisible();
    expect(screen.getByText('hello@acme.example')).toBeVisible();
    expect(screen.getByText('Connexion')).toBeVisible();
  });

  it('names the defaults when the sender and reply-to are blank', () => {
    setup({
      sender: {
        senderName: '  ',
        replyToAddress: '',
        footerPostalAddress: '',
        contactRecipient: '',
      },
    });

    expect(screen.getByText('Default sender')).toBeVisible();
    expect(screen.getByText('No reply-to address')).toBeVisible();
  });

  it('switches the preview between desktop and mobile widths', async () => {
    setup();
    const frame = screen.getByTitle('Email preview');
    expect(frame).toHaveAttribute('data-width', PREVIEW_WIDTH.DESKTOP);

    await user.click(screen.getByRole('button', { name: 'Mobile' }));

    expect(frame).toHaveAttribute('data-width', PREVIEW_WIDTH.MOBILE);
  });

  it('shows the actions and notes it is given', () => {
    setup({
      actions: <button type="button">Send</button>,
      notes: <p>A note</p>,
    });

    expect(screen.getByRole('button', { name: 'Send' })).toBeVisible();
    expect(screen.getByText('A note')).toBeVisible();
  });
});
