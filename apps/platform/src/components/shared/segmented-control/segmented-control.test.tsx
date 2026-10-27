import { faker } from '@faker-js/faker';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

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

const MOCK_FIRST_OPTION = { value: MOCK_FIRST_VALUE, label: MOCK_FIRST_LABEL };
const MOCK_SECOND_OPTION = {
  value: MOCK_SECOND_VALUE,
  label: MOCK_SECOND_LABEL,
};

const setup = customRender(SegmentedControl<string>, {
  ariaLabel: MOCK_GROUP_LABEL,
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
          ariaLabel={MOCK_GROUP_LABEL}
          options={[MOCK_FIRST_OPTION, MOCK_SECOND_OPTION]}
          value={MOCK_FIRST_VALUE}
          onChange={vi.fn()}
          aria-describedby={MOCK_HINT_ID}
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
    let onChange: ReturnType<typeof vi.fn>;

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
