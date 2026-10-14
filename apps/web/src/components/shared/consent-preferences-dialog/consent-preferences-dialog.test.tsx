import userEvent, { type UserEvent } from '@testing-library/user-event';
import { ConsentBannerSlot } from '@web/components/shared/consent-banner-slot';
import { CookieSettingsButton } from '@web/components/shared/cookie-settings-button';
import { useConsentPreferences } from '@web/context/consent-preferences-provider';
import { renderElement, screen, waitFor } from '@web/testing/custom-render';

import { ConsentPreferencesDialog } from './consent-preferences-dialog';

const clearConsentCookie = () => {
  document.cookie = 'consent=; Max-Age=0; Path=/';
};

const OpenPreferencesButton = () => {
  const { open } = useConsentPreferences();
  return <button onClick={open}>Open preferences</button>;
};

let user: UserEvent;

const openPreferences = async () => {
  await user.click(screen.getByRole('button', { name: 'Open preferences' }));
  await waitFor(() =>
    expect(
      screen.getByRole('dialog', { name: 'Cookie settings' }),
    ).toBeVisible(),
  );
};

const setup = async () => {
  renderElement(
    <>
      <OpenPreferencesButton />
      <ConsentPreferencesDialog />
    </>,
  );
  await openPreferences();
};

describe(`<${ConsentPreferencesDialog.name}/>`, () => {
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

    it('opens as a dialog named by its single heading', () => {
      expect(
        screen.getAllByRole('heading', { name: 'Cookie settings' }),
      ).toHaveLength(1);
    });

    it('offers exactly one close control', () => {
      expect(screen.getAllByRole('button', { name: 'Close' })).toHaveLength(1);
    });

    it('shows necessary cookies as always on', () => {
      const necessary = screen.getByRole('switch', { name: 'Necessary' });
      expect(necessary).toBeChecked();
      expect(necessary).toBeDisabled();
    });

    it('shows external media off until it has been granted', () => {
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

    it('closes without saving on Escape', async () => {
      await user.keyboard('{Escape}');

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(document.cookie).not.toContain('consent=');
    });

    it('closes without saving on a backdrop click', async () => {
      await user.click(screen.getByTestId('dialog-backdrop'));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(document.cookie).not.toContain('consent=');
    });

    it('reopens with the stored choice rather than the discarded one', async () => {
      await user.click(screen.getByRole('switch', { name: 'External media' }));
      await user.keyboard('{Escape}');
      await openPreferences();

      expect(
        screen.getByRole('switch', { name: 'External media' }),
      ).not.toBeChecked();
    });
  });

  describe('when external media was already granted', () => {
    beforeEach(async () => {
      document.cookie = 'consent=1.EXTERNAL_MEDIA; Path=/';
      await setup();
    });

    it('shows external media on once it has been granted', () => {
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

  it('moves focus to the footer cookie settings button after saving from the banner', async () => {
    renderElement(
      <>
        <ConsentBannerSlot isEnabled={true} />
        <CookieSettingsButton />
        <ConsentPreferencesDialog />
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await waitFor(() => expect(screen.getByRole('dialog')).toBeVisible());

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Cookie settings' }),
      ).toHaveFocus(),
    );
  });
});
