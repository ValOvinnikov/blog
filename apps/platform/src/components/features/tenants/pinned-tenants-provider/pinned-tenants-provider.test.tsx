import { faker } from '@faker-js/faker';
import { setTenantPinAction } from '@platform/server/tenants/set-tenant-pin-action';
import { screen, waitFor } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { holdPinSave } from '@platform/testing/pinned-tenants/held-save';
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

vi.mock('@platform/server/tenants/set-tenant-pin-action');

faker.seed(8079);

const MOCK_PIN_LABEL = faker.lorem.word();
const MOCK_UNPIN_LABEL = faker.lorem.word();
const tPinned = makeEnTranslator('pinnedTenants');
const MOCK_NAME_PARAMS = { name: MOCK_TENANT_NAME };
const SAVE_FAILED = tPinned('saveFailed', MOCK_NAME_PARAMS);

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

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('keeps an empty status region while nothing is pinned', () => {
    setup();

    const liveRegion = screen.getByRole('status');

    expect(liveRegion).toBeEmptyDOMElement();
  });

  it.each([
    {
      direction: 'pin',
      pinnedTenants: [],
      buttonLabel: MOCK_PIN_LABEL,
      announcement: tPinned('pinnedAnnouncement', MOCK_NAME_PARAMS),
    },
    {
      direction: 'unpin',
      pinnedTenants: [mockPinnedTenant()],
      buttonLabel: MOCK_UNPIN_LABEL,
      announcement: tPinned('unpinnedAnnouncement', MOCK_NAME_PARAMS),
    },
  ])(
    'announces a saved $direction to assistive technology',
    async ({ pinnedTenants, buttonLabel, announcement }) => {
      setup({}, { pinnedTenants });

      const pinChange = screen.getByRole('button', { name: buttonLabel });
      await user.click(pinChange);

      const liveRegion = screen.getByRole('status');

      await waitFor(() => {
        expect(liveRegion).toHaveTextContent(announcement);
      });
    },
  );

  describe('while the save is held', () => {
    let save: ReturnType<typeof holdPinSave>;

    beforeEach(() => {
      save = holdPinSave();
    });

    it('shows a new pin until its save settles and saves it for the tenant', async () => {
      setup({}, { pinnedTenants: [mockOtherPinnedTenant()] });

      const pinButton = screen.getByRole('button', { name: MOCK_PIN_LABEL });
      await user.click(pinButton);

      const pinnedName = screen.getByText(MOCK_TENANT_NAME);
      const otherName = screen.getByText(MOCK_OTHER_TENANT_NAME);

      expect(pinnedName).toBeVisible();
      expect(otherName).toBeVisible();
      expect(setTenantPinAction).toHaveBeenCalledWith(MOCK_TENANT_ID, true);

      await save.settle();
      const settledName = screen.queryByText(MOCK_TENANT_NAME);

      expect(settledName).not.toBeInTheDocument();
    });

    it('drops an unpinned tenant until its save settles and saves the removal', async () => {
      setup({}, { pinnedTenants: [mockPinnedTenant()] });

      const unpinButton = screen.getByRole('button', {
        name: MOCK_UNPIN_LABEL,
      });
      await user.click(unpinButton);

      const unpinnedName = screen.queryByText(MOCK_TENANT_NAME);

      expect(unpinnedName).not.toBeInTheDocument();
      expect(setTenantPinAction).toHaveBeenCalledWith(MOCK_TENANT_ID, false);

      await save.settle();
      const settledName = screen.getByText(MOCK_TENANT_NAME);

      expect(settledName).toBeVisible();
    });
  });

  describe('when saving fails', () => {
    beforeEach(async () => {
      vi.mocked(setTenantPinAction).mockResolvedValueOnce(
        toOutcome(ACTION_OUTCOME.SERVER_ERROR),
      );
      setup();

      const pinButton = screen.getByRole('button', { name: MOCK_PIN_LABEL });
      await user.click(pinButton);
      await screen.findByText(SAVE_FAILED);
    });

    it('undoes the pin and says so', async () => {
      const toast = screen.getByText(SAVE_FAILED);

      expect(toast).toBeVisible();
      await waitFor(() => {
        const pinnedName = screen.queryByText(MOCK_TENANT_NAME);

        expect(pinnedName).not.toBeInTheDocument();
      });
    });

    it('announces nothing to assistive technology', () => {
      const liveRegion = screen.getByRole('status');

      expect(liveRegion).toBeEmptyDOMElement();
    });
  });
});
