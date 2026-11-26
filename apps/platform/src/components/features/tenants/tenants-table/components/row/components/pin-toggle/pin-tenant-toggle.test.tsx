import { pinTenantAction } from '@platform/server/tenants/pin-tenant-action';
import { unpinTenantAction } from '@platform/server/tenants/unpin-tenant-action';
import { screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { holdSave } from '@platform/testing/pinned-tenants/held-save';
import { customRenderInPinnedTenants } from '@platform/testing/pinned-tenants/render-in-pinned-tenants';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@platform/testing/tenants/fixtures';
import { mockPinnedTenant } from '@platform/testing/tenants/pinned-tenant';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { PinTenantToggle } from './pin-tenant-toggle';

vi.mock('@platform/server/tenants/pin-tenant-action');
vi.mock('@platform/server/tenants/unpin-tenant-action');

const tPinned = makeEnTranslator('pinnedTenants');
const NAMED = { name: MOCK_TENANT_NAME };
const PIN_LABEL = tPinned('pinAriaLabel', NAMED);
const UNPIN_LABEL = tPinned('unpinAriaLabel', NAMED);
const ARIA_PRESSED = 'aria-pressed';

const setup = customRenderInPinnedTenants(PinTenantToggle, {
  tenant: mockPinnedTenant(),
});

describe(`<${PinTenantToggle.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('for a tenant that is not pinned', () => {
    beforeEach(() => {
      setup();
    });

    it('offers to pin it, unpressed', () => {
      const toggle = screen.getByRole('button', { name: PIN_LABEL });

      expect(toggle).toHaveAttribute(ARIA_PRESSED, 'false');
    });

    it('pins it at once and saves the pin', async () => {
      const save = holdSave();
      vi.mocked(pinTenantAction).mockReturnValueOnce(save.promise);

      const toggle = screen.getByRole('button', { name: PIN_LABEL });
      await user.click(toggle);

      const pinnedToggle = screen.getByRole('button', { name: UNPIN_LABEL });

      expect(pinnedToggle).toHaveAttribute(ARIA_PRESSED, 'true');
      expect(pinTenantAction).toHaveBeenCalledWith(MOCK_TENANT_ID);

      save.settle();
      const settledToggle = await screen.findByRole('button', {
        name: PIN_LABEL,
      });

      expect(settledToggle).toBeVisible();
    });
  });

  describe('for a tenant that is pinned', () => {
    beforeEach(() => {
      setup({}, { pinnedTenants: [mockPinnedTenant()] });
    });

    it('offers to unpin it, pressed', () => {
      const toggle = screen.getByRole('button', { name: UNPIN_LABEL });

      expect(toggle).toHaveAttribute(ARIA_PRESSED, 'true');
    });

    it('unpins it at once and saves the removal', async () => {
      const save = holdSave();
      vi.mocked(unpinTenantAction).mockReturnValueOnce(save.promise);

      const toggle = screen.getByRole('button', { name: UNPIN_LABEL });
      await user.click(toggle);

      const unpinnedToggle = screen.getByRole('button', { name: PIN_LABEL });

      expect(unpinnedToggle).toHaveAttribute(ARIA_PRESSED, 'false');
      expect(unpinTenantAction).toHaveBeenCalledWith(MOCK_TENANT_ID);

      save.settle();
      const settledToggle = await screen.findByRole('button', {
        name: UNPIN_LABEL,
      });

      expect(settledToggle).toBeVisible();
    });
  });
});
