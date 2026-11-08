import { SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { ConsentPreferencesDialog } from '@web/components/shared/consent-preferences-dialog';
import { renderElement, screen, waitFor } from '@web/testing/custom-render';
import { clearConsentCookie } from '@web/testing/shared/consent/consent-cookie';

import { CookiePreferencesLink } from './cookie-preferences-link';

faker.seed(6526);

const LINK_TEXT = faker.lorem.words(2);
const DIALOG_NAME = SITE_MESSAGES.consent.preferences.heading;

describe(`<${CookiePreferencesLink.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    clearConsentCookie();
    user = userEvent.setup();
    renderElement(
      <>
        <CookiePreferencesLink>{LINK_TEXT}</CookiePreferencesLink>
        <ConsentPreferencesDialog />
      </>,
    );
  });

  afterEach(clearConsentCookie);

  it('opens the cookie preferences when clicked', async () => {
    const link = screen.getByRole('button', { name: LINK_TEXT });

    await user.click(link);

    const dialog = await screen.findByRole('dialog', { name: DIALOG_NAME });
    expect(dialog).toBeVisible();
  });

  it.each(['{Enter}', ' '])(
    'opens the cookie preferences from the keyboard with %s',
    async (key) => {
      await user.tab();
      const link = screen.getByRole('button', { name: LINK_TEXT });
      expect(link).toHaveFocus();

      await user.keyboard(key);

      const dialog = await screen.findByRole('dialog', { name: DIALOG_NAME });
      expect(dialog).toBeVisible();
    },
  );

  it('takes focus back when the preferences close', async () => {
    const link = screen.getByRole('button', { name: LINK_TEXT });
    await user.click(link);
    await screen.findByRole('dialog', { name: DIALOG_NAME });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(link).toHaveFocus();
    });
  });
});
