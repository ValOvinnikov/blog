import { LOCALE_ISO_CODES } from '@blog/config';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LanguagesSettings } from './languages-settings';

mockRouterRefresh();

const { EN, NL, FR, DE, ES } = LOCALE_ISO_CODES;

const setup = customRender(LanguagesSettings, {
  tenantId: 'tenant-1',
  defaultLocale: EN,
  locales: { stored: [], live: [], limit: 2 },
  saveAction: vi.fn(),
});

describe(`<${LanguagesSettings.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('shows the default language apart from the helper sentence', () => {
    setup({ defaultLocale: NL });

    expect(screen.getByText('Dutch')).toBeVisible();
    expect(
      screen.getByText('Every page is written in it first.'),
    ).toBeVisible();
  });

  it('does not offer the default language as an additional one', () => {
    setup();

    expect(
      screen.queryByRole('switch', { name: 'English' }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('switch')).toHaveLength(4);
  });

  it('stops offering languages once the plan allowance is used', async () => {
    setup();

    await user.click(screen.getByRole('switch', { name: 'Dutch' }));
    await user.click(screen.getByRole('switch', { name: 'French' }));

    expect(screen.getByRole('switch', { name: 'German' })).toHaveAttribute(
      'data-disabled',
      '',
    );
    expect(screen.getByRole('switch', { name: 'Dutch' })).not.toHaveAttribute(
      'data-disabled',
    );
  });

  it('saves the chosen additional languages', async () => {
    const saveAction = vi.fn().mockResolvedValue({ ok: true });
    setup({ saveAction });

    await user.click(screen.getByRole('switch', { name: 'French' }));
    await user.click(screen.getByRole('switch', { name: 'Dutch' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => {
      expect(saveAction).toHaveBeenCalledWith('tenant-1', [NL, FR]);
    });
  });

  it('says why each language past the allowance cannot be switched on', () => {
    setup({ locales: { stored: [NL, FR], live: [NL, FR], limit: 2 } });

    expect(screen.getByRole('switch', { name: 'German' })).toHaveAttribute(
      'data-disabled',
      '',
    );
    expect(screen.getAllByText('Turn one off to switch this on')).toHaveLength(
      2,
    );
  });

  it('shows the languages the site serves as live', () => {
    setup({ locales: { stored: [NL, FR, DE], live: [NL, DE], limit: 2 } });

    expect(screen.getByRole('switch', { name: 'German' })).toHaveAttribute(
      'data-checked',
      '',
    );
    expect(screen.getByRole('switch', { name: 'French' })).toHaveAttribute(
      'data-unchecked',
      '',
    );
  });

  it('explains the upgrade and offers nothing when the plan allows only the default', () => {
    setup({ locales: { stored: [], live: [], limit: 0 } });

    expect(
      screen.getByText(
        'Your plan publishes the default language only. Upgrade to add more languages.',
      ),
    ).toBeInTheDocument();
    for (const toggle of screen.getAllByRole('switch')) {
      expect(toggle).toHaveAttribute('data-disabled', '');
    }
  });

  describe('after a downgrade', () => {
    it('says which languages stay live and marks the rest as kept', () => {
      setup({ locales: { stored: [NL, FR, DE], live: [NL, FR], limit: 2 } });

      expect(screen.getByText(/The first 2 stay live/)).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: 'German' })).toHaveAttribute(
        'data-unchecked',
        '',
      );
      expect(
        screen.getByText('Kept, not live on your plan'),
      ).toBeInTheDocument();
    });

    it('locks every live language and says why', () => {
      setup({ locales: { stored: [NL, FR, DE], live: [NL, FR], limit: 2 } });

      for (const name of ['Dutch', 'French']) {
        expect(screen.getByRole('switch', { name })).toHaveAttribute(
          'data-disabled',
          '',
        );
      }
      expect(
        screen.getAllByText('Upgrade your plan to change this'),
      ).toHaveLength(4);
    });

    it('does not offer a language that was never saved', () => {
      setup({ locales: { stored: [NL, FR, DE], live: [NL, FR], limit: 2 } });

      expect(screen.getByRole('switch', { name: 'Spanish' })).toHaveAttribute(
        'data-disabled',
        '',
      );
    });
  });

  it('offers no Save until something changes', () => {
    setup({ locales: { stored: [ES], live: [ES], limit: 2 } });

    expect(
      screen.queryByRole('button', { name: 'Save changes' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('All changes saved')).not.toBeInTheDocument();
  });

  it('counts each toggled language and restores the saved ones on Discard', async () => {
    setup({ locales: { stored: [ES], live: [ES], limit: 2 } });

    await user.click(screen.getByRole('switch', { name: 'Spanish' }));
    await user.click(screen.getByRole('switch', { name: 'Dutch' }));

    expect(
      screen.getByRole('region', { name: 'Unsaved changes' }),
    ).toHaveTextContent('2 unsaved changes');

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(screen.getByRole('switch', { name: 'Spanish' })).toHaveAttribute(
      'data-checked',
      '',
    );
    expect(screen.getByRole('switch', { name: 'Dutch' })).toHaveAttribute(
      'data-unchecked',
      '',
    );
  });
});
