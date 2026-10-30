import { SITE_MESSAGES } from '@blog/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { ConsentBannerSlot } from '@web/components/shared/consent-banner-slot';
import { ConsentPreferencesDialog } from '@web/components/shared/consent-preferences-dialog';
import { useHeaderOverlay } from '@web/context/header-overlay-provider';
import { renderElement, screen, waitFor } from '@web/testing/custom-render';
import {
  clearConsentCookie,
  grantConsent,
} from '@web/testing/shared/consent/consent-cookie';

import { FloatingCookieSettingsButton } from './floating-cookie-settings-button';

const { banner, preferences, footerSettingsLabel } = SITE_MESSAGES.consent;
const BUTTON_NAME = footerSettingsLabel;
const OPEN_OVERLAY_BUTTON_NAME = 'Open menu';

const OpenHeaderOverlayButton = () => {
  const overlay = useHeaderOverlay();
  return (
    <button
      onClick={() => overlay?.openOverlay({ id: 'menu', takesKeys: true })}
    >
      {OPEN_OVERLAY_BUTTON_NAME}
    </button>
  );
};

describe(`<${FloatingCookieSettingsButton.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    clearConsentCookie();
    user = userEvent.setup();
  });

  afterEach(clearConsentCookie);

  it('stays hidden until the reader has answered the banner', () => {
    renderElement(<FloatingCookieSettingsButton />);

    const button = screen.queryByRole('button', { name: BUTTON_NAME });

    expect(button).not.toBeInTheDocument();
  });

  it.each([banner.acceptLabel, banner.rejectLabel])(
    'appears once the reader picks %s',
    async (answer) => {
      renderElement(
        <>
          <ConsentBannerSlot isEnabled={true} />
          <FloatingCookieSettingsButton />
        </>,
      );

      const answerButton = screen.getByRole('button', { name: answer });

      await user.click(answerButton);

      const button = await screen.findByRole('button', { name: BUTTON_NAME });
      expect(button).toBeVisible();
    },
  );

  it('appears once the reader saves from the banner settings, and takes focus back', async () => {
    renderElement(
      <>
        <ConsentBannerSlot isEnabled={true} />
        <FloatingCookieSettingsButton />
        <ConsentPreferencesDialog />
      </>,
    );
    const settingsButton = screen.getByRole('button', {
      name: banner.settingsLabel,
    });
    await user.click(settingsButton);
    const saveButton = await screen.findByRole('button', {
      name: preferences.saveLabel,
    });

    await user.click(saveButton);

    const button = await screen.findByRole('button', { name: BUTTON_NAME });
    await waitFor(() => {
      expect(button).toHaveFocus();
    });
  });

  describe('when the reader has answered', () => {
    beforeEach(() => {
      grantConsent();
    });

    it('opens the cookie settings and returns focus to itself on close', async () => {
      renderElement(
        <>
          <FloatingCookieSettingsButton />
          <ConsentPreferencesDialog />
        </>,
      );
      const button = screen.getByRole('button', { name: BUTTON_NAME });

      await user.click(button);
      await screen.findByRole('dialog', { name: preferences.heading });
      const closeButton = screen.getByRole('button', {
        name: preferences.closeLabel,
      });
      await user.click(closeButton);

      await waitFor(() => {
        expect(button).toHaveFocus();
      });
    });

    it('hides while a header overlay is open', async () => {
      renderElement(
        <>
          <OpenHeaderOverlayButton />
          <FloatingCookieSettingsButton />
        </>,
      );

      const openOverlayButton = screen.getByRole('button', {
        name: OPEN_OVERLAY_BUTTON_NAME,
      });

      await user.click(openOverlayButton);

      const button = screen.queryByRole('button', { name: BUTTON_NAME });
      expect(button).not.toBeInTheDocument();
    });
  });
});
