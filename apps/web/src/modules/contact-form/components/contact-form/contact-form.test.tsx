import {
  ACTION_OUTCOME,
  LOCALE_BCP47_TAGS,
  LOCALE_ISO_CODES,
  SITE_MESSAGES,
} from '@blog/config';
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
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

import { ContactForm } from './contact-form';

vi.mock('@web/i18n/navigation');

faker.seed(6011);

const { EN, NL } = LOCALE_ISO_CODES;
const {
  successTitle,
  errorName,
  errorEmail,
  errorMessage,
  errorBlocked,
  errorServer,
  submitLabel,
} = SITE_MESSAGES.contactForm;

const MOCK_SUCCESS_MESSAGE = faker.lorem.sentence();
const MOCK_PRIVACY_NOTE = faker.lorem.sentence();
const MOCK_PAGE_SLUG = faker.lorem.slug();
const MOCK_PATHNAME = `/${MOCK_PAGE_SLUG}`;
const MOCK_PRERENDERED_PATHNAME = `/${MOCK_TENANT_ID}/${NL}/${MOCK_PAGE_SLUG}`;
const MOCK_TOO_SHORT_MESSAGE = faker.string.alpha(9);
const MOCK_INVALID_EMAIL = faker.lorem.word();

const submitMessage = vi.fn<TSubmitContactMessage>();

const setup = customRender(ContactForm, {
  successMessage: MOCK_SUCCESS_MESSAGE,
  submitMessage,
  currentLocale: EN,
  defaultLocale: EN,
});

const MOCK_SENT_INPUT = { ...MOCK_CONTACT_MESSAGE, website: '' };

describe(`<${ContactForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(usePathname).mockReturnValue(MOCK_PATHNAME);
    submitMessage.mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('sends the typed message with the page it was sent from', async () => {
      await fillAndSendContactForm(user, MOCK_CONTACT_MESSAGE);

      expect(submitMessage).toHaveBeenCalledWith({
        ...MOCK_SENT_INPUT,
        sourcePath: MOCK_PATHNAME,
      });
    });

    it('replaces the form with the success message once sent', async () => {
      await fillAndSendContactForm(user, MOCK_CONTACT_MESSAGE);

      const heading = await screen.findByRole('heading', {
        name: successTitle,
      });
      const sendButton = screen.queryByRole('button', { name: submitLabel });

      expect(heading).toBeVisible();
      expect(sendButton).not.toBeInTheDocument();
    });

    it('announces the success message through a status region', async () => {
      const status = screen.getByRole('status');

      await fillAndSendContactForm(user, MOCK_CONTACT_MESSAGE);

      await waitFor(() =>
        expect(status).toHaveTextContent(MOCK_SUCCESS_MESSAGE),
      );
    });

    it('names each invalid field without sending', async () => {
      const { nameField, emailField, messageField, sendButton } =
        getContactFormFields();

      await user.type(messageField, MOCK_TOO_SHORT_MESSAGE);
      await user.click(sendButton);

      expect(nameField).toHaveAccessibleDescription(errorName);
      expect(emailField).toHaveAccessibleDescription(errorEmail);
      expect(messageField).toHaveAccessibleDescription(errorMessage);
      expect(submitMessage).not.toHaveBeenCalled();
    });

    it('moves focus to the first invalid field in reading order', async () => {
      const { nameField, emailField, sendButton } = getContactFormFields();

      await user.type(emailField, MOCK_INVALID_EMAIL);
      await user.click(sendButton);

      expect(nameField).toHaveFocus();
    });
  });

  it('sends the public path with the locale prefix from a prerendered page', async () => {
    vi.mocked(usePathname).mockReturnValue(MOCK_PRERENDERED_PATHNAME);
    setup({ currentLocale: NL });

    await fillAndSendContactForm(user, MOCK_CONTACT_MESSAGE);

    expect(submitMessage).toHaveBeenCalledWith({
      ...MOCK_SENT_INPUT,
      sourcePath: `/${LOCALE_BCP47_TAGS[NL]}${MOCK_PATHNAME}`,
    });
  });

  it.each([
    [ACTION_OUTCOME.SERVER_ERROR, errorServer],
    [ACTION_OUTCOME.BLOCKED, errorBlocked],
  ])(
    'shows the %s refusal and keeps what the visitor typed',
    async (outcome, text) => {
      submitMessage.mockResolvedValue({ outcome });
      setup();

      await fillAndSendContactForm(user, MOCK_CONTACT_MESSAGE);

      const alert = await screen.findByRole('alert');
      const { nameField, emailField, messageField } = getContactFormFields();

      expect(alert).toHaveTextContent(text);
      expect(nameField).toHaveValue(MOCK_CONTACT_MESSAGE.name);
      expect(emailField).toHaveValue(MOCK_CONTACT_MESSAGE.email);
      expect(messageField).toHaveValue(MOCK_CONTACT_MESSAGE.message);
    },
  );

  it('shows and focuses the field the server rejects', async () => {
    submitMessage.mockResolvedValue({
      outcome: ACTION_OUTCOME.INVALID,
      fieldErrors: { email: { reason: FIELD_ERROR.INVALID } },
    });
    setup();

    await fillAndSendContactForm(user, MOCK_CONTACT_MESSAGE);

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
