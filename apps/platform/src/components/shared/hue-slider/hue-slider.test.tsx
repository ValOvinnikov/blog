import { faker } from '@faker-js/faker';
import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { HueSlider, type THueSliderProps } from './hue-slider';

faker.seed(5995);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_DESCRIPTION_ID = faker.string.alpha(8);
const MOCK_LABEL_ID = faker.string.alpha(8);
const MOCK_HUE = 100;

const setup = customRender(HueSlider, {
  name: { ariaLabel: MOCK_LABEL },
  value: MOCK_HUE,
  onChange: vi.fn(),
});

const getSlider = () => screen.getByRole('slider', { name: MOCK_LABEL });

describe(`<${HueSlider.name}/>`, () => {
  let user: UserEvent;
  let handleChange: Mock<THueSliderProps['onChange']>;

  beforeEach(() => {
    user = userEvent.setup();
    handleChange = vi.fn();
  });

  describe('with its defaults', () => {
    beforeEach(() => {
      setup();
    });

    it('names the slider and reports its value', () => {
      expect(getSlider()).toHaveAttribute(
        ARIA_ATTRIBUTE.VALUENOW,
        String(MOCK_HUE),
      );
    });

    it('reads its value as hue text', () => {
      expect(getSlider()).toHaveAttribute(
        ARIA_ATTRIBUTE.VALUETEXT,
        `hue ${MOCK_HUE}°`,
      );
    });
  });

  it('is named by the visible label it points at', () => {
    renderWithIntl(
      <>
        <span id={MOCK_LABEL_ID}>{MOCK_LABEL}</span>
        <HueSlider
          name={{ labelledBy: MOCK_LABEL_ID }}
          value={MOCK_HUE}
          onChange={handleChange}
        />
      </>,
    );

    expect(getSlider()).not.toHaveAttribute(ARIA_ATTRIBUTE.LABEL);
  });

  it('reports an incremented value on ArrowRight', async () => {
    setup({ onChange: handleChange });

    await user.click(getSlider());
    await user.keyboard(USER_EVENT_KEY.ARROW_RIGHT);

    expect(handleChange).toHaveBeenCalledWith(MOCK_HUE + 1);
  });

  it('stays focusable and ignores an arrow key when locked', async () => {
    setup({ onChange: handleChange, isLocked: true });
    const slider = getSlider();

    await user.click(slider);
    await user.keyboard(USER_EVENT_KEY.ARROW_RIGHT);

    expect(slider).toHaveFocus();
    expect(slider).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('is described by the element it is pointed at', () => {
    setup({ [ARIA_ATTRIBUTE.DESCRIBEDBY]: MOCK_DESCRIPTION_ID });

    expect(getSlider()).toHaveAttribute(
      ARIA_ATTRIBUTE.DESCRIBEDBY,
      MOCK_DESCRIPTION_ID,
    );
  });
});
