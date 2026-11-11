import { LOOK_ROW } from '@platform/constants/look-row';
import { ARIA_EXPANDED } from '@platform/testing/aria';
import {
  lookRowTrigger,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { useLookOpenRows } from './use-look-open-rows';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

describe(useLookOpenRows, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setupLookForm();
  });

  it.each(Object.values(LOOK_ROW))('loads the %s row folded', (row) => {
    const trigger = lookRowTrigger(row);

    expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'false');
  });

  it('folds an open Style row when a Site parts row opens', async () => {
    await openLookRow(user, LOOK_ROW.COLOUR);
    await openLookRow(user, LOOK_ROW.HEADER);

    const colourTrigger = lookRowTrigger(LOOK_ROW.COLOUR);
    const headerTrigger = lookRowTrigger(LOOK_ROW.HEADER);
    expect(colourTrigger).toHaveAttribute(ARIA_EXPANDED, 'false');
    expect(headerTrigger).toHaveAttribute(ARIA_EXPANDED, 'true');
  });
});
