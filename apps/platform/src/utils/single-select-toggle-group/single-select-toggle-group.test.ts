import { faker } from '@faker-js/faker';

import { singleSelectToggleGroupProps } from './single-select-toggle-group';

faker.seed(6382);

const MOCK_VALUE = faker.string.uuid();
const MOCK_NEXT_VALUE = faker.string.uuid();

describe(singleSelectToggleGroupProps, () => {
  it('holds the value as the only pressed item', () => {
    const { value } = singleSelectToggleGroupProps(MOCK_VALUE, vi.fn());

    expect(value).toEqual([MOCK_VALUE]);
  });

  it('reports a newly chosen value', () => {
    const onChange = vi.fn();
    const { onValueChange } = singleSelectToggleGroupProps(
      MOCK_VALUE,
      onChange,
    );

    onValueChange([MOCK_NEXT_VALUE]);

    expect(onChange).toHaveBeenCalledWith(MOCK_NEXT_VALUE);
  });

  it('reports nothing for a new value when locked', () => {
    const onChange = vi.fn();
    const { onValueChange } = singleSelectToggleGroupProps(
      MOCK_VALUE,
      onChange,
      { isLocked: true },
    );

    onValueChange([MOCK_NEXT_VALUE]);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('reports nothing when the pressed item is clicked again', () => {
    const onChange = vi.fn();
    const { onValueChange } = singleSelectToggleGroupProps(
      MOCK_VALUE,
      onChange,
    );

    onValueChange([]);

    expect(onChange).not.toHaveBeenCalled();
  });
});
