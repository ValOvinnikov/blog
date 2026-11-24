import { faker } from '@faker-js/faker';
import { FIELD_APPEARANCE } from '@platform/constants/field-appearance';
import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_TENANT_ROOT_DOMAIN } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { FormSiteAddressInput } from './form-site-address-input';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_HINT = faker.lorem.sentence();
const MOCK_ERROR = faker.lorem.sentence();
const MOCK_SUFFIX = `.${MOCK_TENANT_ROOT_DOMAIN}`;
const MOCK_STATUS = faker.lorem.words(3);
const MOCK_COPY = { label: MOCK_LABEL, hint: MOCK_HINT };

const setup = customRender(FormSiteAddressInput, {
  copy: MOCK_COPY,
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
      `${MOCK_SUFFIX} ${MOCK_HINT}`,
    );
  });

  it('shows no suffix when no root domain is set', () => {
    setup({ rootDomain: undefined });

    const suffix = screen.queryByText(MOCK_SUFFIX);
    const siteAddress = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(suffix).not.toBeInTheDocument();
    expect(siteAddress).toHaveAccessibleDescription(MOCK_HINT);
  });

  it('describes an invalid input with its suffix, hint and error, in that order', () => {
    setup({ copy: { ...MOCK_COPY, error: MOCK_ERROR } });

    const siteAddress = screen.getByRole('textbox', { name: MOCK_LABEL });

    expect(siteAddress).toBeInvalid();
    expect(siteAddress).toHaveAccessibleDescription(
      `${MOCK_SUFFIX} ${MOCK_HINT} ${MOCK_ERROR}`,
    );
  });

  it('places the status between the address row and the hint in the wizard appearance', () => {
    setup({
      appearance: FIELD_APPEARANCE.WIZARD,
      status: <span>{MOCK_STATUS}</span>,
    });

    const suffix = screen.getByText(MOCK_SUFFIX);
    const status = screen.getByText(MOCK_STATUS);
    const hint = screen.getByText(MOCK_HINT);

    expect(suffix.compareDocumentPosition(status)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(status.compareDocumentPosition(hint)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
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
