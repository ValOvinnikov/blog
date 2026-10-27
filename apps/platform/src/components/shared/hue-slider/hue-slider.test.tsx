import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { HueSlider } from './hue-slider';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_DESCRIPTION_ID = faker.string.alpha(8);
const MOCK_HUE = 100;

const setup = customRender(HueSlider, {
  ariaLabel: MOCK_LABEL,
  value: MOCK_HUE,
  onChange: vi.fn(),
});

describe(`<${HueSlider.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('names the slider and reports its value', () => {
    setup();

    const slider = screen.getByRole('slider', { name: MOCK_LABEL });

    expect(slider).toHaveAttribute('aria-valuenow', String(MOCK_HUE));
  });

  it('reports an incremented value on ArrowRight', async () => {
    const handleChange = vi.fn();
    setup({ onChange: handleChange });

    const slider = screen.getByRole('slider', { name: MOCK_LABEL });
    await user.click(slider);
    await user.keyboard('{ArrowRight}');

    expect(handleChange).toHaveBeenCalledWith(MOCK_HUE + 1);
  });

  it('is disabled when the slider cannot be changed', () => {
    setup({ isDisabled: true });

    const slider = screen.getByRole('slider', { name: MOCK_LABEL });

    expect(slider).toBeDisabled();
  });

  it('is described by the element it is pointed at', () => {
    setup({ 'aria-describedby': MOCK_DESCRIPTION_ID });

    const slider = screen.getByRole('slider', { name: MOCK_LABEL });

    expect(slider).toHaveAttribute('aria-describedby', MOCK_DESCRIPTION_ID);
  });
});
