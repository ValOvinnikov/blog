import userEvent from '@testing-library/user-event';
import { useConsentPreferences } from '@web/context/consent-provider';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';

import { ConsentBannerSlot } from './consent-banner-slot';

const setup = customRender(ConsentBannerSlot, { isEnabled: true });

const clearConsentCookie = () => {
  document.cookie = 'consent=; Max-Age=0; Path=/';
};

const PreferencesState = () => {
  const { isPreferencesOpen } = useConsentPreferences();
  return <p>{isPreferencesOpen ? 'Preferences open' : 'Preferences closed'}</p>;
};

describe(`<${ConsentBannerSlot.name}/>`, () => {
  beforeEach(clearConsentCookie);
  afterEach(clearConsentCookie);

  it('offers the choice while consent is unanswered', () => {
    setup();

    expect(
      screen.getByRole('heading', { name: 'Cookies on this site' }),
    ).toBeVisible();
  });

  it('renders nothing when the banner is disabled', () => {
    setup({ isEnabled: false });

    expect(
      screen.queryByRole('heading', { name: 'Cookies on this site' }),
    ).not.toBeInTheDocument();
  });

  it('renders nothing once a choice has been made', () => {
    document.cookie = 'consent=1.; Path=/';

    setup();

    expect(
      screen.queryByRole('heading', { name: 'Cookies on this site' }),
    ).not.toBeInTheDocument();
  });

  it('hides and remembers the choice on accept all', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'Accept all' }));

    expect(
      screen.queryByRole('heading', { name: 'Cookies on this site' }),
    ).not.toBeInTheDocument();
    expect(document.cookie).toContain('consent=1.EXTERNAL_MEDIA');
  });

  it('hides and remembers the choice on reject all', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'Reject all' }));

    expect(
      screen.queryByRole('heading', { name: 'Cookies on this site' }),
    ).not.toBeInTheDocument();
    expect(document.cookie).not.toContain('EXTERNAL_MEDIA');
    expect(document.cookie).toContain('consent=1.');
  });

  it('opens the preferences from settings and keeps the banner', async () => {
    const user = userEvent.setup();
    renderElement(
      <>
        <ConsentBannerSlot isEnabled={true} />
        <PreferencesState />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Settings' }));

    expect(screen.getByText('Preferences open')).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Cookies on this site' }),
    ).toBeVisible();
  });
});
