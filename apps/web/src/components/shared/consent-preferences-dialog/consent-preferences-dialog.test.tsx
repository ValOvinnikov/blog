import userEvent, { type UserEvent } from '@testing-library/user-event';
import { CookieSettingsButton } from '@web/components/shared/cookie-settings-button';
import {
  useConsentChoices,
  useConsentPreferences,
} from '@web/context/consent-provider';
import { fireEvent, renderElement, screen } from '@web/testing/custom-render';

import { ConsentPreferencesDialog } from './consent-preferences-dialog';

const clearConsentCookie = () => {
  document.cookie = 'consent=; Max-Age=0; Path=/';
};

const OpenPreferencesButton = () => {
  const { openPreferences } = useConsentPreferences();
  return <button onClick={openPreferences}>Open preferences</button>;
};

const BannerOpener = () => {
  const { openPreferences } = useConsentPreferences();
  const { status } = useConsentChoices();
  return status === 'unanswered' ? (
    <button onClick={openPreferences}>Banner settings</button>
  ) : null;
};

const setup = async () => {
  renderElement(
    <>
      <OpenPreferencesButton />
      <ConsentPreferencesDialog />
    </>,
  );
  await user.click(screen.getByRole('button', { name: 'Open preferences' }));
};

let user: UserEvent;

describe(`<${ConsentPreferencesDialog.name}/>`, () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  });
  beforeEach(() => {
    clearConsentCookie();
    user = userEvent.setup();
  });
  afterEach(clearConsentCookie);

  it('stays closed until preferences are opened', () => {
    renderElement(<ConsentPreferencesDialog />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  describe('when preferences are opened', () => {
    beforeEach(async () => {
      await setup();
    });

    it('opens as a modal dialog with the cookie settings', async () => {
      expect(
        screen.getByRole('dialog', { name: 'Cookie settings' }),
      ).toBeVisible();
    });

    it('shows necessary cookies as always on', async () => {
      const necessary = screen.getByRole('switch', { name: 'Necessary' });
      expect(necessary).toBeChecked();
      expect(necessary).toBeDisabled();
    });

    it('shows external media off until it has been granted', async () => {
      expect(
        screen.getByRole('switch', { name: 'External media' }),
      ).not.toBeChecked();
    });

    it('saves the chosen categories and closes', async () => {
      await user.click(screen.getByRole('switch', { name: 'External media' }));
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(document.cookie).toContain('consent=1.EXTERNAL_MEDIA');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('closes without saving from the close button', async () => {
      await user.click(screen.getByRole('switch', { name: 'External media' }));
      await user.click(screen.getByRole('button', { name: 'Close' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(document.cookie).not.toContain('consent=');
    });

    it('closes when the browser dismisses the dialog', async () => {
      fireEvent(screen.getByRole('dialog'), new Event('close'));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('when external media was already granted', () => {
    beforeEach(async () => {
      document.cookie = 'consent=1.EXTERNAL_MEDIA; Path=/';
      await setup();
    });

    it('shows external media on once it has been granted', async () => {
      expect(
        screen.getByRole('switch', { name: 'External media' }),
      ).toBeChecked();
    });

    it('saves a withdrawn category as declined', async () => {
      await user.click(screen.getByRole('switch', { name: 'External media' }));
      await user.click(screen.getByRole('button', { name: 'Save' }));

      expect(document.cookie).not.toContain('EXTERNAL_MEDIA');
    });
  });

  it('moves focus to the footer cookie settings button when the opener is gone', async () => {
    renderElement(
      <>
        <BannerOpener />
        <CookieSettingsButton />
        <ConsentPreferencesDialog />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Banner settings' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      screen.getByRole('button', { name: 'Cookie settings' }),
    ).toHaveFocus();
  });
});
