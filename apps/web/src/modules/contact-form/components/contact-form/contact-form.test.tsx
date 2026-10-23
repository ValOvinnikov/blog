import { ACTION_OUTCOME, LOCALE_ISO_CODES, SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { FIELD_ERROR } from '@web/constants/field-error';
import { usePathname } from '@web/i18n/navigation';
import type { TSubmitContactMessage } from '@web/modules/contact-form/hooks/use-contact-form/use-contact-form';
import { customRender, screen, waitFor } from '@web/testing/custom-render';
import {
  fillAndSendContactForm,
  getContactFormFields,
} from '@web/testing/modules/contact-form/contact-form-fields';
import { MOCK_CONTACT_MESSAGE } from '@web/testing/modules/contact-form/fixtures';

import { ContactForm } from './contact-form';

vi.mock('@web/i18n/navigation');

const { EN, NL } = LOCALE_ISO_CODES;
const { submitLabel, errorEmail } = SITE_MESSAGES.contactForm;

const MOCK_SUCCESS_MESSAGE = faker.lorem.sentence();
const MOCK_PRIVACY_NOTE = faker.lorem.sentence();
const MOCK_PATHNAME = `/${faker.lorem.slug()}`;

const submitMessage = vi.fn<TSubmitContactMessage>();

const setup = customRender(ContactForm, {
  successMessage: MOCK_SUCCESS_MESSAGE,
  submitMessage,
  currentLocale: EN,
  defaultLocale: EN,
});

const MOCK_SENT_INPUT = { ...MOCK_CONTACT_MESSAGE, website: '' };

const fillAndSend = (user: UserEvent) =>
  fillAndSendContactForm(user, MOCK_CONTACT_MESSAGE);

describe(`<${ContactForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(usePathname).mockReturnValue(MOCK_PATHNAME);
    submitMessage.mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('sends the typed message with the page it was sent from', async () => {
    setup();

    await fillAndSend(user);

    expect(submitMessage).toHaveBeenCalledWith({
      ...MOCK_SENT_INPUT,
      sourcePath: MOCK_PATHNAME,
    });
  });

  it('sends the public path with the locale prefix from a prerendered page', async () => {
    vi.mocked(usePathname).mockReturnValue(
      '/0262d3a7-27e1-41b6-8b4f-35dae9f7c6ee/NL/contact',
    );
    setup({ currentLocale: NL });

    await fillAndSend(user);

    expect(submitMessage).toHaveBeenCalledWith({
      ...MOCK_SENT_INPUT,
      sourcePath: '/nl/contact',
    });
  });

  it('replaces the form with the success message once sent', async () => {
    setup();

    await fillAndSend(user);

    const heading = await screen.findByRole('heading', {
      name: 'Message sent',
    });
    const sendButton = screen.queryByRole('button', {
      name: submitLabel,
    });

    expect(heading).toBeVisible();
    expect(sendButton).not.toBeInTheDocument();
  });

  it('announces the success message through a status region present before sending', async () => {
    setup();
    const status = screen.getByRole('status');

    await fillAndSend(user);

    await waitFor(() => expect(status).toHaveTextContent(MOCK_SUCCESS_MESSAGE));
  });

  it.each([
    [ACTION_OUTCOME.SERVER_ERROR, "Your message couldn't be sent."],
    [ACTION_OUTCOME.BLOCKED, 'Too many attempts.'],
  ])(
    'shows the %s refusal and keeps what the visitor typed',
    async (outcome, text) => {
      submitMessage.mockResolvedValue({ outcome });
      setup();

      await fillAndSend(user);

      const alert = await screen.findByRole('alert');
      const { nameField, emailField, messageField } = getContactFormFields();

      expect(alert).toHaveTextContent(text);
      expect(nameField).toHaveValue(MOCK_CONTACT_MESSAGE.name);
      expect(emailField).toHaveValue(MOCK_CONTACT_MESSAGE.email);
      expect(messageField).toHaveValue(MOCK_CONTACT_MESSAGE.message);
    },
  );

  it('names each invalid field without sending', async () => {
    setup();
    const { nameField, emailField, messageField, sendButton } =
      getContactFormFields();

    await user.type(messageField, faker.string.alpha(9));
    await user.click(sendButton);

    expect(nameField).toHaveAccessibleDescription(
      'Enter your name, up to 100 characters.',
    );
    expect(emailField).toHaveAccessibleDescription(errorEmail);
    expect(messageField).toHaveAccessibleDescription(
      'Write a message of 10 to 5,000 characters.',
    );
    expect(submitMessage).not.toHaveBeenCalled();
  });

  it('moves focus to the first invalid field in reading order', async () => {
    setup();
    const { nameField, emailField, sendButton } = getContactFormFields();

    await user.type(emailField, faker.lorem.word());
    await user.click(sendButton);

    expect(nameField).toHaveFocus();
  });

  it('shows and focuses the field the server rejects', async () => {
    submitMessage.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { email: { reason: FIELD_ERROR.INVALID } },
    });
    setup();

    await fillAndSend(user);

    const { emailField } = getContactFormFields();

    await waitFor(() => expect(emailField).toHaveFocus());
    expect(emailField).toHaveAccessibleDescription(errorEmail);
  });

  it('renders the privacy note under the send button', () => {
    setup({ privacyNote: MOCK_PRIVACY_NOTE });

    const privacyNote = screen.getByText(MOCK_PRIVACY_NOTE);

    expect(privacyNote).toBeVisible();
  });
});
