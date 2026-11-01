import { faker } from '@faker-js/faker';
import {
  customRender,
  renderWithIntl,
  screen,
} from '@platform/testing/custom-render';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { Switch } from './switch';

faker.seed(5995);

const MOCK_ARIA_LABEL = faker.lorem.words(2);
const MOCK_ON = faker.lorem.word();
const MOCK_OFF = faker.lorem.words(2);
const MOCK_CAPTION = faker.lorem.words(3);
const MOCK_LABEL_ID = faker.string.alpha(8);
const MOCK_BADGE_ID = faker.string.alpha(8);
const MOCK_FIELD_LABEL = faker.lorem.word();
const MOCK_BADGE = faker.lorem.word();

const onCheckedChange = vi.fn();

const setup = customRender(Switch, {
  isChecked: false,
  onCheckedChange,
  aria: { label: MOCK_ARIA_LABEL },
  labels: { caption: MOCK_CAPTION },
});

const reportedStates = () =>
  onCheckedChange.mock.calls.map(([checked]) => checked);

describe(`<${Switch.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('names the switch by its aria label, not by the visible state text', () => {
    setup({ isChecked: true, labels: { on: MOCK_ON, off: MOCK_OFF } });

    const toggle = screen.getByRole('switch', { name: MOCK_ARIA_LABEL });

    expect(toggle).toBeChecked();
  });

  it.each([
    {
      target: 'state text',
      isChecked: false,
      labels: { on: MOCK_ON, off: MOCK_OFF },
      text: MOCK_OFF,
      expected: true,
    },
    {
      target: 'caption',
      isChecked: true,
      labels: { caption: MOCK_CAPTION },
      text: MOCK_CAPTION,
      expected: false,
    },
  ])(
    'toggles when its $target is clicked',
    async ({ isChecked, labels, text, expected }) => {
      setup({ isChecked, labels });

      const label = screen.getByText(text);
      await user.click(label);

      expect(reportedStates()).toEqual([expected]);
    },
  );

  it('toggles once when the track itself is clicked', async () => {
    setup();

    const toggle = screen.getByRole('switch', { name: MOCK_ARIA_LABEL });
    await user.click(toggle);

    expect(reportedStates()).toEqual([true]);
  });

  it('ignores clicks on its caption while disabled', async () => {
    setup({ isDisabled: true });

    const caption = screen.getByText(MOCK_CAPTION);
    await user.click(caption);

    const toggle = screen.getByRole('switch', { name: MOCK_ARIA_LABEL });

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(toggle).toBeDisabled();
  });

  describe('locked', () => {
    beforeEach(() => {
      renderWithIntl(
        <div>
          <span id={MOCK_LABEL_ID}>{MOCK_FIELD_LABEL}</span>
          <span id={MOCK_BADGE_ID}>{MOCK_BADGE}</span>
          <Switch
            aria={{
              labelledBy: `${MOCK_LABEL_ID} ${MOCK_BADGE_ID}`,
              describedBy: MOCK_BADGE_ID,
            }}
            isChecked={true}
            onCheckedChange={onCheckedChange}
            labels={{ caption: MOCK_CAPTION }}
            isLocked={true}
          />
        </div>,
      );
    });

    it('is named by its label and badge and described by the badge', () => {
      const toggle = screen.getByRole('switch', {
        name: `${MOCK_FIELD_LABEL} ${MOCK_BADGE}`,
      });

      expect(toggle).toHaveAccessibleDescription(MOCK_BADGE);
    });

    it('keeps its checked state, stays focusable and announces disabled', async () => {
      await user.tab();
      const toggle = screen.getByRole('switch');

      expect(toggle).toHaveFocus();
      expect(toggle).toBeChecked();
      expect(toggle).toBeEnabled();
      expect(toggle).toHaveAttribute('aria-disabled', 'true');
    });

    it('ignores Space', async () => {
      await user.tab();
      await user.keyboard(' ');

      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it.each([
      { target: 'track', getTarget: () => screen.getByRole('switch') },
      { target: 'caption', getTarget: () => screen.getByText(MOCK_CAPTION) },
    ])('ignores a click on its $target', async ({ getTarget }) => {
      await user.click(getTarget());

      expect(onCheckedChange).not.toHaveBeenCalled();
    });
  });
});
