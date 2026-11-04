import { FONT_CHOICE, SIZE } from '@blog/config';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import { stubLgUpWindow } from '@platform/testing/match-media';
import {
  resizeObservedElements,
  stubResizeObserver,
} from '@platform/testing/resize-observer';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { useId, useState } from 'react';
import type { Mock } from 'vitest';

import type { TPresetOption } from './preset-option';
import { PresetStrip } from './preset-strip';

const {
  console: CONSOLE,
  consoleDescription: CONSOLE_DESCRIPTION,
  editorial: EDITORIAL,
  editorialDescription: EDITORIAL_DESCRIPTION,
  morePresets: MORE_PRESETS,
  choosePreset: CHOOSE_PRESET,
  close: CLOSE,
} = messages.presetPicker;
const PRESET_LABEL = messages.lookForm.presetLabel;
const t = makeEnTranslator('presetPicker');
const morePresetsName = (count: number) => t('morePresetsAriaLabel', { count });
const presetCount = (count: number) => t('presetCount', { count });

const ALMANAC = 'Almanac';
const ALMANAC_DESCRIPTION = 'Classic serif, dense and orderly.';
const LEDGER = 'Ledger';
const HARBOUR = 'Harbour';
const JOURNAL = 'Journal';

const MOCK_SWATCH = {
  glyph: 'Aa',
  font: FONT_CHOICE.INTER,
  glyphSize: SIZE.LG,
  ground: '#f3efe6',
  ink: '#3a3226',
} as const;

const MOCK_FRAME_H_PRESETS: TPresetOption<string>[] = [
  [CONSOLE, CONSOLE_DESCRIPTION],
  [EDITORIAL, EDITORIAL_DESCRIPTION],
  [JOURNAL, 'Clean sans, airy and personal.'],
  ['Studio', 'Bold grotesk and big headings.'],
  [ALMANAC, ALMANAC_DESCRIPTION],
  ['Gazette', 'Newspaper columns, tight and busy.'],
  ['Atelier', 'Soft corners and warm neutrals.'],
  [LEDGER, 'Tabular figures, plain and exact.'],
  ['Notebook', 'Relaxed spacing, an informal feel.'],
  ['Broadsheet', 'Large serif headlines, sharp edges.'],
  ['Zine', 'Loud colour and compact cards.'],
  [HARBOUR, 'Muted blues and generous spacing.'],
].map(([name = '', description = '']) => ({
  id: name.toUpperCase(),
  name,
  description,
  swatch: MOCK_SWATCH,
}));

const MOCK_FIVE_PRESETS = MOCK_FRAME_H_PRESETS.slice(0, 5);
const MOCK_TWO_PRESETS = MOCK_FRAME_H_PRESETS.slice(0, 2);
const MOCK_CHIP_WIDTH = 100;
const MOCK_EDIT_COLUMN_1440 = 320;
const MOCK_EDIT_COLUMN_1280 = 220;
const MOCK_ARCHIVED_NOTICE = 'Archived sites are read-only.';

type TPresetStripHarnessProps = {
  presets: TPresetOption<string>[];
  initialValue: string;
  onChange: (value: string) => void;
  isDisabled?: boolean;
};

const PresetStripHarness = ({
  presets,
  initialValue,
  onChange,
  isDisabled,
}: TPresetStripHarnessProps) => {
  const [value, setValue] = useState(initialValue);
  const labelId = useId();
  const noticeId = useId();

  return (
    <>
      <span id={labelId}>{PRESET_LABEL}</span>
      <span id={noticeId}>{MOCK_ARCHIVED_NOTICE}</span>
      <PresetStrip
        presets={presets}
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
        labelledBy={labelId}
        describedBy={isDisabled ? noticeId : undefined}
        isDisabled={isDisabled}
      />
    </>
  );
};

const render = customRender(PresetStripHarness, {
  presets: MOCK_FIVE_PRESETS,
  initialValue: EDITORIAL.toUpperCase(),
  onChange: vi.fn(),
});

let restoreResizeObserver = () => {};
let editColumnWidth = 0;

const setup = (
  width: number,
  overrides?: Partial<TPresetStripHarnessProps>,
) => {
  editColumnWidth = width;
  restoreResizeObserver = stubResizeObserver(() => ({
    width: editColumnWidth,
    height: 0,
  }));
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, MOCK_CHIP_WIDTH, 0),
  );
  return render(overrides);
};

const { ARROW_DOWN, ARROW_RIGHT, END, ENTER, ESCAPE, HOME, SPACE, TAB } =
  USER_EVENT_KEY;
const DIALOG_POPUP = 'dialog';
const HAS_POPUP = 'aria-haspopup';
const TO_LEDGER = `${ARROW_DOWN}${ARROW_RIGHT}`;
const ACTIVE_OPTION = 'aria-activedescendant';
const CLOSES_PICKER = 'closes the picker';
const KEEPS_SELECTED = 'keeps the selected preset';

afterEach(() => {
  vi.restoreAllMocks();
  restoreResizeObserver();
});

describe(`<${PresetStrip.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('on a wide screen', () => {
    beforeEach(() => {
      stubLgUpWindow();
    });

    it('shows two presets as chips with no More presets button', () => {
      setup(MOCK_EDIT_COLUMN_1280, { presets: MOCK_TWO_PRESETS });

      const morePresets = screen.queryByRole('button', {
        name: /More presets/,
      });

      expect(morePresets).not.toBeInTheDocument();
    });

    it.each([
      [MOCK_EDIT_COLUMN_1440, [CONSOLE, EDITORIAL]],
      [MOCK_EDIT_COLUMN_1280, [EDITORIAL]],
    ])('fits five presets into %ipx as the chips %j', (width, names) => {
      setup(width);
      const expected = names.map((name) => screen.getByRole('radio', { name }));

      const chips = screen.getAllByRole('radio');

      expect(chips).toEqual(expected);
    });

    it.each([
      [MOCK_EDIT_COLUMN_1440, 3],
      [MOCK_EDIT_COLUMN_1280, 4],
    ])('counts the presets hidden past %ipx: %i more', (width, hidden) => {
      setup(width);

      const morePresets = screen.getByRole('button', {
        name: morePresetsName(hidden),
      });

      expect(morePresets).toHaveTextContent(`${MORE_PRESETS}${hidden}`);
    });

    it.each([
      [MOCK_EDIT_COLUMN_1440, [CONSOLE, ALMANAC], 10],
      [MOCK_EDIT_COLUMN_1280, [ALMANAC], 11],
    ])(
      'fits twelve presets into %ipx as %j plus %i more',
      (width, names, hidden) => {
        setup(width, {
          presets: MOCK_FRAME_H_PRESETS,
          initialValue: ALMANAC.toUpperCase(),
        });
        const expected = [
          ...names.map((name) => screen.getByRole('radio', { name })),
          screen.getByRole('button', { name: morePresetsName(hidden) }),
        ];

        const controls = [
          ...screen.getAllByRole('radio'),
          ...screen.getAllByRole('button'),
        ];

        expect(controls).toEqual(expected);
      },
    );

    it('re-measures when the edit column narrows', () => {
      setup(MOCK_EDIT_COLUMN_1440);
      const editorial = screen.getByRole('radio', { name: EDITORIAL });

      editColumnWidth = MOCK_EDIT_COLUMN_1280;
      resizeObservedElements();

      const chips = screen.getAllByRole('radio');
      expect(chips).toEqual([editorial]);
    });

    it('keeps More presets out of the radio group', () => {
      setup(MOCK_EDIT_COLUMN_1440);
      const group = screen.getByRole('radiogroup', { name: PRESET_LABEL });

      const insideGroup = within(group).queryByRole('button', {
        name: morePresetsName(3),
      });

      expect(insideGroup).not.toBeInTheDocument();
    });

    it('announces More presets as a dialog trigger', () => {
      setup(MOCK_EDIT_COLUMN_1440);

      const morePresets = screen.getByRole('button', {
        name: morePresetsName(3),
      });

      expect(morePresets).toHaveAttribute(HAS_POPUP, DIALOG_POPUP);
    });

    describe('with the picker open on twelve presets', () => {
      let onChange: Mock<(value: string) => void>;
      let morePresets: HTMLElement;
      let listbox: HTMLElement;

      beforeEach(async () => {
        onChange = vi.fn();
        setup(MOCK_EDIT_COLUMN_1440, {
          presets: MOCK_FRAME_H_PRESETS,
          initialValue: ALMANAC.toUpperCase(),
          onChange,
        });
        morePresets = screen.getByRole('button', {
          name: morePresetsName(10),
        });
        await user.click(morePresets);
        listbox = screen.getByRole('listbox', { name: CHOOSE_PRESET });
      });

      it('marks More presets expanded', () => {
        expect(morePresets).toHaveAttribute('aria-expanded', 'true');
      });

      it('counts every preset in the dialog header', () => {
        const dialog = screen.getByRole('dialog', { name: CHOOSE_PRESET });

        const count = within(dialog).getByText(presetCount(12));

        expect(count).toBeVisible();
      });

      it('lists every preset', () => {
        const options = within(listbox).getAllByRole('option');

        expect(options).toHaveLength(MOCK_FRAME_H_PRESETS.length);
      });

      it('focuses the list', () => {
        expect(listbox).toHaveFocus();
      });

      it('starts on the selected preset', () => {
        const almanac = screen.getByRole('option', { name: ALMANAC });

        expect(listbox).toHaveAttribute(ACTIVE_OPTION, almanac.id);
      });

      it('moves through the grid in both directions with the arrow keys', async () => {
        const ledger = screen.getByRole('option', { name: LEDGER });

        await user.keyboard(TO_LEDGER);

        expect(listbox).toHaveAttribute(ACTIVE_OPTION, ledger.id);
      });

      it.each([
        [HOME, CONSOLE],
        [END, HARBOUR],
      ])('jumps with %s to %s', async (key, name) => {
        const target = screen.getByRole('option', { name });

        await user.keyboard(key);

        expect(listbox).toHaveAttribute(ACTIVE_OPTION, target.id);
      });

      it('chooses the focused preset with Space', async () => {
        await user.keyboard(`${TO_LEDGER}${SPACE}`);

        expect(onChange).toHaveBeenCalledWith(LEDGER.toUpperCase());
      });

      describe('after choosing Ledger with Enter', () => {
        beforeEach(async () => {
          await user.keyboard(`${TO_LEDGER}${ENTER}`);
        });

        it('reports the chosen preset', () => {
          expect(onChange).toHaveBeenCalledWith(LEDGER.toUpperCase());
        });

        it(CLOSES_PICKER, () => {
          const dialog = screen.queryByRole('dialog', {
            name: CHOOSE_PRESET,
          });

          expect(dialog).not.toBeInTheDocument();
        });

        it('moves focus to the chosen chip', () => {
          const ledger = screen.getByRole('radio', { name: LEDGER });

          expect(ledger).toHaveFocus();
        });
      });

      it('chooses a preset on click', async () => {
        const journal = screen.getByRole('option', { name: JOURNAL });

        await user.click(journal);

        expect(onChange).toHaveBeenCalledWith(JOURNAL.toUpperCase());
      });

      describe.each([ESCAPE, TAB])('then %s', (key) => {
        beforeEach(async () => {
          await user.keyboard(key);
        });

        it(CLOSES_PICKER, () => {
          const dialog = screen.queryByRole('dialog', {
            name: CHOOSE_PRESET,
          });

          expect(dialog).not.toBeInTheDocument();
        });

        it(KEEPS_SELECTED, () => {
          expect(onChange).not.toHaveBeenCalled();
        });

        it('returns focus to More presets', () => {
          expect(morePresets).toHaveFocus();
        });
      });
    });

    it('describes a disabled More presets with the archived notice', () => {
      setup(MOCK_EDIT_COLUMN_1440, { isDisabled: true });

      const morePresets = screen.getByRole('button', {
        name: morePresetsName(3),
      });

      expect(morePresets).toHaveAccessibleDescription(MOCK_ARCHIVED_NOTICE);
    });
  });

  describe('on a phone', () => {
    describe('with two presets', () => {
      beforeEach(() => {
        setup(MOCK_EDIT_COLUMN_1280, { presets: MOCK_TWO_PRESETS });
      });

      it('shows every preset as a chip', () => {
        const chips = screen.getAllByRole('radio');

        expect(chips).toHaveLength(MOCK_TWO_PRESETS.length);
      });

      it('shows no Preset button', () => {
        const presetButton = screen.queryByRole('button');

        expect(presetButton).not.toBeInTheDocument();
      });
    });

    describe.each([
      [MOCK_FIVE_PRESETS, EDITORIAL, EDITORIAL_DESCRIPTION],
      [MOCK_FRAME_H_PRESETS, ALMANAC, ALMANAC_DESCRIPTION],
    ])('with %#: the selected %s overflowing', (presets, name, description) => {
      let presetButton: HTMLElement;

      beforeEach(() => {
        setup(MOCK_EDIT_COLUMN_1280, {
          presets,
          initialValue: name.toUpperCase(),
        });
        presetButton = screen.getByRole('button', {
          name: `${PRESET_LABEL} ${name}`,
        });
      });

      it('hides the chips', () => {
        const chips = screen.queryAllByRole('radio');

        expect(chips).toEqual([]);
      });

      it('shows the selected preset description on the Preset button', () => {
        const shown = within(presetButton).getByText(description);

        expect(shown).toBeVisible();
      });

      it('counts every preset on the Preset button', () => {
        const count = within(presetButton).getByText(
          presetCount(presets.length),
        );

        expect(count).toBeVisible();
      });

      it('announces the Preset button as a dialog trigger', () => {
        expect(presetButton).toHaveAttribute(HAS_POPUP, DIALOG_POPUP);
      });
    });

    describe('with the sheet open', () => {
      let onChange: Mock<(value: string) => void>;

      beforeEach(async () => {
        onChange = vi.fn();
        setup(MOCK_EDIT_COLUMN_1280, {
          presets: MOCK_FRAME_H_PRESETS,
          initialValue: ALMANAC.toUpperCase(),
          onChange,
        });
        const presetButton = screen.getByRole('button', {
          name: `${PRESET_LABEL} ${ALMANAC}`,
        });
        await user.click(presetButton);
      });

      it('opens a modal Choose a preset sheet', () => {
        const sheet = screen.getByRole('dialog', { name: CHOOSE_PRESET });

        expect(sheet).toHaveAttribute('aria-modal', 'true');
      });

      it('moves one row at a time with the arrow keys', async () => {
        const listbox = screen.getByRole('listbox', { name: CHOOSE_PRESET });
        const gazette = screen.getByRole('option', { name: 'Gazette' });

        await user.keyboard(ARROW_DOWN);

        expect(listbox).toHaveAttribute(ACTIVE_OPTION, gazette.id);
      });

      it('chooses a row on click', async () => {
        const harbour = screen.getByRole('option', { name: HARBOUR });

        await user.click(harbour);

        expect(onChange).toHaveBeenCalledWith(HARBOUR.toUpperCase());
      });

      describe.each([
        [
          'the Close button',
          async () => {
            const close = screen.getByRole('button', { name: CLOSE });
            await user.click(close);
          },
        ],
        [ESCAPE, () => user.keyboard(ESCAPE)],
      ])('then %s', (_, close) => {
        beforeEach(async () => {
          await close();
        });

        it('closes the sheet', () => {
          const sheet = screen.queryByRole('dialog', { name: CHOOSE_PRESET });

          expect(sheet).not.toBeInTheDocument();
        });

        it(KEEPS_SELECTED, () => {
          expect(onChange).not.toHaveBeenCalled();
        });
      });
    });

    it('describes a disabled Preset button with the archived notice', () => {
      setup(MOCK_EDIT_COLUMN_1280, { isDisabled: true });

      const presetButton = screen.getByRole('button', {
        name: `${PRESET_LABEL} ${EDITORIAL}`,
      });

      expect(presetButton).toHaveAccessibleDescription(MOCK_ARCHIVED_NOTICE);
    });
  });
});
