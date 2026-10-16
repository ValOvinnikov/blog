import userEvent, { type UserEvent } from '@testing-library/user-event';
import { customRender, screen } from '@web/testing/custom-render';

import { ContactForm } from './contact-form';

const { submitContactMessageMock } = vi.hoisted(() => ({
  submitContactMessageMock: vi.fn(),
}));

vi.mock(
  '@web/server/contact-form/contact-form-actions/contact-form-actions',
  () => ({ submitContactMessage: submitContactMessageMock }),
);

vi.mock('next/navigation', () => ({ usePathname: () => '/en/contact' }));

const SUCCESS_MESSAGE = "Thanks, we'll reply within a working day.";
const MESSAGE = 'Could we talk about the relaunch next week?';

const setup = customRender(ContactForm, { successMessage: SUCCESS_MESSAGE });

const fillAndSend = async (user: UserEvent) => {
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'Priya Nair');
  await user.type(
    screen.getByRole('textbox', { name: 'Email' }),
    'priya@example.com',
  );
  await user.type(screen.getByRole('textbox', { name: 'Message' }), MESSAGE);
  await user.click(screen.getByRole('button', { name: 'Send message' }));
};

describe(`<${ContactForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('sends the typed message with the page it was sent from', async () => {
    submitContactMessageMock.mockResolvedValue({ outcome: 'sent' });
    setup();

    await fillAndSend(user);

    expect(submitContactMessageMock).toHaveBeenCalledWith({
      name: 'Priya Nair',
      email: 'priya@example.com',
      message: MESSAGE,
      website: '',
      sourcePath: '/en/contact',
    });
  });

  it('replaces the form with the success message once sent', async () => {
    submitContactMessageMock.mockResolvedValue({ outcome: 'sent' });
    setup();

    await fillAndSend(user);

    expect(await screen.findByRole('status')).toHaveTextContent(
      SUCCESS_MESSAGE,
    );
    expect(screen.getByRole('heading', { name: 'Message sent' })).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Send message' }),
    ).not.toBeInTheDocument();
  });

  it('shows the error and keeps what the visitor typed when the send fails', async () => {
    submitContactMessageMock.mockResolvedValue({ outcome: 'server-error' });
    setup();

    await fillAndSend(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Your message couldn't be sent.",
    );
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Priya Nair',
    );
    expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue(
      MESSAGE,
    );
  });

  it('shows the rate-limit message and keeps the input when the send is blocked', async () => {
    submitContactMessageMock.mockResolvedValue({ outcome: 'blocked' });
    setup();

    await fillAndSend(user);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Too many attempts.',
    );
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue(
      'priya@example.com',
    );
  });

  it('names each invalid field without sending', async () => {
    setup();

    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hi');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(
      screen.getByRole('textbox', { name: 'Name' }),
    ).toHaveAccessibleDescription('Enter your name, up to 100 characters.');
    expect(
      screen.getByRole('textbox', { name: 'Email' }),
    ).toHaveAccessibleDescription('Enter a valid email address.');
    expect(
      screen.getByRole('textbox', { name: 'Message' }),
    ).toHaveAccessibleDescription('Write a message of 10 to 5,000 characters.');
    expect(submitContactMessageMock).not.toHaveBeenCalled();
  });

  it('shows the field errors the server returns', async () => {
    submitContactMessageMock.mockResolvedValue({
      outcome: 'invalid',
      invalidFields: ['email'],
    });
    setup();

    await fillAndSend(user);

    expect(
      await screen.findByText('Enter a valid email address.'),
    ).toBeVisible();
  });

  it('renders the privacy note under the send button', () => {
    setup({ privacyNote: 'We only use your details to reply.' });

    expect(
      screen.getByText('We only use your details to reply.'),
    ).toBeVisible();
  });
});
