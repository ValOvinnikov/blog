import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { LOOK_ROW } from '@platform/constants/look-row';
import {
  BUTTON_COLOR_DARK_FOLLOWS,
  BUTTON_COLOR_FOLLOWS_ACCENT,
  followSwitch,
} from '@platform/testing/look/look-button-color';
import { GROWTH_BADGE_TEXT } from '@platform/testing/look/look-form-fixtures';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import {
  setupLookForm,
  withLookPlan,
} from '@platform/testing/look/look-form-setup';
import { TENANT_PLAN } from '@shinefold/config/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe.each([
    { plan: TENANT_PLAN.FREE, isOperator: false },
    { plan: TENANT_PLAN.STARTER, isOperator: false },
    { plan: TENANT_PLAN.STARTER, isOperator: true },
  ])('on $plan with isOperator $isOperator', ({ plan, isOperator }) => {
    beforeEach(async () => {
      setupLookForm({ ...withLookPlan(plan), isOperator });
      await openLookRow(user, LOOK_ROW.COLOUR);
    });

    it.each([BUTTON_COLOR_FOLLOWS_ACCENT, BUTTON_COLOR_DARK_FOLLOWS])(
      'locks %s with the plan it comes with',
      async (name) => {
        const lockedSwitch = followSwitch(`${name} ${GROWTH_BADGE_TEXT}`);

        await user.click(lockedSwitch);

        expect(lockedSwitch).toBeChecked();
        expect(lockedSwitch).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
      },
    );
  });
});
