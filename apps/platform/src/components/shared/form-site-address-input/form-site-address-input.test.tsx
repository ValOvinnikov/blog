import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_ROOT_DOMAIN } from '@platform/testing/tenants/fixtures';
import userEvent from '@testing-library/user-event';

import { FormSiteAddressInput } from './form-site-address-input';

const LABEL = 'Site address';
const HINT = 'Letters, numbers and hyphens';

const setup = customRender(FormSiteAddressInput, {
  label: LABEL,
  hint: HINT,
  value: '',
  onChange: vi.fn(),
  rootDomain: MOCK_TENANT_ROOT_DOMAIN,
});

describe(FormSiteAddressInput, () => {
  it('describes the input with its domain suffix and hint', () => {
    setup();

    expect(
      screen.getByRole('textbox', { name: LABEL }),
    ).toHaveAccessibleDescription(`.${MOCK_TENANT_ROOT_DOMAIN} ${HINT}`);
  });

  it('shows no suffix when no root domain is set', () => {
    setup({ rootDomain: undefined });

    expect(
      screen.queryByText(`.${MOCK_TENANT_ROOT_DOMAIN}`),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: LABEL }),
    ).toHaveAccessibleDescription(HINT);
  });

  it('trims and lowercases the typed address', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup({ onChange });

    await user.click(screen.getByRole('textbox', { name: LABEL }));
    await user.paste('  My-Site ');

    expect(onChange).toHaveBeenCalledWith('my-site');
  });
});
