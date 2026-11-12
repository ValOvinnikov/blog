import { TENANT_PLAN } from '@blog/db/constants';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { OUTLINED } from '@platform/testing/look/look-form-fixtures';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import {
  setupLookForm,
  withLookTenant,
} from '@platform/testing/look/look-form-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

const SECTION_NOTE = LOOK_FORM.cardStyleSectionNote;

const USE_PRESET_CARD_STYLE = makeEnTranslator('lookForm')(
  'usePresetValueAriaLabel',
  { field: LOOK_FORM.cardStyleLabel },
);

describe(`<${LookForm.name}/> card style section note`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('on a paid plan', () => {
    beforeEach(async () => {
      setupLookForm();
      await openLookRow(user, LOOK_ROW.CARDS);
    });

    it('shows the note after the selected card style line', () => {
      const selectedLine = screen.getByText(
        LOOK_FORM.cardStyleOptionDescription.ACCENT_BAR,
      );
      const note = screen.getByText(SECTION_NOTE);

      expect(note).toBeVisible();
      expect(selectedLine.compareDocumentPosition(note)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });

    it('keeps the note out of the card style descriptions', () => {
      const tiles = screen.getByRole('radiogroup', {
        name: LOOK_FORM.cardStyleLabel,
      });
      const outlinedTile = within(tiles).getByRole('radio', { name: OUTLINED });

      expect(tiles).not.toHaveAccessibleDescription(
        expect.stringContaining(SECTION_NOTE),
      );
      expect(outlinedTile).not.toHaveAccessibleDescription(
        expect.stringContaining(SECTION_NOTE),
      );
    });

    it('moves the note under the use preset value link once the style changes', async () => {
      const outlinedTile = screen.getByRole('radio', { name: OUTLINED });
      await user.click(outlinedTile);

      const usePresetButton = screen.getByRole('button', {
        name: USE_PRESET_CARD_STYLE,
      });
      const note = screen.getByText(SECTION_NOTE);
      expect(usePresetButton.compareDocumentPosition(note)).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      );
    });
  });

  it('shows the note on Free with Card style locked', async () => {
    setupLookForm(withLookTenant({ plan: TENANT_PLAN.FREE }));
    await openLookRow(user, LOOK_ROW.CARDS);

    const note = screen.getByText(SECTION_NOTE);

    expect(note).toBeVisible();
  });
});
