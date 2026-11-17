import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen } from '@platform/testing/custom-render';
import { OUTLINED } from '@platform/testing/look/look-form-fixtures';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import {
  saveAndExpectLook,
  saveChosenStyle,
} from '@platform/testing/look/look-form-save';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import {
  CARD_STYLE,
  DIVIDER_WIDTH,
  HEADING_CASE,
  HEADING_WEIGHT,
  IMAGE_PROPORTION,
} from '@shinefold/config';
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

  describe('with the default values', () => {
    beforeEach(() => {
      setupLookForm();
    });

    it.each([
      {
        row: LOOK_ROW.TYPE,
        group: LOOK_FORM.headingWeightLabel,
        option: LOOK_FORM.headingWeightOptionLabel.BOLD,
        saved: { headingWeight: HEADING_WEIGHT.BOLD },
      },
      {
        row: LOOK_ROW.TYPE,
        group: LOOK_FORM.headingCaseLabel,
        option: LOOK_FORM.headingCaseOptionLabel.UPPERCASE,
        saved: { headingCase: HEADING_CASE.UPPERCASE },
      },
      {
        row: LOOK_ROW.SHAPE,
        group: LOOK_FORM.imageProportionLabel,
        option: LOOK_FORM.imageProportionOptionLabel.SQUARE,
        saved: { imageProportion: IMAGE_PROPORTION.SQUARE },
      },
      {
        row: LOOK_ROW.SHAPE,
        group: LOOK_FORM.dividerWidthLabel,
        option: LOOK_FORM.dividerWidthOptionLabel.BOLD,
        saved: { dividerWidth: DIVIDER_WIDTH.BOLD },
      },
    ])('saves the chosen $group style', (style) =>
      saveChosenStyle(user, style),
    );

    it('saves the chosen Card style tile', async () => {
      await openLookRow(user, LOOK_ROW.CARDS);
      const outlinedTile = screen.getByRole('radio', { name: OUTLINED });
      await user.click(outlinedTile);

      await saveAndExpectLook(user, { cardStyle: CARD_STYLE.OUTLINED });
    });
  });
});
