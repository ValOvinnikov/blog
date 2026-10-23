import { SITE_MESSAGES } from '@blog/config';
import type { UserEvent } from '@testing-library/user-event';
import { screen } from '@web/testing/custom-render';

const { nameLabel, emailLabel, messageLabel, submitLabel } =
  SITE_MESSAGES.contactForm;

export const getContactFormFields = () => ({
  nameField: screen.getByRole('textbox', { name: nameLabel }),
  emailField: screen.getByRole('textbox', { name: emailLabel }),
  messageField: screen.getByRole('textbox', { name: messageLabel }),
  sendButton: screen.getByRole('button', { name: submitLabel }),
});

export const fillAndSendContactForm = async (
  user: UserEvent,
  { name, email, message }: { name: string; email: string; message: string },
) => {
  const { nameField, emailField, messageField, sendButton } =
    getContactFormFields();

  await user.type(nameField, name);
  await user.type(emailField, email);
  await user.type(messageField, message);
  await user.click(sendButton);
};
