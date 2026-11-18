import { ENTITLEMENT_GRANT_EXPIRY } from '@platform/constants/entitlement-grant';
import en from '@platform/i18n/messages/en.json';
import { grantEntitlementAction } from '@platform/server/entitlement-grants/grant-entitlement-action';
import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { mockGrantTarget } from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { GrantLanguagesControl } from './grant-languages-control';

vi.mock('@platform/server/entitlement-grants/grant-entitlement-action');

const { grantDialog, grantLanguages } = en;
const t = makeEnTranslator('grantLanguages');
const tGrant = makeEnTranslator('grantEntitlement');
const tNames = makeEnTranslator('grantItemNames');
const TARGET = mockGrantTarget({ plan: TENANT_PLAN.STARTER });
const THREE_LANGUAGES = tNames('languages', { count: 3 });
const ONE_LANGUAGE = tNames('languages', { count: 1 });
const FOUR_LANGUAGES = tNames('languages', { count: 4 });

const setup = customRender(GrantLanguagesControl, { target: TARGET });

describe(`<${GrantLanguagesControl.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
  });

  describe('with the dialog open', () => {
    let countSelect: HTMLElement;
    let grant: HTMLElement;

    beforeEach(async () => {
      setup();
      const trigger = screen.getByRole('button', {
        name: grantLanguages.trigger,
      });
      await user.click(trigger);
      countSelect = await screen.findByRole('combobox', {
        name: grantLanguages.countLabel,
      });
      grant = screen.getByRole('button', { name: grantDialog.confirmButton });
    });

    it('names the tenant and says the plan publishes the default language only', () => {
      const dialog = screen.getByRole('alertdialog', {
        name: t('title', { tenant: TARGET.tenantName }),
      });
      const description = screen.getByText(
        t('description', {
          plan: en.planNames[TARGET.plan],
          tenant: TARGET.tenantName,
        }),
      );

      expect(dialog).toBeVisible();
      expect(description).toBeVisible();
    });

    it('offers one to four additional languages, one by default', async () => {
      await user.click(countSelect);

      const options = await screen.findAllByRole('option');
      const optionNames = options.map((option) => option.textContent);

      expect(countSelect).toHaveTextContent(ONE_LANGUAGE);
      expect(optionNames).toEqual([
        ONE_LANGUAGE,
        tNames('languages', { count: 2 }),
        THREE_LANGUAGES,
        FOUR_LANGUAGES,
      ]);
    });

    it('grants a language limit counting the default language, then confirms the count', async () => {
      vi.mocked(grantEntitlementAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      await user.click(countSelect);
      const threeLanguages = await screen.findByRole('option', {
        name: THREE_LANGUAGES,
      });
      await user.click(threeLanguages);
      await user.click(grant);

      const toast = await screen.findByText(
        tGrant('granted', { item: THREE_LANGUAGES }),
      );

      expect(grantEntitlementAction).toHaveBeenCalledWith(TARGET.tenantId, {
        item: { kind: ENTITLEMENT_KIND.LOCALE_LIMIT, value: 4 },
        expiry: ENTITLEMENT_GRANT_EXPIRY.NEVER,
        note: '',
      });
      expect(toast).toBeVisible();
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('names the count in the alert when the grant fails', async () => {
      vi.mocked(grantEntitlementAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });
      await user.click(grant);

      const alert = await screen.findByText(
        tGrant('failed', { item: ONE_LANGUAGE }),
      );

      expect(alert).toBeVisible();
    });
  });
});
