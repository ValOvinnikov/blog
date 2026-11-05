import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import { LOOK_CARD, type TLookCard } from '@platform/constants/look-card';
import {
  LOOK_INDEX_FADE_END_TEST_ID,
  LOOK_INDEX_FADE_START_TEST_ID,
} from '@platform/constants/look-form';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_CURRENT, ARIA_EXPANDED } from '@platform/testing/aria';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import { PREVIEW_TAB } from '@platform/testing/look/look-form-fixtures';
import {
  lookRowTrigger,
  nudgeAccentHue,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import { stubLgUpWindow } from '@platform/testing/match-media';
import { toLookAnchorId } from '@platform/utils/look-anchor/look-anchor';
import {
  LOOK_CARDS,
  LOOK_ROWS,
} from '@platform/utils/look-open-rows/look-open-rows';
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

const ABOVE_INDEX = -1;
const BELOW_INDEX = 1;
const TRACK_WIDTH = 400;
const LIST_WIDTH = 900;

const scrollPastCardsAbove = (topmost: TLookCard) => {
  const aboveIds = LOOK_CARDS.slice(0, LOOK_CARDS.indexOf(topmost)).map(
    toLookAnchorId,
  );
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      const bottom = aboveIds.includes(this.id) ? ABOVE_INDEX : BELOW_INDEX;
      return { bottom } as DOMRect;
    },
  );
  fireEvent.scroll(window);
};

const scrollIndexList = (scrollLeft: number) => {
  const list = within(jumpIndex()).getByRole('list');
  Object.defineProperties(list, {
    clientWidth: { configurable: true, value: TRACK_WIDTH },
    scrollWidth: { configurable: true, value: LIST_WIDTH },
    scrollLeft: { configurable: true, writable: true, value: scrollLeft },
  });
  fireEvent.scroll(list);
};

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

    it('follows the topmost card in view as the page scrolls', async () => {
      scrollPastCardsAbove(LOOK_CARD.SHAPE);

      await waitFor(() =>
        expect(rowLink(LOOK_ROW.SHAPE)).toHaveAttribute(
          ARIA_CURRENT,
          CURRENT_LOCATION,
        ),
      );
    });

    it('keeps the open row current while a folded row takes focus', async () => {
      await openLookRow(user, LOOK_ROW.FOOTER);
      const languageSwitcher = lookRowTrigger(LOOK_ROW.LANGUAGE_SWITCHER);

      act(() => languageSwitcher.focus());

      expect(rowLink(LOOK_ROW.FOOTER)).toHaveAttribute(
        ARIA_CURRENT,
        CURRENT_LOCATION,
      );
    });

    it('lets go of Preset once it scrolls out of view', async () => {
      await openLookRow(user, LOOK_ROW.FOOTER);
      await user.click(cardLink(LOOK_FORM.presetLabel));

      scrollPastCardsAbove(LOOK_CARD.HEADER);

      await waitFor(() =>
        expect(rowLink(LOOK_ROW.HEADER)).toHaveAttribute(
          ARIA_CURRENT,
          CURRENT_LOCATION,
        ),
      );
    });

    it('fades only the end while more links lie to the right', () => {
      scrollIndexList(0);

      const start = screen.queryByTestId(LOOK_INDEX_FADE_START_TEST_ID);
      const end = screen.getByTestId(LOOK_INDEX_FADE_END_TEST_ID);
      expect(start).not.toBeInTheDocument();
      expect(end).toBeInTheDocument();
    });

    it('fades only the start once scrolled to the end', () => {
      scrollIndexList(LIST_WIDTH - TRACK_WIDTH);

      const start = screen.getByTestId(LOOK_INDEX_FADE_START_TEST_ID);
      const end = screen.queryByTestId(LOOK_INDEX_FADE_END_TEST_ID);
      expect(start).toBeInTheDocument();
      expect(end).not.toBeInTheDocument();
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
