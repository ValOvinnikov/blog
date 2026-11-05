import { LOOK_CARD } from '@platform/constants/look-card';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_CURRENT, ARIA_EXPANDED } from '@platform/testing/aria';
import { act, waitFor } from '@platform/testing/custom-render';
import { lookRowTrigger } from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import {
  CURRENT_LOCATION,
  rowLink,
  scrollPastCardsAbove,
  toggleAllButton,
} from '@platform/testing/look/look-jump-index';
import { stubLgUpWindow } from '@platform/testing/match-media';
import { LOOK_ROWS } from '@platform/utils/look-open-rows/look-open-rows';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

describe(`<${LookForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('the jump index from lg', () => {
    beforeEach(() => {
      stubLgUpWindow();
      setupLookForm();
    });

    describe('after Expand all', () => {
      beforeEach(async () => {
        await user.click(toggleAllButton(LOOK_FORM.expandAll));
      });

      it('opens every row and reads Collapse all', () => {
        for (const row of LOOK_ROWS) {
          expect(lookRowTrigger(row)).toHaveAttribute(ARIA_EXPANDED, 'true');
        }
        expect(toggleAllButton(LOOK_FORM.collapseAll)).toBeInTheDocument();
      });

      it('marks the topmost card in view current', async () => {
        scrollPastCardsAbove(LOOK_CARD.BRAND);

        await waitFor(() =>
          expect(rowLink(LOOK_ROW.BRAND)).toHaveAttribute(
            ARIA_CURRENT,
            CURRENT_LOCATION,
          ),
        );
      });

      it('marks a row current once a control inside it takes focus', () => {
        const typeTrigger = lookRowTrigger(LOOK_ROW.TYPE);

        act(() => typeTrigger.focus());

        expect(rowLink(LOOK_ROW.TYPE)).toHaveAttribute(
          ARIA_CURRENT,
          CURRENT_LOCATION,
        );
      });

      it('folds every row with Collapse all', async () => {
        await user.click(toggleAllButton(LOOK_FORM.collapseAll));

        for (const row of LOOK_ROWS) {
          expect(lookRowTrigger(row)).toHaveAttribute(ARIA_EXPANDED, 'false');
        }
      });

      it('reads Expand all again and keeps the rest open once one row folds by hand', async () => {
        await user.click(lookRowTrigger(LOOK_ROW.TYPE));

        expect(toggleAllButton(LOOK_FORM.expandAll)).toBeInTheDocument();
        expect(lookRowTrigger(LOOK_ROW.COLOUR)).toHaveAttribute(
          ARIA_EXPANDED,
          'true',
        );
      });
    });
  });
});
