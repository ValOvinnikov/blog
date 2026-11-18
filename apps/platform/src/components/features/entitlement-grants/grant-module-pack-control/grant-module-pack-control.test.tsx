import { ENTITLEMENT_GRANT_EXPIRY } from '@platform/constants/entitlement-grant';
import en from '@platform/i18n/messages/en.json';
import { grantEntitlementAction } from '@platform/server/entitlement-grants/grant-entitlement-action';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { mockGrantTarget } from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import { MODULE_PACK, TENANT_PLAN } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { GrantModulePackControl } from './grant-module-pack-control';

vi.mock('@platform/server/entitlement-grants/grant-entitlement-action');

const { grantDialog, grantModulePack, grantItemNames } = en;
const t = makeEnTranslator('grantModulePack');
const tGrant = makeEnTranslator('grantEntitlement');
const TARGET = mockGrantTarget({ plan: TENANT_PLAN.STARTER });
const GROWTH_MODULES = grantItemNames.modulePack[MODULE_PACK.GROWTH];
const STARTER_MODULES = grantItemNames.modulePack[MODULE_PACK.STARTER];

const setup = customRender(GrantModulePackControl, { target: TARGET });

describe(`<${GrantModulePackControl.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
  });

  describe('with the dialog open', () => {
    let packSelect: HTMLElement;
    let grant: HTMLElement;

    beforeEach(async () => {
      setup();
      const trigger = screen.getByRole('button', {
        name: grantModulePack.trigger,
      });
      await user.click(trigger);
      packSelect = await screen.findByRole('combobox', {
        name: grantModulePack.packLabel,
      });
      grant = screen.getByRole('button', { name: grantDialog.confirmButton });
    });

    it('names the tenant and the plan the pack is outside', () => {
      const dialog = screen.getByRole('alertdialog', {
        name: t('title', { tenant: TARGET.tenantName }),
      });
      const description = screen.getByText(
        t('description', { plan: en.planNames[TARGET.plan] }),
      );

      expect(dialog).toBeVisible();
      expect(description).toBeVisible();
    });

    it('offers no grant until a pack is chosen', () => {
      expect(grant).toBeDisabled();
    });

    it('lists a pack the plan includes but keeps it from being chosen', async () => {
      await user.click(packSelect);

      const included = await screen.findByRole('option', {
        name: t('packIncluded', { pack: STARTER_MODULES }),
      });
      const grantable = screen.getByRole('option', { name: GROWTH_MODULES });

      expect(included).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(grantable).not.toHaveAttribute(ARIA_DISABLED);
    });

    it('grants the chosen pack, confirming it by name', async () => {
      vi.mocked(grantEntitlementAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      await user.click(packSelect);
      const growthModules = await screen.findByRole('option', {
        name: GROWTH_MODULES,
      });
      await user.click(growthModules);
      await user.click(grant);

      const toast = await screen.findByText(
        tGrant('granted', { item: GROWTH_MODULES }),
      );

      expect(grantEntitlementAction).toHaveBeenCalledWith(TARGET.tenantId, {
        item: { kind: ENTITLEMENT_KIND.MODULE_PACK, key: MODULE_PACK.GROWTH },
        expiry: ENTITLEMENT_GRANT_EXPIRY.NEVER,
        note: '',
      });
      expect(toast).toBeVisible();
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('keeps the chosen pack when the grant fails, naming it in the alert', async () => {
      vi.mocked(grantEntitlementAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      await user.click(packSelect);
      const growthModules = await screen.findByRole('option', {
        name: GROWTH_MODULES,
      });
      await user.click(growthModules);
      await user.click(grant);

      const alert = await screen.findByText(
        tGrant('failed', { item: GROWTH_MODULES }),
      );

      expect(alert).toBeVisible();
      expect(packSelect).toHaveTextContent(GROWTH_MODULES);
    });
  });
});
