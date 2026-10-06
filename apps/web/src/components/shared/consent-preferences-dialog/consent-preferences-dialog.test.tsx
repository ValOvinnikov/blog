import userEvent from '@testing-library/user-event';
import { useConsentPreferences } from '@web/context/consent-provider';
import { fireEvent, renderElement, screen } from '@web/testing/custom-render';

import { ConsentPreferencesDialog } from './consent-preferences-dialog';

const clearConsentCookie = () => {
  document.cookie = 'consent=; Max-Age=0; Path=/';
};

const OpenPreferencesButton = () => {
  const { openPreferences } = useConsentPreferences();
  return <button onClick={openPreferences}>Open preferences</button>;
};

const setup = async () => {
  const user = userEvent.setup();
  renderElement(
    <>
      <OpenPreferencesButton />
      <ConsentPreferencesDialog />
    </>,
  );
  await user.click(screen.getByRole('button', { name: 'Open preferences' }));
  return user;
};

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
  beforeEach(clearConsentCookie);
  afterEach(clearConsentCookie);

  it('stays closed until preferences are opened', () => {
    renderElement(<ConsentPreferencesDialog />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens as a modal dialog with the cookie settings', async () => {
    await setup();

    expect(
      screen.getByRole('dialog', { name: 'Cookie settings' }),
    ).toBeVisible();
  });

  it('shows necessary cookies as always on', async () => {
    await setup();

    const necessary = screen.getByRole('switch', { name: 'Necessary' });
    expect(necessary).toBeChecked();
    expect(necessary).toBeDisabled();
  });

  it('shows external media off until it has been granted', async () => {
    await setup();

    expect(
      screen.getByRole('switch', { name: 'External media' }),
    ).not.toBeChecked();
  });

  it('shows external media on once it has been granted', async () => {
    document.cookie = 'consent=1.EXTERNAL_MEDIA; Path=/';

    await setup();

    expect(
      screen.getByRole('switch', { name: 'External media' }),
    ).toBeChecked();
  });

  it('saves the chosen categories and closes', async () => {
    const user = await setup();

    await user.click(screen.getByRole('switch', { name: 'External media' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(document.cookie).toContain('consent=1.EXTERNAL_MEDIA');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('saves a withdrawn category as declined', async () => {
    document.cookie = 'consent=1.EXTERNAL_MEDIA; Path=/';
    const user = await setup();

    await user.click(screen.getByRole('switch', { name: 'External media' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(document.cookie).not.toContain('EXTERNAL_MEDIA');
  });

  it('closes without saving from the close button', async () => {
    const user = await setup();

    await user.click(screen.getByRole('switch', { name: 'External media' }));
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.cookie).not.toContain('consent=');
  });

  it('closes when the browser dismisses the dialog', async () => {
    await setup();

    fireEvent(screen.getByRole('dialog'), new Event('close'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
