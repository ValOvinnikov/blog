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

    const siteAddress = screen.getByRole('textbox', { name: LABEL });
    expect(siteAddress).toHaveAccessibleDescription(
      `.${MOCK_TENANT_ROOT_DOMAIN} ${HINT}`,
    );
  });

  it('shows no suffix when no root domain is set', () => {
    setup({ rootDomain: undefined });

    const suffix = screen.queryByText(`.${MOCK_TENANT_ROOT_DOMAIN}`);
    expect(suffix).not.toBeInTheDocument();
    const siteAddress = screen.getByRole('textbox', { name: LABEL });
    expect(siteAddress).toHaveAccessibleDescription(HINT);
  });

  it('trims and lowercases the typed address', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    setup({ onChange });

    const siteAddress = screen.getByRole('textbox', { name: LABEL });
    await user.click(siteAddress);
    await user.paste('  My-Site ');

    expect(onChange).toHaveBeenCalledWith('my-site');
  });
});
