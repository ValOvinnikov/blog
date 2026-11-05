import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
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

  it('renders a named radio group with one radio per option', () => {
    setup();

    const group = screen.getByRole('radiogroup', { name: MOCK_GROUP_LABEL });
    const radios = screen.getAllByRole('radio');

    expect(group).toBeVisible();
    expect(radios).toHaveLength(MOCK_OPTIONS.length);
  });

  it('names each radio by its label and describes it by its sub-line', () => {
    setup();

    const firstRadio = screen.getByRole('radio', { name: MOCK_FIRST_LABEL });
    const secondRadio = screen.getByRole('radio', { name: MOCK_SECOND_LABEL });

    expect(firstRadio).toHaveAccessibleDescription(MOCK_FIRST_DESCRIPTION);
    expect(secondRadio).toHaveAccessibleDescription(MOCK_SECOND_DESCRIPTION);
  });

  it('checks only the option matching the value', () => {
    setup({ value: MOCK_SECOND_VALUE });

    const firstRadio = screen.getByRole('radio', { name: MOCK_FIRST_LABEL });
    const secondRadio = screen.getByRole('radio', { name: MOCK_SECOND_LABEL });

    expect(secondRadio).toBeChecked();
    expect(firstRadio).not.toBeChecked();
  });

  it('is a single Tab stop on the checked option', async () => {
    setup({ value: MOCK_SECOND_VALUE });

    await user.tab();
    const secondRadio = screen.getByRole('radio', { name: MOCK_SECOND_LABEL });

    expect(secondRadio).toHaveFocus();

    await user.tab();

    expect(document.body).toHaveFocus();
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
});
