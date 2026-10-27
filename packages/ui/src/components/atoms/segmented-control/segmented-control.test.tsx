import { DEPTH } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { SegmentedControl } from './segmented-control';

faker.seed(123);

const MOCK_ARIA_LABEL = faker.lorem.words(2);
const MOCK_SKIM_LABEL = `${faker.lorem.word()}-skim`;
const MOCK_READ_LABEL = `${faker.lorem.word()}-read`;
const MOCK_DEEP_LABEL = `${faker.lorem.word()}-deep`;

const MOCK_OPTIONS = [
  { value: DEPTH.SKIM, label: MOCK_SKIM_LABEL },
  { value: DEPTH.READ, label: MOCK_READ_LABEL },
  { value: DEPTH.DEEP, label: MOCK_DEEP_LABEL },
];

const setup = customRender(SegmentedControl, {
  options: MOCK_OPTIONS,
  value: DEPTH.READ,
  onChange: vi.fn(),
  ariaLabel: MOCK_ARIA_LABEL,
});

describe(`<${SegmentedControl.name}/>`, () => {
  let user: UserEvent;
  let onChange: Mock<(value: string) => void>;

  beforeEach(() => {
    user = userEvent.setup();
    onChange = vi.fn();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a radiogroup named by the ariaLabel', () => {
      const group = screen.getByRole('radiogroup', { name: MOCK_ARIA_LABEL });

      expect(group).toBeVisible();
    });

    it('renders one radio per option', () => {
      const radios = screen.getAllByRole('radio');

      expect(radios).toHaveLength(MOCK_OPTIONS.length);
    });

    it('checks only the option matching value', () => {
      const skimRadio = screen.getByRole('radio', { name: MOCK_SKIM_LABEL });
      const readRadio = screen.getByRole('radio', { name: MOCK_READ_LABEL });
      const deepRadio = screen.getByRole('radio', { name: MOCK_DEEP_LABEL });

      expect(readRadio).toBeChecked();
      expect(skimRadio).not.toBeChecked();
      expect(deepRadio).not.toBeChecked();
    });

    it('puts only the checked option in the tab order', async () => {
      const readRadio = screen.getByRole('radio', { name: MOCK_READ_LABEL });

      await user.tab();

      expect(readRadio).toHaveFocus();

      await user.tab();

      expect(readRadio).not.toHaveFocus();
    });
  });

  it('calls onChange with the clicked option value', async () => {
    setup({ onChange });

    const deepRadio = screen.getByRole('radio', { name: MOCK_DEEP_LABEL });
    await user.click(deepRadio);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(DEPTH.DEEP);
  });

  it('only checks a clicked option once the caller updates value', async () => {
    const { rerender } = setup({ onChange });

    const deepRadio = screen.getByRole('radio', { name: MOCK_DEEP_LABEL });
    await user.click(deepRadio);

    expect(deepRadio).not.toBeChecked();

    rerender(
      <SegmentedControl
        options={MOCK_OPTIONS}
        value={DEPTH.DEEP}
        onChange={onChange}
        ariaLabel={MOCK_ARIA_LABEL}
      />,
    );

    expect(deepRadio).toBeChecked();
  });

  it.each([
    { key: '{ArrowRight}', from: DEPTH.DEEP, to: DEPTH.SKIM, label: 'wraps' },
    { key: '{ArrowLeft}', from: DEPTH.SKIM, to: DEPTH.DEEP, label: 'wraps' },
    { key: '{ArrowDown}', from: DEPTH.READ, to: DEPTH.DEEP, label: 'moves' },
    { key: '{ArrowUp}', from: DEPTH.READ, to: DEPTH.SKIM, label: 'moves' },
  ])('$key $label from $from to $to', async ({ key, from, to }) => {
    setup({ onChange, value: from });

    await user.tab();
    await user.keyboard(key);

    const targetRadio = screen.getByRole('radio', {
      name: MOCK_OPTIONS.find(({ value }) => value === to)?.label,
    });

    expect(onChange).toHaveBeenCalledWith(to);
    expect(targetRadio).toHaveFocus();
  });

  it('ignores non-navigation keys', async () => {
    setup({ onChange });

    await user.tab();
    await user.keyboard('a');

    expect(onChange).not.toHaveBeenCalled();
  });
});
