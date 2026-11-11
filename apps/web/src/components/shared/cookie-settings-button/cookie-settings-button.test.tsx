import userEvent, { type UserEvent } from '@testing-library/user-event';
import { renderElement, screen } from '@web/testing/custom-render';
import {
  COOKIE_SETTINGS_BUTTON_NAME,
  PREFERENCES_CLOSED_TEXT,
  PREFERENCES_OPEN_TEXT,
  PreferencesState,
} from '@web/testing/shared/consent/consent-preferences-probes';

import { CookieSettingsButton } from './cookie-settings-button';

describe(`<${CookieSettingsButton.name}/>`, () => {
  let user: UserEvent;
  let settingsButton: HTMLElement;

  beforeEach(() => {
    user = userEvent.setup();
    renderElement(
      <>
        <CookieSettingsButton />
        <PreferencesState />
      </>,
    );
    settingsButton = screen.getByRole('button', {
      name: COOKIE_SETTINGS_BUTTON_NAME,
    });
  });

  it('is always available, whatever the consent state', () => {
    expect(settingsButton).toBeVisible();
  });

  it('opens the preferences when pressed', async () => {
    const closedState = screen.getByText(PREFERENCES_CLOSED_TEXT);
    expect(closedState).toBeVisible();

    await user.click(settingsButton);

    const openState = screen.getByText(PREFERENCES_OPEN_TEXT);
    expect(openState).toBeVisible();
  });
});
