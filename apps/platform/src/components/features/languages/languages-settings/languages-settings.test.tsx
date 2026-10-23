import { ACTION_OUTCOME, LOCALE_ISO_CODES } from '@blog/config';
import { updateTenantLanguagesAction } from '@platform/server/tenants/update-tenant-languages-action';
import { customRender, screen, waitFor } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LanguagesSettings } from './languages-settings';

vi.mock('@platform/server/tenants/update-tenant-languages-action', () => ({
  updateTenantLanguagesAction: vi.fn(),
}));

const updateTenantLanguagesActionMock = vi.mocked(updateTenantLanguagesAction);

mockRouterRefresh();

const { EN, NL, FR, DE, ES } = LOCALE_ISO_CODES;

const setup = customRender(LanguagesSettings, {
  tenantId: MOCK_TENANT_ID,
  defaultLocale: EN,
  locales: { stored: [], live: [], limit: 2 },
});

const DATA_DISABLED = 'data-disabled';
const SAVE_CHANGES = 'Save changes';
const DATA_CHECKED = 'data-checked';
const DATA_UNCHECKED = 'data-unchecked';

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
      DATA_DISABLED,
      '',
    );
    expect(screen.getByRole('switch', { name: 'Dutch' })).not.toHaveAttribute(
      DATA_DISABLED,
    );
  });

  it('saves the chosen additional languages', async () => {
    updateTenantLanguagesActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    setup();

    await user.click(screen.getByRole('switch', { name: 'French' }));
    await user.click(screen.getByRole('switch', { name: 'Dutch' }));
    await user.click(screen.getByRole('button', { name: SAVE_CHANGES }));

    await waitFor(() => {
      expect(updateTenantLanguagesActionMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        [NL, FR],
      );
    });
  });

  it('says why each language past the allowance cannot be switched on', () => {
    setup({ locales: { stored: [NL, FR], live: [NL, FR], limit: 2 } });

    expect(screen.getByRole('switch', { name: 'German' })).toHaveAttribute(
      DATA_DISABLED,
      '',
    );
    expect(screen.getAllByText('Turn one off to switch this on')).toHaveLength(
      2,
    );
  });

  it('shows the languages the site serves as live', () => {
    setup({ locales: { stored: [NL, FR, DE], live: [NL, DE], limit: 2 } });

    expect(screen.getByRole('switch', { name: 'German' })).toHaveAttribute(
      DATA_CHECKED,
      '',
    );
    expect(screen.getByRole('switch', { name: 'French' })).toHaveAttribute(
      DATA_UNCHECKED,
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
      expect(toggle).toHaveAttribute(DATA_DISABLED, '');
    }
  });

  describe('after a downgrade', () => {
    it('says which languages stay live and marks the rest as kept', () => {
      setup({ locales: { stored: [NL, FR, DE], live: [NL, FR], limit: 2 } });

      expect(screen.getByText(/The first 2 stay live/)).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: 'German' })).toHaveAttribute(
        DATA_UNCHECKED,
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
          DATA_DISABLED,
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
        DATA_DISABLED,
        '',
      );
    });
  });

  it('offers no Save until something changes', () => {
    setup({ locales: { stored: [ES], live: [ES], limit: 2 } });

    expect(
      screen.queryByRole('button', { name: SAVE_CHANGES }),
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
      DATA_CHECKED,
      '',
    );
    expect(screen.getByRole('switch', { name: 'Dutch' })).toHaveAttribute(
      DATA_UNCHECKED,
      '',
    );
  });
});
