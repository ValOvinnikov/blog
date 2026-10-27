import { BUSY_BUTTON_STYLE } from '@blog/config';
import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { Button } from './button';

faker.seed(123);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_BUSY_LABEL = faker.lorem.words(3);

const setup = customRender(Button, { children: MOCK_LABEL });

describe(`<${Button.name}/>`, () => {
  it('renders a button named by its children', () => {
    setup();

    const button = screen.getByRole('button', { name: MOCK_LABEL });

    expect(button).toBeVisible();
  });

  it('is disabled when isDisabled is set', () => {
    setup({ isDisabled: true });

    const button = screen.getByRole('button', { name: MOCK_LABEL });

    expect(button).toBeDisabled();
  });

  it('is named by its children while idle when a busy label is given', () => {
    setup({ busyLabel: MOCK_BUSY_LABEL });

    const button = screen.getByRole('button', { name: MOCK_LABEL });

    expect(button).toBeVisible();
  });

  describe('while busy', () => {
    it('stays enabled and keeps keyboard focus', async () => {
      const user = userEvent.setup();
      setup({ isBusy: true, busyLabel: MOCK_BUSY_LABEL });

      await user.tab();

      const button = screen.getByRole('button', { busy: true });
      expect(button).toBeEnabled();
      expect(button).toHaveFocus();
    });

    it.each([BUSY_BUTTON_STYLE.LABEL, BUSY_BUTTON_STYLE.EDGE])(
      'is named by the busy label in the %s style',
      (busyStyle) => {
        setup({ isBusy: true, busyLabel: MOCK_BUSY_LABEL, busyStyle });

        const button = screen.getByRole('button', { name: MOCK_BUSY_LABEL });

        expect(button).toBeVisible();
      },
    );

    it('announces the busy label as a status', () => {
      setup({ isBusy: true, busyLabel: MOCK_BUSY_LABEL });

      const status = screen.getByRole('status');

      expect(status).toHaveTextContent(MOCK_BUSY_LABEL);
    });

    it('ignores a press', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      setup({ isBusy: true, busyLabel: MOCK_BUSY_LABEL, onClick });

      await user.click(screen.getByRole('button', { busy: true }));

      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not submit its form again', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
      renderElement(
        <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
          <Button type="submit" isBusy={true} busyLabel={MOCK_BUSY_LABEL}>
            {MOCK_LABEL}
          </Button>
        </form>,
      );

      await user.click(screen.getByRole('button', { busy: true }));

      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
