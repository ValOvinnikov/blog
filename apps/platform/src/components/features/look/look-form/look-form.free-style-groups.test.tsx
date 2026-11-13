import { TENANT_PLAN } from '@blog/config/constants';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import {
  setupLookForm,
  withLookTenant,
} from '@platform/testing/look/look-form-setup';
import { expectStyleGroupLockedAtDefault } from '@platform/testing/look/look-free-locks';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/components/features/look/look-preview');

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('on Free', () => {
    beforeEach(() => {
      setupLookForm(withLookTenant({ plan: TENANT_PLAN.FREE }));
    });

    it.each([
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.headerBarStyleLabel,
        current: LOOK_FORM.headerBarStyleOptionLabel.FULL_WIDTH,
        other: LOOK_FORM.headerBarStyleOptionLabel.FLOATING,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.navLinkStyleLabel,
        current: LOOK_FORM.navLinkStyleOptionLabel.PLAIN,
        other: LOOK_FORM.navLinkStyleOptionLabel.PILL,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.headerControlShapeLabel,
        current: LOOK_FORM.headerControlShapeOptionLabel.ROUND,
        other: LOOK_FORM.headerControlShapeOptionLabel.SQUARE,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountButtonStyleLabel,
        current: LOOK_FORM.accountButtonStyleOptionLabel.PILL,
        other: LOOK_FORM.accountButtonStyleOptionLabel.CIRCLE,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountPanelStyleLabel,
        current: LOOK_FORM.accountPanelStyleOptionLabel.CARD,
        other: LOOK_FORM.accountPanelStyleOptionLabel.HUB,
      },
      {
        row: LOOK_ROW.HEADER,
        group: LOOK_FORM.accountPhonePlacementLabel,
        current: LOOK_FORM.accountPhonePlacementOptionLabel.BAR,
        other: LOOK_FORM.accountPhonePlacementOptionLabel.MENU,
      },
    ])('shows $group locked at its default', async (lockedGroup) => {
      await expectStyleGroupLockedAtDefault(user, lockedGroup);
    });
  });
});
