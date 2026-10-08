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
  storedLocales: [],
  additionalLocaleLimit: 2,
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
      screen.getByText(
        'Every page is written in it first; set it in the tenant details.',
      ),
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

  it('explains the upgrade and offers nothing when the plan allows only the default', () => {
    setup({ additionalLocaleLimit: 0 });

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
    it('asks which languages stay live and marks the rest as kept', () => {
      setup({ storedLocales: [NL, FR, DE], additionalLocaleLimit: 2 });

      expect(screen.getByText(/Choose which stay live/)).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: 'German' })).toHaveAttribute(
        'data-unchecked',
        '',
      );
      expect(
        screen.getByText('Kept, not live on your plan'),
      ).toBeInTheDocument();
    });

    it('keeps every stored language when a different one is chosen to stay live', async () => {
      const saveAction = vi.fn().mockResolvedValue({ ok: true });
      setup({
        storedLocales: [NL, FR, DE],
        additionalLocaleLimit: 2,
        saveAction,
      });

      await user.click(screen.getByRole('switch', { name: 'French' }));
      await user.click(screen.getByRole('switch', { name: 'German' }));
      await user.click(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => {
        expect(saveAction).toHaveBeenCalledWith('tenant-1', [NL, DE, FR]);
      });
    });

    it('does not offer a language that was never saved', () => {
      setup({ storedLocales: [NL, FR, DE], additionalLocaleLimit: 2 });

      expect(screen.getByRole('switch', { name: 'Spanish' })).toHaveAttribute(
        'data-disabled',
        '',
      );
    });
  });

  it('offers no Save until something changes', () => {
    setup({ storedLocales: [ES] });

    expect(
      screen.queryByRole('button', { name: 'Save changes' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('All changes saved')).toBeVisible();
  });

  it('counts each toggled language and restores the saved ones on Discard', async () => {
    setup({ storedLocales: [ES] });

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
