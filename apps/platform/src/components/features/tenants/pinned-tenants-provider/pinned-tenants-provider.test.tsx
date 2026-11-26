import { faker } from '@faker-js/faker';
import { pinTenantAction } from '@platform/server/tenants/pin-tenant-action';
import { unpinTenantAction } from '@platform/server/tenants/unpin-tenant-action';
import { screen, waitFor } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { holdSave } from '@platform/testing/pinned-tenants/held-save';
import { customRenderInPinnedTenants } from '@platform/testing/pinned-tenants/render-in-pinned-tenants';
import {
  MOCK_OTHER_TENANT_NAME,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import {
  mockOtherPinnedTenant,
  mockPinnedTenant,
} from '@platform/testing/tenants/pinned-tenant';
import { ACTION_OUTCOME } from '@shinefold/config';
import { toOutcome } from '@shinefold/utils/to-outcome';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import {
  PinnedTenantsProvider,
  usePinnedTenants,
} from './pinned-tenants-provider';

vi.mock('@platform/server/tenants/pin-tenant-action');
vi.mock('@platform/server/tenants/unpin-tenant-action');

faker.seed(8079);

const MOCK_PIN_LABEL = faker.lorem.word();
const MOCK_UNPIN_LABEL = faker.lorem.word();
const tPinned = makeEnTranslator('pinnedTenants');

const PinsHarness = () => {
  const { pinnedTenants, setPinned } = usePinnedTenants();

  return (
    <>
      <ul>
        {pinnedTenants.map(({ id, name }) => (
          <li key={id}>{name}</li>
        ))}
      </ul>
      <button onClick={() => setPinned(mockPinnedTenant(), true)}>
        {MOCK_PIN_LABEL}
      </button>
      <button onClick={() => setPinned(mockPinnedTenant(), false)}>
        {MOCK_UNPIN_LABEL}
      </button>
    </>
  );
};

const setup = customRenderInPinnedTenants(PinsHarness, {});

describe(`<${PinnedTenantsProvider.name}/>`, () => {
  let user: UserEvent;
  let save: ReturnType<typeof holdSave>;

  beforeEach(() => {
    user = userEvent.setup();
    save = holdSave();
  });

  it('shows a new pin at once and saves it for the tenant', async () => {
    vi.mocked(pinTenantAction).mockReturnValueOnce(save.promise);
    setup({}, { pinnedTenants: [mockOtherPinnedTenant()] });

    const pinButton = screen.getByRole('button', { name: MOCK_PIN_LABEL });
    await user.click(pinButton);

    const pinnedName = screen.getByText(MOCK_TENANT_NAME);
    const otherName = screen.getByText(MOCK_OTHER_TENANT_NAME);

    expect(pinnedName).toBeVisible();
    expect(otherName).toBeVisible();
    expect(pinTenantAction).toHaveBeenCalledWith(MOCK_TENANT_ID);

    save.settle();
    await waitFor(() => {
      const settledName = screen.queryByText(MOCK_TENANT_NAME);

      expect(settledName).not.toBeInTheDocument();
    });
  });

  it('drops an unpinned tenant at once and saves the removal', async () => {
    vi.mocked(unpinTenantAction).mockReturnValueOnce(save.promise);
    setup({}, { pinnedTenants: [mockPinnedTenant()] });

    const unpinButton = screen.getByRole('button', { name: MOCK_UNPIN_LABEL });
    await user.click(unpinButton);

    const unpinnedName = screen.queryByText(MOCK_TENANT_NAME);

    expect(unpinnedName).not.toBeInTheDocument();
    expect(unpinTenantAction).toHaveBeenCalledWith(MOCK_TENANT_ID);

    save.settle();
    const settledName = await screen.findByText(MOCK_TENANT_NAME);

    expect(settledName).toBeVisible();
  });

  it('undoes the pin and says so when saving fails', async () => {
    vi.mocked(pinTenantAction).mockResolvedValueOnce(
      toOutcome(ACTION_OUTCOME.SERVER_ERROR),
    );
    setup();

    const pinButton = screen.getByRole('button', { name: MOCK_PIN_LABEL });
    await user.click(pinButton);

    const toast = await screen.findByText(
      tPinned('saveFailed', { name: MOCK_TENANT_NAME }),
    );

    expect(toast).toBeVisible();
    await waitFor(() => {
      const pinnedName = screen.queryByText(MOCK_TENANT_NAME);

      expect(pinnedName).not.toBeInTheDocument();
    });
  });
});
