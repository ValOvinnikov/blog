import { CONSENT_CATEGORY, routes } from '@blog/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';
import {
  clearConsentCookie,
  grantConsent,
  readGrantedConsent,
} from '@web/testing/shared/consent/consent-cookie';
import {
  PREFERENCES_OPEN_TEXT,
  PreferencesState,
} from '@web/testing/shared/consent/consent-preferences-probes';

import { ConsentBannerSlot } from './consent-banner-slot';

const BANNER_HEADING = 'Cookies on this site';
const COOKIE_STATEMENT_LINK = 'Cookie statement';

const setup = customRender(ConsentBannerSlot, { isEnabled: true });

describe(`<${ConsentBannerSlot.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    clearConsentCookie();
    user = userEvent.setup();
  });

  afterEach(clearConsentCookie);

  it('renders nothing when the banner is disabled', () => {
    setup({ isEnabled: false });

    const heading = screen.queryByRole('heading', { name: BANNER_HEADING });

    expect(heading).not.toBeInTheDocument();
  });

  it('renders nothing once a choice has been made', () => {
    grantConsent([]);

    setup();

    const heading = screen.queryByRole('heading', { name: BANNER_HEADING });

    expect(heading).not.toBeInTheDocument();
  });

  describe('while consent is unanswered', () => {
    beforeEach(() => {
      renderElement(
        <>
          <ConsentBannerSlot isEnabled={true} />
          <PreferencesState />
        </>,
      );
    });

    it('offers the choice', () => {
      const heading = screen.getByRole('heading', { name: BANNER_HEADING });

      expect(heading).toBeVisible();
    });

    it('links the cookie statement', () => {
      const link = screen.getByRole('link', { name: COOKIE_STATEMENT_LINK });

      expect(link).toHaveAttribute('href', routes.cookieStatement());
    });

    it('leaves the choice unanswered when the cookie statement is followed', async () => {
      const link = screen.getByRole('link', { name: COOKIE_STATEMENT_LINK });

      await user.click(link);

      const heading = screen.getByRole('heading', { name: BANNER_HEADING });
      expect(heading).toBeVisible();
      expect(readGrantedConsent()).toBeUndefined();
    });

    it('hides and remembers the choice on accept all', async () => {
      const acceptButton = screen.getByRole('button', { name: 'Accept all' });

      await user.click(acceptButton);

      const heading = screen.queryByRole('heading', { name: BANNER_HEADING });
      expect(heading).not.toBeInTheDocument();
      expect(readGrantedConsent()).toEqual([CONSENT_CATEGORY.EXTERNAL_MEDIA]);
    });

    it('hides and remembers the choice on reject all', async () => {
      const rejectButton = screen.getByRole('button', { name: 'Reject all' });

      await user.click(rejectButton);

      const heading = screen.queryByRole('heading', { name: BANNER_HEADING });
      expect(heading).not.toBeInTheDocument();
      expect(readGrantedConsent()).toEqual([]);
    });

    it('opens the preferences from settings and keeps the banner', async () => {
      const settingsButton = screen.getByRole('button', { name: 'Settings' });

      await user.click(settingsButton);

      const openState = screen.getByText(PREFERENCES_OPEN_TEXT);
      const heading = screen.getByRole('heading', { name: BANNER_HEADING });
      expect(openState).toBeVisible();
      expect(heading).toBeVisible();
    });
  });
});
