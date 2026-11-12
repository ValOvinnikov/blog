/**
 * @vitest-environment jsdom
 */
import { createOptionTilesInput } from '@blog/studio/schema-types/inputs/option-tiles-input/option-tiles-input';
import { faker } from '@faker-js/faker';
import { ThemeProvider } from '@sanity/ui';
import { buildTheme } from '@sanity/ui/theme';
import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, type RefObject } from 'react';
import { set, type StringInputProps, unset } from 'sanity';

faker.seed(6981);

const EMPTY_TITLE = faker.lorem.words(2);
const FIRST = { title: faker.lorem.words(2), value: faker.string.alpha(8) };
const SECOND = { title: faker.lorem.words(3), value: faker.string.alpha(9) };
const FIELD_TITLE = faker.lorem.words(2);
const FIELD_DESCRIPTION = faker.lorem.sentence();
const DESCRIPTION_ID = faker.string.alpha(7);

const OptionTilesInput = createOptionTilesInput({
  tiles: [FIRST, SECOND],
  emptyTitle: EMPTY_TITLE,
  Picture: () => null,
});

const OptionTilesInputWithoutEmpty = createOptionTilesInput({
  tiles: [FIRST, SECOND],
  Picture: () => null,
});

const onChange = vi.fn();

const renderInput = ({
  value,
  readOnly = false,
  Input = OptionTilesInput,
  ref,
}: {
  value?: string;
  readOnly?: boolean;
  Input?: typeof OptionTilesInput;
  ref?: RefObject<HTMLButtonElement | null>;
} = {}) => {
  const props = {
    value,
    readOnly,
    onChange,
    schemaType: { title: FIELD_TITLE },
    elementProps: {
      id: faker.string.alpha(6),
      ref,
      'aria-describedby': DESCRIPTION_ID,
    },
  } as unknown as StringInputProps;

  render(
    <ThemeProvider theme={buildTheme()}>
      <Input {...props} />
      <p id={DESCRIPTION_ID}>{FIELD_DESCRIPTION}</p>
    </ThemeProvider>,
  );
};

const tile = (name: string) =>
  screen.getByRole<HTMLButtonElement>('radio', { name });

const checkedTile = () =>
  screen.getByRole<HTMLButtonElement>('radio', { checked: true });

describe(`<${OptionTilesInput.name}/>`, () => {
  describe('when the field is empty', () => {
    beforeEach(() => {
      renderInput();
    });

    it('offers the empty state first, then every option in order', () => {
      const tiles = screen.getAllByRole('radio');
      const inOrder = [
        tile(EMPTY_TITLE),
        tile(FIRST.title),
        tile(SECOND.title),
      ];

      expect(tiles).toEqual(inOrder);
    });

    it('marks the empty state as chosen', () => {
      const emptyTile = tile(EMPTY_TITLE);

      const chosen = checkedTile();

      expect(chosen).toBe(emptyTile);
    });

    it('stores an option when its tile is picked', () => {
      const firstTile = tile(FIRST.title);

      fireEvent.click(firstTile);

      expect(onChange).toHaveBeenCalledWith(set(FIRST.value));
    });
  });

  describe('when an option is stored', () => {
    beforeEach(() => {
      renderInput({ value: SECOND.value });
    });

    it('marks the stored option as chosen', () => {
      const secondTile = tile(SECOND.title);

      const chosen = checkedTile();

      expect(chosen).toBe(secondTile);
    });

    it('clears the field when the empty tile is picked', () => {
      const emptyTile = tile(EMPTY_TITLE);

      fireEvent.click(emptyTile);

      expect(onChange).toHaveBeenCalledWith(unset());
    });
  });

  describe('when the field has no empty state', () => {
    it('offers only the options, in order', () => {
      renderInput({ Input: OptionTilesInputWithoutEmpty });

      const tiles = screen.getAllByRole('radio');

      expect(tiles).toEqual([tile(FIRST.title), tile(SECOND.title)]);
    });

    it('hands the field focus to the first option while nothing is stored', () => {
      const ref = createRef<HTMLButtonElement>();

      renderInput({ Input: OptionTilesInputWithoutEmpty, ref });

      expect(ref.current).toBe(tile(FIRST.title));
    });
  });

  it('names and describes the group after the field', () => {
    renderInput();

    const group = screen.getByRole('radiogroup', {
      name: FIELD_TITLE,
      description: FIELD_DESCRIPTION,
    });

    expect(group).toBeDefined();
  });

  it('disables every tile when the field is read-only', () => {
    renderInput({ readOnly: true });

    const tiles = screen.getAllByRole<HTMLButtonElement>('radio');

    expect(tiles.map(({ disabled }) => disabled)).toEqual([true, true, true]);
  });
});
