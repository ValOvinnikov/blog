import { LOOK_ROW_TITLE_KEY } from '@platform/components/features/look/look-form/look-row-title-key';
import type { TLookCard } from '@platform/constants/look-card';
import type { TLookRow } from '@platform/constants/look-row';
import messages from '@platform/i18n/messages/en.json';
import { fireEvent, screen, within } from '@platform/testing/custom-render';
import { toLookAnchorId } from '@platform/utils/look-anchor/look-anchor';
import { LOOK_CARDS } from '@platform/utils/look-open-rows/look-open-rows';

const { lookForm: LOOK_FORM } = messages;

const ABOVE_INDEX = -1;
const BELOW_INDEX = 1;

export const CURRENT_LOCATION = 'location';

export const jumpIndex = () =>
  screen.getByRole('navigation', { name: LOOK_FORM.jumpIndexAriaLabel });

export const cardLink = (name: string) =>
  within(jumpIndex()).getByRole('link', { name });

export const rowLink = (row: TLookRow) =>
  cardLink(LOOK_FORM[LOOK_ROW_TITLE_KEY[row]]);

export const toggleAllButton = (name: string) =>
  within(jumpIndex()).getByRole('button', { name });

export const scrollPastCardsAbove = (topmost: TLookCard) => {
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
