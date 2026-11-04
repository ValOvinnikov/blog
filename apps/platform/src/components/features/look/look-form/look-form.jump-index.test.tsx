import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_CURRENT, ARIA_EXPANDED } from '@platform/testing/aria';
import { screen, waitFor, within } from '@platform/testing/custom-render';
import { PREVIEW_TAB } from '@platform/testing/look/look-form-fixtures';
import {
  lookRowTrigger,
  nudgeAccentHue,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { stubLgUpWindow } from '@platform/testing/match-media';
import { LOOK_ROWS } from '@platform/utils/look-open-rows/look-open-rows';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

const CURRENT_LOCATION = 'location';

const jumpIndex = () =>
  screen.getByRole('navigation', { name: LOOK_FORM.jumpIndexAriaLabel });

const cardLink = (name: string) =>
  within(jumpIndex()).getByRole('link', { name });

const rowLink = (row: keyof typeof LOOK_ROW_TITLE_KEY) =>
  cardLink(LOOK_FORM[LOOK_ROW_TITLE_KEY[row]]);

const toggleAllButton = (name: string) =>
  within(jumpIndex()).getByRole('button', { name });

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

    it('lists Preset, both groups and every card in page order', () => {
      const links = within(jumpIndex()).getAllByRole('link');

      expect(links.map((link) => link.textContent)).toEqual([
        LOOK_FORM.presetLabel,
        LOOK_FORM.styleGroupHeading,
        LOOK_FORM.colourHeading,
        LOOK_FORM.brandHeading,
        LOOK_FORM.typeHeading,
        LOOK_FORM.shapeHeading,
        LOOK_FORM.buttonsHeading,
        LOOK_FORM.sitePartsGroupHeading,
        LOOK_FORM.headerHeading,
        LOOK_FORM.footerHeading,
        LOOK_FORM.languageSwitcherLabel,
      ]);
    });

    it('marks Preset current while no row is open', () => {
      const preset = cardLink(LOOK_FORM.presetLabel);

      expect(preset).toHaveAttribute(ARIA_CURRENT, CURRENT_LOCATION);
    });

    it('opens a folded row from its link, focuses it and marks it current', async () => {
      await user.click(rowLink(LOOK_ROW.FOOTER));

      const trigger = lookRowTrigger(LOOK_ROW.FOOTER);
      expect(trigger).toHaveAttribute(ARIA_EXPANDED, 'true');
      await waitFor(() => expect(trigger).toHaveFocus());
      expect(rowLink(LOOK_ROW.FOOTER)).toHaveAttribute(
        ARIA_CURRENT,
        CURRENT_LOCATION,
      );
    });

    it('keeps the open row current over the topmost card in view', async () => {
      await openLookRow(user, LOOK_ROW.FOOTER);

      const preset = cardLink(LOOK_FORM.presetLabel);
      expect(preset).not.toHaveAttribute(ARIA_CURRENT);
      expect(rowLink(LOOK_ROW.FOOTER)).toHaveAttribute(
        ARIA_CURRENT,
        CURRENT_LOCATION,
      );
    });

    it('folds the open row when another row opens from its link', async () => {
      await openLookRow(user, LOOK_ROW.COLOUR);

      await user.click(rowLink(LOOK_ROW.HEADER));

      const colour = lookRowTrigger(LOOK_ROW.COLOUR);
      expect(colour).toHaveAttribute(ARIA_EXPANDED, 'false');
    });

    it('scrolls to a group from its link', async () => {
      const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView');
      const styleLink = cardLink(LOOK_FORM.styleGroupHeading);

      await user.click(styleLink);

      const styleGroup = screen.getByRole('region', {
        name: LOOK_FORM.styleGroupHeading,
      });
      await waitFor(() =>
        expect(scrollIntoView.mock.contexts).toContain(styleGroup),
      );
    });

    it('opens every row with Expand all, then reads Collapse all', async () => {
      await user.click(toggleAllButton(LOOK_FORM.expandAll));

      for (const row of LOOK_ROWS) {
        expect(lookRowTrigger(row)).toHaveAttribute(ARIA_EXPANDED, 'true');
      }
      expect(toggleAllButton(LOOK_FORM.collapseAll)).toBeInTheDocument();
      expect(cardLink(LOOK_FORM.presetLabel)).toHaveAttribute(
        ARIA_CURRENT,
        CURRENT_LOCATION,
      );
    });

    it('folds every row with Collapse all', async () => {
      await user.click(toggleAllButton(LOOK_FORM.expandAll));

      await user.click(toggleAllButton(LOOK_FORM.collapseAll));

      for (const row of LOOK_ROWS) {
        expect(lookRowTrigger(row)).toHaveAttribute(ARIA_EXPANDED, 'false');
      }
    });

    it('reads Expand all again and keeps the rest open once one row folds by hand', async () => {
      await user.click(toggleAllButton(LOOK_FORM.expandAll));

      await user.click(lookRowTrigger(LOOK_ROW.TYPE));

      expect(toggleAllButton(LOOK_FORM.expandAll)).toBeInTheDocument();
      expect(lookRowTrigger(LOOK_ROW.COLOUR)).toHaveAttribute(
        ARIA_EXPANDED,
        'true',
      );
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

    it('shows the groups as labels, not links, and offers no Expand all', () => {
      const index = jumpIndex();
      const groupLink = within(index).queryByRole('link', {
        name: LOOK_FORM.styleGroupHeading,
      });
      const expandAll = within(index).queryByRole('button', {
        name: LOOK_FORM.expandAll,
      });

      expect(groupLink).not.toBeInTheDocument();
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
