import { LOOK_CARD } from '@platform/constants/look-card';
import {
  LOOK_INDEX_FADE_END_TEST_ID,
  LOOK_INDEX_FADE_START_TEST_ID,
} from '@platform/constants/look-form';
import { LOOK_ROW } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { ARIA_CURRENT } from '@platform/testing/aria';
import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import {
  lookRowTrigger,
  openLookRow,
} from '@platform/testing/look/look-form-interactions';
import { setupLookForm } from '@platform/testing/look/look-form-setup';
import {
  cardLink,
  CURRENT_LOCATION,
  jumpIndex,
  rowLink,
  scrollPastCardsAbove,
} from '@platform/testing/look/look-jump-index';
import { stubLgUpWindow } from '@platform/testing/match-media';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LookForm } from './look-form';

vi.mock('@platform/server/site-config/update-look-action');

vi.mock('@platform/server/site-config/upload-brand-asset-action');

vi.mock('@platform/server/site-config/clear-brand-asset-action');

const { lookForm: LOOK_FORM } = messages;

const TRACK_WIDTH = 400;
const LIST_WIDTH = 900;

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
  });
});
