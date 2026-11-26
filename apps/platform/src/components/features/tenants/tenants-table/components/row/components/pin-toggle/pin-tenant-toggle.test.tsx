import { setTenantPinAction } from '@platform/server/tenants/set-tenant-pin-action';
import { screen } from '@platform/testing/custom-render';
import { holdPinSave } from '@platform/testing/pinned-tenants/held-save';
import { pinLabelsFor } from '@platform/testing/pinned-tenants/pin-labels';
import { customRenderInPinnedTenants } from '@platform/testing/pinned-tenants/render-in-pinned-tenants';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { mockPinnedTenant } from '@platform/testing/tenants/pinned-tenant';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { PinTenantToggle } from './pin-tenant-toggle';

vi.mock('@platform/server/tenants/set-tenant-pin-action');

const { pinLabel, unpinLabel } = pinLabelsFor(MOCK_TENANT_NAME);

const setup = customRenderInPinnedTenants(PinTenantToggle, {
  tenant: mockPinnedTenant(),
});

describe(`<${PinTenantToggle.name}/>`, () => {
  let user: UserEvent;
  let save: ReturnType<typeof holdPinSave>;

  beforeEach(() => {
    user = userEvent.setup();
    save = holdPinSave();
  });

  afterEach(async () => {
    await save.settle();
  });

  describe('for a tenant that is not pinned', () => {
    let toggle: HTMLElement;

    beforeEach(() => {
      setup();
      toggle = screen.getByRole('button', { name: pinLabel });
    });

    it('offers to pin it, unpressed', () => {
      expect(toggle).not.toBePressed();
    });

    it('pins it at once and saves the pin', async () => {
      await user.click(toggle);

      const pinnedToggle = screen.getByRole('button', { name: unpinLabel });

      expect(pinnedToggle).toBePressed();
      expect(setTenantPinAction).toHaveBeenCalledWith(MOCK_TENANT_ID, true);
    });
  });

  describe('for a tenant that is pinned', () => {
    let toggle: HTMLElement;

    beforeEach(() => {
      setup({}, { pinnedTenants: [mockPinnedTenant()] });
      toggle = screen.getByRole('button', { name: unpinLabel });
    });

    it('offers to unpin it, pressed', () => {
      expect(toggle).toBePressed();
    });

    it('unpins it at once and saves the removal', async () => {
      await user.click(toggle);

      const unpinnedToggle = screen.getByRole('button', { name: pinLabel });

      expect(unpinnedToggle).not.toBePressed();
      expect(setTenantPinAction).toHaveBeenCalledWith(MOCK_TENANT_ID, false);
    });
  });
});
