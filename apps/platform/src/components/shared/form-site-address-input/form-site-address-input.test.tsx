import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_ROOT_DOMAIN } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { FormSiteAddressInput } from './form-site-address-input';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_HINT = faker.lorem.sentence();

const setup = customRender(FormSiteAddressInput, {
  label: MOCK_LABEL,
  hint: MOCK_HINT,
  value: '',
  onChange: vi.fn(),
  rootDomain: MOCK_TENANT_ROOT_DOMAIN,
});

describe(`<${FormSiteAddressInput.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('describes the input with its domain suffix and hint', () => {
    setup();

    const siteAddress = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(siteAddress).toHaveAccessibleDescription(
      `.${MOCK_TENANT_ROOT_DOMAIN} ${MOCK_HINT}`,
    );
  });

  it('shows no suffix when no root domain is set', () => {
    setup({ rootDomain: undefined });

    const suffix = screen.queryByText(`.${MOCK_TENANT_ROOT_DOMAIN}`);
    const siteAddress = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(suffix).not.toBeInTheDocument();
    expect(siteAddress).toHaveAccessibleDescription(MOCK_HINT);
  });

  it('trims and lowercases the typed address', async () => {
    const onChange = vi.fn();
    setup({ onChange });

    const siteAddress = screen.getByRole('textbox', { name: MOCK_LABEL });
    await user.click(siteAddress);
    await user.paste('  My-Site ');

    expect(onChange).toHaveBeenCalledWith('my-site');
  });
});
