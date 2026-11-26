import { faker } from '@faker-js/faker';
import { SITE_MESSAGES } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { ConsentPreferencesDialog } from '@web/components/shared/consent-preferences-dialog';
import { renderElement, screen, waitFor } from '@web/testing/custom-render';
import { clearConsentCookie } from '@web/testing/shared/consent/consent-cookie';
import { KEY_ESCAPE } from '@web/testing/shared/keyboard/constants';

import { CookiePreferencesLink } from './cookie-preferences-link';

faker.seed(6526);

const MOCK_LINK_TEXT = faker.lorem.words(2);
const DIALOG_NAME = SITE_MESSAGES.consent.preferences.heading;

describe(`<${CookiePreferencesLink.name}/>`, () => {
  let user: UserEvent;
  let link: HTMLElement;

  beforeEach(() => {
    clearConsentCookie();
    user = userEvent.setup();
    renderElement(
      <>
        <CookiePreferencesLink>{MOCK_LINK_TEXT}</CookiePreferencesLink>
        <ConsentPreferencesDialog />
      </>,
    );
    link = screen.getByRole('button', { name: MOCK_LINK_TEXT });
  });

  afterEach(clearConsentCookie);

  it.each(['{Enter}', ' '])(
    'opens the cookie preferences from the keyboard with %s',
    async (key) => {
      await user.tab();
      expect(link).toHaveFocus();

      await user.keyboard(key);

      const dialog = await screen.findByRole('dialog', { name: DIALOG_NAME });
      expect(dialog).toBeVisible();
    },
  );

  describe('once clicked', () => {
    beforeEach(async () => {
      await user.click(link);
    });

    it('opens the cookie preferences', async () => {
      const dialog = await screen.findByRole('dialog', { name: DIALOG_NAME });

      expect(dialog).toBeVisible();
    });

    it('takes focus back when the preferences close', async () => {
      await screen.findByRole('dialog', { name: DIALOG_NAME });

      await user.keyboard(KEY_ESCAPE);

      await waitFor(() => {
        expect(link).toHaveFocus();
      });
    });
  });
});
