import userEvent from '@testing-library/user-event';
import { useConsentPreferences } from '@web/context/consent-provider';
import { renderElement, screen } from '@web/testing/custom-render';

import { CookieSettingsButton } from './cookie-settings-button';

const PreferencesState = () => {
  const { isPreferencesOpen } = useConsentPreferences();
  return <p>{isPreferencesOpen ? 'Preferences open' : 'Preferences closed'}</p>;
};

describe(`<${CookieSettingsButton.name}/>`, () => {
  it('is always available, whatever the consent state', () => {
    renderElement(<CookieSettingsButton />);

    expect(
      screen.getByRole('button', { name: 'Cookie settings' }),
    ).toBeVisible();
  });

  it('opens the preferences when pressed', async () => {
    const user = userEvent.setup();
    renderElement(
      <>
        <CookieSettingsButton />
        <PreferencesState />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Cookie settings' }));

    expect(screen.getByText('Preferences open')).toBeVisible();
  });
});
