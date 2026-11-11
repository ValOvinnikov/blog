/**
 * @vitest-environment jsdom
 */
import { createOptionTilesInput } from '@blog/studio/schema-types/inputs/option-tiles-input/option-tiles-input';
import { faker } from '@faker-js/faker';
import { ThemeProvider } from '@sanity/ui';
import { buildTheme } from '@sanity/ui/theme';
import { fireEvent, render, screen } from '@testing-library/react';
import { set, type StringInputProps, unset } from 'sanity';

faker.seed(6981);

const EMPTY_TITLE = faker.lorem.words(2);
const FIRST = { title: faker.lorem.words(2), value: faker.string.alpha(8) };
const SECOND = { title: faker.lorem.words(3), value: faker.string.alpha(9) };

const OptionTilesInput = createOptionTilesInput({
  tiles: [FIRST, SECOND],
  emptyTitle: EMPTY_TITLE,
  Picture: () => null,
});

const onChange = vi.fn();

const renderInput = ({
  value,
  readOnly = false,
}: {
  value?: string;
  readOnly?: boolean;
} = {}) => {
  const props = {
    value,
    readOnly,
    onChange,
    elementProps: { id: faker.string.alpha(6) },
  } as unknown as StringInputProps;

  render(
    <ThemeProvider theme={buildTheme()}>
      <OptionTilesInput {...props} />
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

  it('disables every tile when the field is read-only', () => {
    renderInput({ readOnly: true });

    const tiles = screen.getAllByRole<HTMLButtonElement>('radio');

    expect(tiles.map(({ disabled }) => disabled)).toEqual([true, true, true]);
  });
});
