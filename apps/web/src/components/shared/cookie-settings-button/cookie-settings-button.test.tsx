import userEvent, { type UserEvent } from '@testing-library/user-event';
import { renderElement, screen } from '@web/testing/custom-render';
import {
  PREFERENCES_CLOSED_TEXT,
  PREFERENCES_OPEN_TEXT,
  PreferencesState,
} from '@web/testing/shared/consent/consent-preferences-probes';

import { CookieSettingsButton } from './cookie-settings-button';

const BUTTON_NAME = 'Cookie settings';

describe(`<${CookieSettingsButton.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    renderElement(
      <>
        <CookieSettingsButton />
        <PreferencesState />
      </>,
    );
  });

  it('is always available, whatever the consent state', () => {
    const settingsButton = screen.getByRole('button', { name: BUTTON_NAME });

    expect(settingsButton).toBeVisible();
  });

  it('opens the preferences when pressed', async () => {
    const settingsButton = screen.getByRole('button', { name: BUTTON_NAME });
    const closedState = screen.getByText(PREFERENCES_CLOSED_TEXT);
    expect(closedState).toBeVisible();

    await user.click(settingsButton);

    const openState = screen.getByText(PREFERENCES_OPEN_TEXT);
    expect(openState).toBeVisible();
  });
});
