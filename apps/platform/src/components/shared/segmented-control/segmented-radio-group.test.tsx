import { faker } from '@faker-js/faker';
import { ICON_TEST_ID } from '@platform/constants/icon';
import { SEGMENTED_RADIO_LAYOUT } from '@platform/constants/segmented-control';
import { ARIA_DISABLED } from '@platform/testing/aria';
import {
  customRender,
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { SegmentedRadioGroup } from './segmented-radio-group';
import { SEGMENTED_FADE_WIDTH_PX } from './segmented-radio-group-variants';

faker.seed(6407);

const MOCK_GROUP_LABEL = faker.lorem.word();
const MOCK_FIRST_VALUE = faker.string.uuid();
const MOCK_SECOND_VALUE = faker.string.uuid();
const MOCK_THIRD_VALUE = faker.string.uuid();
const MOCK_FIRST_LABEL = faker.lorem.words(2);
const MOCK_SECOND_LABEL = faker.lorem.words(2);
const MOCK_THIRD_LABEL = faker.lorem.words(2);
const MOCK_FIRST_DESCRIPTION = faker.lorem.sentence();
const MOCK_SECOND_DESCRIPTION = faker.lorem.sentence();
const MOCK_THIRD_DESCRIPTION = faker.lorem.sentence();
const MOCK_GLYPH_TEST_ID = faker.string.alpha(8);
const MOCK_GLYPH_TEXT = faker.lorem.word();
const MOCK_TRACK_WIDTH = 200;
const MOCK_OPTION_WIDTH = 120;

const MOCK_OPTIONS = [
  {
    value: MOCK_FIRST_VALUE,
    label: MOCK_FIRST_LABEL,
    description: MOCK_FIRST_DESCRIPTION,
    isWide: true,
  },
  {
    value: MOCK_SECOND_VALUE,
    label: MOCK_SECOND_LABEL,
    description: MOCK_SECOND_DESCRIPTION,
  },
  {
    value: MOCK_THIRD_VALUE,
    label: MOCK_THIRD_LABEL,
    description: MOCK_THIRD_DESCRIPTION,
  },
];

const MOCK_PROPS = {
  aria: { label: MOCK_GROUP_LABEL },
  options: MOCK_OPTIONS,
  value: MOCK_FIRST_VALUE,
  onChange: vi.fn(),
};

const MOCK_TILE_PROPS = {
  ...MOCK_PROPS,
  layout: SEGMENTED_RADIO_LAYOUT.TILES,
  options: MOCK_OPTIONS.map((option) => ({
    ...option,
    glyph: <span data-testid={MOCK_GLYPH_TEST_ID}>{MOCK_GLYPH_TEXT}</span>,
  })),
};

const setup = customRender(SegmentedRadioGroup<string>, MOCK_PROPS);

const defineGeometry = (element: HTMLElement, geometry: object) => {
  for (const [key, value] of Object.entries(geometry)) {
    Object.defineProperty(element, key, { configurable: true, value });
  }
};

describe(`<${SegmentedRadioGroup.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('at the first option', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a named radio group with one radio per option', () => {
      const group = screen.getByRole('radiogroup', { name: MOCK_GROUP_LABEL });
      const radios = screen.getAllByRole('radio');

      expect(group).toBeVisible();
      expect(radios).toHaveLength(MOCK_OPTIONS.length);
    });

    it('names each radio by its label and describes it by its sub-line', () => {
      const firstRadio = screen.getByRole('radio', { name: MOCK_FIRST_LABEL });
      const secondRadio = screen.getByRole('radio', {
        name: MOCK_SECOND_LABEL,
      });

      expect(firstRadio).toHaveAccessibleDescription(MOCK_FIRST_DESCRIPTION);
      expect(secondRadio).toHaveAccessibleDescription(MOCK_SECOND_DESCRIPTION);
    });
  });

  describe('with the second option selected', () => {
    beforeEach(() => {
      setup({ value: MOCK_SECOND_VALUE });
    });

    it('checks only the option matching the value', () => {
      const firstRadio = screen.getByRole('radio', { name: MOCK_FIRST_LABEL });
      const secondRadio = screen.getByRole('radio', {
        name: MOCK_SECOND_LABEL,
      });

      expect(secondRadio).toBeChecked();
      expect(firstRadio).not.toBeChecked();
    });

    it('is a single Tab stop on the checked option', async () => {
      await user.tab();
      const secondRadio = screen.getByRole('radio', {
        name: MOCK_SECOND_LABEL,
      });

      expect(secondRadio).toHaveFocus();

      await user.tab();

      expect(document.body).toHaveFocus();
    });
  });

  describe('changing the selection', () => {
    let onChange: Mock<(value: string) => void>;

    beforeEach(() => {
      onChange = vi.fn();
      setup({ onChange });
    });

    it('reports the clicked option value', async () => {
      const secondRadio = screen.getByRole('radio', {
        name: MOCK_SECOND_LABEL,
      });
      await user.click(secondRadio);

      expect(onChange).toHaveBeenCalledExactlyOnceWith(MOCK_SECOND_VALUE);
    });

    it('moves the selection with the arrow keys', async () => {
      await user.tab();
      await user.keyboard(USER_EVENT_KEY.ARROW_RIGHT);
      const secondRadio = screen.getByRole('radio', {
        name: MOCK_SECOND_LABEL,
      });

      expect(secondRadio).toHaveFocus();
      expect(onChange).toHaveBeenCalledExactlyOnceWith(MOCK_SECOND_VALUE);
    });
  });

  it('scrolls only the track so a newly selected option is fully in view', () => {
    const { rerender } = setup();

    const group = screen.getByRole('radiogroup', { name: MOCK_GROUP_LABEL });
    const thirdRadio = screen.getByRole('radio', { name: MOCK_THIRD_LABEL });
    const thirdOptionStart = MOCK_TRACK_WIDTH + MOCK_OPTION_WIDTH;
    defineGeometry(group, {
      clientWidth: MOCK_TRACK_WIDTH,
      scrollWidth: thirdOptionStart + MOCK_OPTION_WIDTH,
    });
    defineGeometry(thirdRadio, {
      offsetLeft: thirdOptionStart,
      offsetWidth: MOCK_OPTION_WIDTH,
    });

    rerender(<SegmentedRadioGroup {...MOCK_PROPS} value={MOCK_THIRD_VALUE} />);

    expect(group.scrollLeft).toBe(
      thirdOptionStart +
        MOCK_OPTION_WIDTH +
        SEGMENTED_FADE_WIDTH_PX -
        MOCK_TRACK_WIDTH,
    );
  });

  describe('as tiles', () => {
    const setupTiles = customRender(
      SegmentedRadioGroup<string>,
      MOCK_TILE_PROPS,
    );

    describe('with the first tile selected', () => {
      beforeEach(() => {
        setupTiles();
      });

      it('names each tile by its label alone, its glyph hidden and no description inside', () => {
        const firstRadio = screen.getByRole('radio', {
          name: MOCK_FIRST_LABEL,
        });
        const glyph = within(firstRadio).getByTestId(MOCK_GLYPH_TEST_ID);
        const inlineDescription = within(firstRadio).queryByText(
          MOCK_FIRST_DESCRIPTION,
        );

        expect(firstRadio).toHaveAccessibleName(MOCK_FIRST_LABEL);
        expect(firstRadio).not.toHaveAccessibleDescription();
        expect(glyph).toBeInTheDocument();
        expect(inlineDescription).not.toBeInTheDocument();
      });

      it('describes the group by the selected option description, shown below the tiles', () => {
        const group = screen.getByRole('radiogroup', {
          name: MOCK_GROUP_LABEL,
        });
        const description = screen.getByText(MOCK_FIRST_DESCRIPTION);
        const secondDescription = screen.queryByText(MOCK_SECOND_DESCRIPTION);

        expect(group).toHaveAccessibleDescription(MOCK_FIRST_DESCRIPTION);
        expect(group).not.toContainElement(description);
        expect(secondDescription).not.toBeInTheDocument();
      });
    });

    it('follows the value to the newly selected option description', () => {
      const { rerender } = setupTiles();

      rerender(
        <SegmentedRadioGroup {...MOCK_TILE_PROPS} value={MOCK_SECOND_VALUE} />,
      );
      const group = screen.getByRole('radiogroup', { name: MOCK_GROUP_LABEL });

      expect(group).toHaveAccessibleDescription(MOCK_SECOND_DESCRIPTION);
    });

    it('marks only the selected tile with a check', () => {
      setupTiles({ value: MOCK_SECOND_VALUE });

      const firstRadio = screen.getByRole('radio', { name: MOCK_FIRST_LABEL });
      const secondRadio = screen.getByRole('radio', {
        name: MOCK_SECOND_LABEL,
      });
      const firstCheck = within(firstRadio).queryByTestId(ICON_TEST_ID);
      const secondCheck = within(secondRadio).getByTestId(ICON_TEST_ID);

      expect(secondCheck).toBeInTheDocument();
      expect(firstCheck).not.toBeInTheDocument();
    });

    it('reports the clicked tile value', async () => {
      const onChange = vi.fn();
      setupTiles({ onChange });

      const secondRadio = screen.getByRole('radio', {
        name: MOCK_SECOND_LABEL,
      });
      await user.click(secondRadio);

      expect(onChange).toHaveBeenCalledExactlyOnceWith(MOCK_SECOND_VALUE);
    });

    describe.each([{ isLocked: true }, { isDisabled: true }])(
      'with lock %o',
      (lock) => {
        let onChange: Mock<(value: string) => void>;

        beforeEach(() => {
          onChange = vi.fn();
          renderWithIntl(
            <SegmentedRadioGroup
              {...MOCK_TILE_PROPS}
              onChange={onChange}
              lock={lock}
            />,
          );
        });

        it('announces every tile disabled while keeping the selected one checked', () => {
          const radios = screen.getAllByRole('radio');
          const firstRadio = screen.getByRole('radio', {
            name: MOCK_FIRST_LABEL,
          });

          radios.forEach((radio) =>
            expect(radio).toHaveAttribute(ARIA_DISABLED, 'true'),
          );
          expect(firstRadio).toBeChecked();
        });

        it('ignores a click', async () => {
          const secondRadio = screen.getByRole('radio', {
            name: MOCK_SECOND_LABEL,
          });
          await user.click(secondRadio);

          expect(onChange).not.toHaveBeenCalled();
        });

        it('moves focus with the arrow keys without changing the value', async () => {
          await user.tab();
          await user.keyboard(USER_EVENT_KEY.ARROW_RIGHT);
          const secondRadio = screen.getByRole('radio', {
            name: MOCK_SECOND_LABEL,
          });

          expect(secondRadio).toHaveFocus();
          expect(secondRadio).not.toBeChecked();
          expect(onChange).not.toHaveBeenCalled();
        });
      },
    );
  });
});
