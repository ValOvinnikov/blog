import { ACTION_OUTCOME } from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { customRender, screen } from '@web/testing/custom-render';
import { usePathname } from 'next/navigation';

import { ContactForm } from './contact-form';

const { submitContactMessageMock } = vi.hoisted(() => ({
  submitContactMessageMock: vi.fn(),
}));

vi.mock(
  '@web/server/contact-form/contact-form-actions/contact-form-actions',
  () => ({ submitContactMessage: submitContactMessageMock }),
);

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }));

const SUCCESS_MESSAGE = faker.lorem.sentence();
const NAME = faker.person.fullName();
const EMAIL = faker.internet.email();
const MESSAGE = faker.lorem.sentences(2);
const PRIVACY_NOTE = faker.lorem.sentence();
const PATHNAME = `/${faker.lorem.slug()}`;

const setup = customRender(ContactForm, { successMessage: SUCCESS_MESSAGE });

const fillAndSend = async (user: UserEvent) => {
  const nameField = screen.getByRole('textbox', { name: 'Name' });
  const emailField = screen.getByRole('textbox', { name: 'Email' });
  const messageField = screen.getByRole('textbox', { name: 'Message' });
  const sendButton = screen.getByRole('button', { name: 'Send message' });

  await user.type(nameField, NAME);
  await user.type(emailField, EMAIL);
  await user.type(messageField, MESSAGE);
  await user.click(sendButton);
};

describe(`<${ContactForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(usePathname).mockReturnValue(PATHNAME);
  });

  it('sends the typed message with the page it was sent from', async () => {
    submitContactMessageMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    setup();

    await fillAndSend(user);

    expect(submitContactMessageMock).toHaveBeenCalledWith({
      name: NAME,
      email: EMAIL,
      message: MESSAGE,
      website: '',
      sourcePath: PATHNAME,
    });
  });

  it('replaces the form with the success message once sent', async () => {
    submitContactMessageMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    setup();

    await fillAndSend(user);

    const status = await screen.findByRole('status');
    const heading = screen.getByRole('heading', { name: 'Message sent' });
    const sendButton = screen.queryByRole('button', { name: 'Send message' });

    expect(status).toHaveTextContent(SUCCESS_MESSAGE);
    expect(heading).toBeVisible();
    expect(sendButton).not.toBeInTheDocument();
  });

  it('shows the error and keeps what the visitor typed when the send fails', async () => {
    submitContactMessageMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setup();

    await fillAndSend(user);

    const alert = await screen.findByRole('alert');
    const nameField = screen.getByRole('textbox', { name: 'Name' });
    const messageField = screen.getByRole('textbox', { name: 'Message' });

    expect(alert).toHaveTextContent("Your message couldn't be sent.");
    expect(nameField).toHaveValue(NAME);
    expect(messageField).toHaveValue(MESSAGE);
  });

  it('shows the rate-limit message and keeps the input when blocked', async () => {
    submitContactMessageMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.BLOCKED,
    });
    setup();

    await fillAndSend(user);

    const alert = await screen.findByRole('alert');
    const emailField = screen.getByRole('textbox', { name: 'Email' });

    expect(alert).toHaveTextContent('Too many attempts.');
    expect(emailField).toHaveValue(EMAIL);
  });

  it('names each invalid field without sending', async () => {
    setup();
    const nameField = screen.getByRole('textbox', { name: 'Name' });
    const emailField = screen.getByRole('textbox', { name: 'Email' });
    const messageField = screen.getByRole('textbox', { name: 'Message' });
    const sendButton = screen.getByRole('button', { name: 'Send message' });

    await user.type(messageField, faker.string.alpha(9));
    await user.click(sendButton);

    expect(nameField).toHaveAccessibleDescription(
      'Enter your name, up to 100 characters.',
    );
    expect(emailField).toHaveAccessibleDescription(
      'Enter a valid email address.',
    );
    expect(messageField).toHaveAccessibleDescription(
      'Write a message of 10 to 5,000 characters.',
    );
    expect(submitContactMessageMock).not.toHaveBeenCalled();
  });

  it('shows the field errors the server returns', async () => {
    submitContactMessageMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      invalidFields: ['email'],
    });
    setup();

    await fillAndSend(user);

    const emailError = await screen.findByText('Enter a valid email address.');

    expect(emailError).toBeVisible();
  });

  it('renders the privacy note under the send button', () => {
    setup({ privacyNote: PRIVACY_NOTE });

    const privacyNote = screen.getByText(PRIVACY_NOTE);

    expect(privacyNote).toBeVisible();
  });
});
