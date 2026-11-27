import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen, within } from '@platform/testing/custom-render';
import { openLookRow } from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/components/features/look/look-preview');

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

describe(`<${LookForm.name}/> option descriptions`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setupLookForm();
  });

  describe('with the Header row open', () => {
    beforeEach(async () => {
      await openLookRow(user, LOOK_ROW.HEADER);
    });

    it('shows only labels in the header buttons tiles and describes the chosen one below', async () => {
      const headerButtonsField = screen.getByRole('group', {
        name: LOOK_FORM.headerControlStyleLabel,
      });
      const plainButton = within(headerButtonsField).getByRole('button', {
        name: LOOK_FORM.headerControlStyleOptionLabel.PLAIN,
      });
      await user.click(plainButton);
      const toggleGroup = within(headerButtonsField).getByRole('group');

      const tileDescription = within(plainButton).queryByText(
        LOOK_FORM.headerControlStyleOptionDescription.PLAIN,
      );

      expect(tileDescription).not.toBeInTheDocument();
      expect(plainButton).not.toHaveAccessibleDescription();
      expect(toggleGroup).toHaveAccessibleDescription(
        LOOK_FORM.headerControlStyleOptionDescription.PLAIN,
      );
    });
  });

  it.each([
    {
      row: LOOK_ROW.HEADER,
      label: LOOK_FORM.languageSwitcherStyleLabel,
      initialDescription: LOOK_FORM.languageSwitcherOptionDescription.MENU_CODE,
      option: LOOK_FORM.languageSwitcherOptionLabel.MENU_GLOBE,
      description: LOOK_FORM.languageSwitcherOptionDescription.MENU_GLOBE,
    },
    {
      row: LOOK_ROW.HEADER,
      label: LOOK_FORM.navLinkStyleLabel,
      initialDescription: LOOK_FORM.navLinkStyleOptionDescription.PLAIN,
      option: LOOK_FORM.navLinkStyleOptionLabel.UNDERLINE,
      description: LOOK_FORM.navLinkStyleOptionDescription.UNDERLINE,
    },
    {
      row: LOOK_ROW.HEADER,
      label: LOOK_FORM.headerControlShapeLabel,
      initialDescription: LOOK_FORM.headerControlShapeOptionDescription.ROUND,
      option: LOOK_FORM.headerControlShapeOptionLabel.SQUARE,
      description: LOOK_FORM.headerControlShapeOptionDescription.SQUARE,
    },
  ])(
    'describes the chosen $label option below the control',
    async ({ row, label, initialDescription, option, description }) => {
      await openLookRow(user, row);
      const field = screen.getByRole('group', { name: label });
      const optionButton = within(field).getByRole('button', {
        name: option,
      });
      const toggleGroup = within(field).getByRole('group');

      expect(toggleGroup).toHaveAccessibleDescription(initialDescription);

      await user.click(optionButton);

      expect(toggleGroup).toHaveAccessibleDescription(description);
    },
  );

  it('describes the Card style tiles by the chosen option below them', async () => {
    await openLookRow(user, LOOK_ROW.SHAPE);
    const tiles = screen.getByRole('radiogroup', {
      name: LOOK_FORM.cardStyleLabel,
    });
    const outlinedTile = within(tiles).getByRole('radio', {
      name: LOOK_FORM.cardStyleOptionLabel.OUTLINED,
    });

    expect(tiles).toHaveAccessibleDescription(
      `${LOOK_FORM.cardStyleOptionDescription.ACCENT_BAR} ${LOOK_FORM.cardStyleDescription}`,
    );

    await user.click(outlinedTile);

    expect(outlinedTile).toBeChecked();
    expect(tiles).toHaveAccessibleDescription(
      `${LOOK_FORM.cardStyleOptionDescription.OUTLINED} ${LOOK_FORM.cardStyleDescription}`,
    );
  });
});
