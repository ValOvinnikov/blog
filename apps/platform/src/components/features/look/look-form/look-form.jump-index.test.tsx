import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { screen, waitFor, within } from '@platform/testing/custom-render';
import { PREVIEW_TAB } from '@platform/testing/look/look-form-fixtures';
import {
  lookRowTrigger,
  nudgeAccentHue,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import {
  cardLink,
  CURRENT_LOCATION,
  jumpIndex,
  rowLink,
} from '@platform/testing/look/look-jump-index';
import { stubLgUpWindow } from '@platform/testing/match-media';
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

    it('lists Preset and every card in page order', () => {
      const links = within(jumpIndex()).getAllByRole('link');

      expect(links.map((link) => link.textContent)).toEqual([
        LOOK_FORM.presetLabel,
        LOOK_FORM.brandHeading,
        LOOK_FORM.colourHeading,
        LOOK_FORM.typeHeading,
        LOOK_FORM.shapeHeading,
        LOOK_FORM.headerHeading,
        LOOK_FORM.footerHeading,
        LOOK_FORM.detailsHeading,
      ]);
    });

    it('marks Preset current while no row is open', () => {
      const preset = cardLink(LOOK_FORM.presetLabel);

      expect(preset).toHaveAttribute(ARIA_ATTRIBUTE.CURRENT, CURRENT_LOCATION);
    });

    it('opens a folded row from its link, focuses it and marks it current', async () => {
      await user.click(rowLink(LOOK_ROW.FOOTER));

      const trigger = lookRowTrigger(LOOK_ROW.FOOTER);
      expect(trigger).toHaveAttribute(ARIA_ATTRIBUTE.EXPANDED, 'true');
      await waitFor(() => expect(trigger).toHaveFocus());
      expect(rowLink(LOOK_ROW.FOOTER)).toHaveAttribute(
        ARIA_ATTRIBUTE.CURRENT,
        CURRENT_LOCATION,
      );
    });

    it('keeps the open row current over the topmost card in view', async () => {
      await openLookRow(user, LOOK_ROW.FOOTER);

      const preset = cardLink(LOOK_FORM.presetLabel);
      expect(preset).not.toHaveAttribute(ARIA_ATTRIBUTE.CURRENT);
      expect(rowLink(LOOK_ROW.FOOTER)).toHaveAttribute(
        ARIA_ATTRIBUTE.CURRENT,
        CURRENT_LOCATION,
      );
    });

    it('folds the open row when another row opens from its link', async () => {
      await openLookRow(user, LOOK_ROW.COLOUR);

      await user.click(rowLink(LOOK_ROW.HEADER));

      const colour = lookRowTrigger(LOOK_ROW.COLOUR);
      expect(colour).toHaveAttribute(ARIA_ATTRIBUTE.EXPANDED, 'false');
    });

    it('names a card with unsaved changes', async () => {
      await nudgeAccentHue(user);

      const colour = cardLink(
        `${LOOK_FORM.colourHeading}${LOOK_FORM.jumpIndexUnsaved}`,
      );
      expect(colour).toBeInTheDocument();
    });
  });

  describe('the jump index below lg', () => {
    beforeEach(() => {
      setupLookForm();
    });

    it('offers no Expand all', () => {
      const index = jumpIndex();
      const expandAll = within(index).queryByRole('button', {
        name: LOOK_FORM.expandAll,
      });

      expect(expandAll).not.toBeInTheDocument();
    });

    it('is hidden on the Preview tab', async () => {
      const previewTab = screen.getByRole('tab', { name: PREVIEW_TAB });

      await user.click(previewTab);

      const index = screen.queryByRole('navigation', {
        name: LOOK_FORM.jumpIndexAriaLabel,
      });
      expect(index).not.toBeInTheDocument();
    });
  });
});
