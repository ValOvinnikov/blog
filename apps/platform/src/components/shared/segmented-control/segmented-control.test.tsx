import { faker } from '@faker-js/faker';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { SegmentedControl } from './segmented-control';

faker.seed(5995);

const MOCK_GROUP_LABEL = faker.lorem.word();
const MOCK_FIRST_VALUE = faker.string.uuid();
const MOCK_SECOND_VALUE = faker.string.uuid();
const MOCK_FIRST_LABEL = faker.lorem.words(2);
const MOCK_SECOND_LABEL = faker.lorem.words(2);
const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_HINT_ID = faker.string.alpha(8);
const MOCK_HINT = faker.lorem.sentence();
const MOCK_LABEL_ID = faker.string.alpha(8);
const MOCK_BADGE_ID = faker.string.alpha(8);
const MOCK_FIELD_LABEL = faker.lorem.word();
const MOCK_BADGE = faker.lorem.word();

const MOCK_FIRST_OPTION = { value: MOCK_FIRST_VALUE, label: MOCK_FIRST_LABEL };
const MOCK_SECOND_OPTION = {
  value: MOCK_SECOND_VALUE,
  label: MOCK_SECOND_LABEL,
};

const setup = customRender(SegmentedControl<string>, {
  aria: { label: MOCK_GROUP_LABEL },
  options: [MOCK_FIRST_OPTION, MOCK_SECOND_OPTION],
  value: MOCK_FIRST_VALUE,
  onChange: vi.fn(),
});

describe(`<${SegmentedControl.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders a named group with one button per option', () => {
    setup();

    const group = screen.getByRole('group', { name: MOCK_GROUP_LABEL });
    const firstOption = screen.getByRole('button', { name: MOCK_FIRST_LABEL });
    const secondOption = screen.getByRole('button', {
      name: MOCK_SECOND_LABEL,
    });

    expect(group).toBeVisible();
    expect(firstOption).toBeVisible();
    expect(secondOption).toBeVisible();
  });

  it('names an option by its label and describes it by its second line', () => {
    setup({
      options: [
        { ...MOCK_FIRST_OPTION, description: MOCK_DESCRIPTION },
        MOCK_SECOND_OPTION,
      ],
    });

    const firstOption = screen.getByRole('button', { name: MOCK_FIRST_LABEL });
    const secondOption = screen.getByRole('button', {
      name: MOCK_SECOND_LABEL,
    });

    expect(firstOption).toHaveAccessibleDescription(MOCK_DESCRIPTION);
    expect(secondOption).not.toHaveAccessibleDescription();
  });

  it('describes the group by the element it is pointed at', () => {
    renderWithIntl(
      <div>
        <span id={MOCK_HINT_ID}>{MOCK_HINT}</span>
        <SegmentedControl
          aria={{ label: MOCK_GROUP_LABEL, describedBy: MOCK_HINT_ID }}
          options={[MOCK_FIRST_OPTION, MOCK_SECOND_OPTION]}
          value={MOCK_FIRST_VALUE}
          onChange={vi.fn()}
        />
      </div>,
    );

    const group = screen.getByRole('group', { name: MOCK_GROUP_LABEL });

    expect(group).toHaveAccessibleDescription(MOCK_HINT);
  });

  it('presses only the option matching the value', () => {
    setup({ value: MOCK_SECOND_VALUE });

    const firstOption = screen.getByRole('button', { name: MOCK_FIRST_LABEL });
    const secondOption = screen.getByRole('button', {
      name: MOCK_SECOND_LABEL,
    });

    expect(secondOption).toBePressed();
    expect(firstOption).not.toBePressed();
  });

  it('reports the clicked option value', async () => {
    const onChange = vi.fn();
    setup({ onChange });

    const secondOption = screen.getByRole('button', {
      name: MOCK_SECOND_LABEL,
    });
    await user.click(secondOption);

    expect(onChange).toHaveBeenCalledExactlyOnceWith(MOCK_SECOND_VALUE);
  });

  it('keeps the clicked option unpressed until the caller updates the value', async () => {
    setup();

    const secondOption = screen.getByRole('button', {
      name: MOCK_SECOND_LABEL,
    });
    await user.click(secondOption);

    expect(secondOption).not.toBePressed();
  });

  it('reports nothing when the selected option is clicked again', async () => {
    const onChange = vi.fn();
    setup({ onChange });

    const firstOption = screen.getByRole('button', { name: MOCK_FIRST_LABEL });
    await user.click(firstOption);

    expect(onChange).not.toHaveBeenCalled();
  });

  describe('disabled', () => {
    let onChange: Mock<(value: string) => void>;

    beforeEach(() => {
      onChange = vi.fn();
      setup({ onChange, isDisabled: true });
    });

    it('disables every option', () => {
      const firstOption = screen.getByRole('button', {
        name: MOCK_FIRST_LABEL,
      });
      const secondOption = screen.getByRole('button', {
        name: MOCK_SECOND_LABEL,
      });

      expect(firstOption).toBeDisabled();
      expect(secondOption).toBeDisabled();
    });

    it('reports nothing on click', async () => {
      const secondOption = screen.getByRole('button', {
        name: MOCK_SECOND_LABEL,
      });
      await user.click(secondOption);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('locked', () => {
    let onChange: Mock<(value: string) => void>;

    beforeEach(() => {
      onChange = vi.fn();
      renderWithIntl(
        <div>
          <span id={MOCK_LABEL_ID}>{MOCK_FIELD_LABEL}</span>
          <span id={MOCK_BADGE_ID}>{MOCK_BADGE}</span>
          <SegmentedControl
            aria={{
              labelledBy: `${MOCK_LABEL_ID} ${MOCK_BADGE_ID}`,
              describedBy: MOCK_BADGE_ID,
            }}
            options={[MOCK_FIRST_OPTION, MOCK_SECOND_OPTION]}
            value={MOCK_SECOND_VALUE}
            onChange={onChange}
            isLocked={true}
          />
        </div>,
      );
    });

    it('names the group by its label and badge and describes it by the badge', () => {
      const group = screen.getByRole('group', {
        name: `${MOCK_FIELD_LABEL} ${MOCK_BADGE}`,
      });

      expect(group).toHaveAccessibleDescription(MOCK_BADGE);
    });

    it('announces every option disabled while keeping the pressed one pressed', () => {
      const firstOption = screen.getByRole('button', {
        name: MOCK_FIRST_LABEL,
      });
      const secondOption = screen.getByRole('button', {
        name: MOCK_SECOND_LABEL,
      });

      const options = screen.getAllByRole('button');

      expect(options).toHaveLength(2);
      options.forEach((option) =>
        expect(option).toHaveAttribute('aria-disabled', 'true'),
      );
      expect(firstOption).toBeEnabled();
      expect(secondOption).toBePressed();
    });

    it('stays reachable by Tab and the arrow keys', async () => {
      await user.tab();
      const tabbed = screen.getByRole('button', { name: MOCK_FIRST_LABEL });

      expect(tabbed).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      const arrowed = screen.getByRole('button', { name: MOCK_SECOND_LABEL });

      expect(arrowed).toHaveFocus();
    });

    it('ignores a click', async () => {
      const firstOption = screen.getByRole('button', {
        name: MOCK_FIRST_LABEL,
      });
      await user.click(firstOption);

      expect(onChange).not.toHaveBeenCalled();
    });

    it.each(['{Enter}', ' '])('reports nothing on %s', async (key) => {
      const firstOption = screen.getByRole('button', {
        name: MOCK_FIRST_LABEL,
      });
      firstOption.focus();
      await user.keyboard(key);

      expect(onChange).not.toHaveBeenCalled();
      expect(firstOption).not.toBePressed();
    });
  });

  it('renders a single option', () => {
    setup({ options: [MOCK_FIRST_OPTION] });

    const firstOption = screen.getByRole('button', { name: MOCK_FIRST_LABEL });

    expect(firstOption).toBeVisible();
  });

  it('renders an empty group with no options', () => {
    setup({ options: [] });

    const group = screen.getByRole('group', { name: MOCK_GROUP_LABEL });

    expect(group).toBeEmptyDOMElement();
  });
});
