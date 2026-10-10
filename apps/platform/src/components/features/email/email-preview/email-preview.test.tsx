import { PREVIEW_WIDTH } from '@platform/constants/preview';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { EmailPreview } from './email-preview';

const setup = customRender(EmailPreview, {
  html: '<p>Bonjour</p>',
  from: 'Acme Co',
  replyTo: 'hello@acme.example',
  subject: 'Connexion',
  onSendTest: vi.fn(),
  isSendingTest: false,
  isSendTestDisabled: false,
  hasUnsavedLogo: false,
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

  it('names the defaults when no sender or reply-to is set', () => {
    setup({ from: undefined, replyTo: undefined });

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

  it('sends a test on request', async () => {
    const onSendTest = vi.fn();
    setup({ onSendTest });

    await user.click(screen.getByRole('button', { name: 'Send test to me' }));

    expect(onSendTest).toHaveBeenCalledOnce();
  });

  it('says a staged logo is left out of the test', () => {
    setup({ hasUnsavedLogo: true });

    expect(
      screen.getByText(/A logo you haven't saved yet isn't included/),
    ).toBeVisible();
  });
});
