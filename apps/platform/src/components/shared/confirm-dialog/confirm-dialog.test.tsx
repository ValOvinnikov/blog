import { SIZE } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { ComponentProps } from 'react';

import { ConfirmDialog } from './confirm-dialog';

faker.seed(5995);

const t = makeEnTranslator('confirmDialog');

const MOCK_EXPECTED_VALUE = faker.lorem.word();
const MOCK_TRIGGER_LABEL = faker.lorem.words(3);
const MOCK_TITLE = faker.lorem.sentence();
const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_EXTRA_CONTENT = faker.lorem.sentence();
const MOCK_CONFIRM_LABEL = faker.lorem.words(2);
const MOCK_CONFIRMING_LABEL = faker.lorem.words(2);
const MOCK_CONFIRM_ERROR = faker.lorem.sentence();
const MOCK_DISABLED_REASON = faker.lorem.sentence();
const MOCK_UNTYPED_TRIGGER_LABEL = faker.lorem.words(3);
const CONFIRM_FIELD_NAME = t('confirmLabel', { name: MOCK_EXPECTED_VALUE });
const ARIA_DISABLED = 'aria-disabled';

type THarnessProps = Omit<
  ComponentProps<typeof ConfirmDialog>,
  'expectedValue' | 'children'
> & {
  disabledReason?: string;
};

const ConfirmDialogHarness = ({ disabledReason, ...props }: THarnessProps) => (
  <ConfirmDialog expectedValue={MOCK_EXPECTED_VALUE} {...props}>
    <ConfirmDialog.Trigger disabledReason={disabledReason}>
      {MOCK_TRIGGER_LABEL}
    </ConfirmDialog.Trigger>
    <ConfirmDialog.Content
      title={MOCK_TITLE}
      description={MOCK_DESCRIPTION}
      confirmButtonLabel={MOCK_CONFIRM_LABEL}
      confirmingButtonLabel={MOCK_CONFIRMING_LABEL}
    >
      <span>{MOCK_EXTRA_CONTENT}</span>
    </ConfirmDialog.Content>
  </ConfirmDialog>
);

const UntypedConfirmDialogHarness = (
  props: Pick<THarnessProps, 'onConfirm'>,
) => (
  <ConfirmDialog {...props}>
    <ConfirmDialog.Trigger
      ariaLabel={MOCK_UNTYPED_TRIGGER_LABEL}
      size={SIZE.SM}
    >
      {MOCK_TRIGGER_LABEL}
    </ConfirmDialog.Trigger>
    <ConfirmDialog.Content
      title={MOCK_TITLE}
      description={MOCK_DESCRIPTION}
      confirmButtonLabel={MOCK_CONFIRM_LABEL}
      confirmingButtonLabel={MOCK_CONFIRMING_LABEL}
    />
  </ConfirmDialog>
);

const onConfirmMock = vi.fn();
const onConfirmedMock = vi.fn();
const onOpenChangeMock = vi.fn();

const setup = customRender(ConfirmDialogHarness, {
  onConfirm: onConfirmMock,
  onConfirmed: onConfirmedMock,
  onOpenChange: onOpenChangeMock,
});

const setupUntyped = customRender(UntypedConfirmDialogHarness, {
  onConfirm: onConfirmMock,
});

const findConfirmButton = (name = MOCK_CONFIRM_LABEL) => {
  const dialog = screen.getByRole('alertdialog');
  return within(dialog).findByRole('button', { name });
};

describe(`<${ConfirmDialog.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    onConfirmMock.mockReset();
    onConfirmMock.mockResolvedValue(okResult());
  });

  describe('once opened', () => {
    const typeExpectedValueAndConfirm = async () => {
      const confirmField = screen.getByRole('textbox', {
        name: CONFIRM_FIELD_NAME,
      });
      await user.type(confirmField, MOCK_EXPECTED_VALUE);
      const confirmButton = await findConfirmButton();
      await user.click(confirmButton);
    };

    beforeEach(async () => {
      setup();
      const trigger = screen.getByRole('button', { name: MOCK_TRIGGER_LABEL });
      await user.click(trigger);
    });

    it('shows the title, description and extra content', async () => {
      const dialog = await screen.findByRole('alertdialog', {
        name: MOCK_TITLE,
      });
      const description = screen.getByText(MOCK_DESCRIPTION);
      const extraContent = screen.getByText(MOCK_EXTRA_CONTENT);

      expect(dialog).toBeVisible();
      expect(description).toBeVisible();
      expect(extraContent).toBeVisible();
    });

    it('names the confirm field after the expected value, with the hint', () => {
      const confirmField = screen.getByRole('textbox', {
        name: CONFIRM_FIELD_NAME,
      });

      expect(confirmField).toHaveAccessibleDescription(t('confirmHint'));
      expect(confirmField).not.toHaveAttribute('aria-label');
    });

    it('enables confirm only once the typed value matches exactly', async () => {
      const confirmField = screen.getByRole('textbox', {
        name: CONFIRM_FIELD_NAME,
      });
      const confirmButton = await findConfirmButton();
      expect(confirmButton).toBeDisabled();

      await user.type(confirmField, MOCK_EXPECTED_VALUE.slice(0, -1));
      expect(confirmButton).toBeDisabled();

      await user.type(confirmField, MOCK_EXPECTED_VALUE.slice(-1));
      expect(confirmButton).toBeEnabled();
    });

    it('confirms with the typed value, then closes and reports it', async () => {
      await typeExpectedValueAndConfirm();

      await vi.waitFor(() => expect(onConfirmedMock).toHaveBeenCalledTimes(1));
      const dialog = screen.queryByRole('alertdialog');

      expect(onConfirmMock).toHaveBeenCalledWith(MOCK_EXPECTED_VALUE);
      expect(dialog).not.toBeInTheDocument();
    });

    it('shows the server error inline and stays open when confirming fails', async () => {
      onConfirmMock.mockResolvedValueOnce(errorResult(MOCK_CONFIRM_ERROR));

      await typeExpectedValueAndConfirm();

      const error = await screen.findByText(MOCK_CONFIRM_ERROR);
      const dialog = screen.getByRole('alertdialog');

      expect(error).toBeVisible();
      expect(dialog).toBeVisible();
      expect(onConfirmedMock).not.toHaveBeenCalled();
    });

    it('shows and announces the pending label while confirming', async () => {
      onConfirmMock.mockReturnValueOnce(new Promise(() => {}));

      await typeExpectedValueAndConfirm();

      const pendingButton = await findConfirmButton(MOCK_CONFIRMING_LABEL);
      const status = screen.getByRole('status');

      expect(pendingButton).toBeDisabled();
      expect(pendingButton).toHaveAttribute('aria-busy', 'true');
      expect(status).toHaveTextContent(MOCK_CONFIRMING_LABEL);
    });

    it('resets the typed value and the error when cancelled', async () => {
      onConfirmMock.mockResolvedValueOnce(errorResult(MOCK_CONFIRM_ERROR));
      await typeExpectedValueAndConfirm();
      await screen.findByText(MOCK_CONFIRM_ERROR);

      const cancelButton = screen.getByRole('button', {
        name: t('cancelButton'),
      });
      await user.click(cancelButton);
      const closedDialog = screen.queryByRole('alertdialog');
      const trigger = screen.getByRole('button', { name: MOCK_TRIGGER_LABEL });
      await user.click(trigger);

      const confirmField = screen.getByRole('textbox', {
        name: CONFIRM_FIELD_NAME,
      });
      const error = screen.queryByText(MOCK_CONFIRM_ERROR);

      expect(closedDialog).not.toBeInTheDocument();
      expect(onOpenChangeMock).toHaveBeenCalledWith(false);
      expect(confirmField).toHaveValue('');
      expect(error).not.toBeInTheDocument();
    });
  });

  describe('with a disabled reason', () => {
    beforeEach(() => {
      setup({ disabledReason: MOCK_DISABLED_REASON });
    });

    it('keeps the trigger focusable but aria-disabled, described by the reason', async () => {
      const trigger = screen.getByRole('button', { name: MOCK_TRIGGER_LABEL });
      const reason = screen.getByText(MOCK_DISABLED_REASON);

      await user.tab();

      expect(trigger).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(trigger).not.toBeDisabled();
      expect(trigger).toHaveAccessibleDescription(MOCK_DISABLED_REASON);
      expect(reason).toBeVisible();
      expect(trigger).toHaveFocus();
    });

    it('never opens the dialog by click or keyboard', async () => {
      const trigger = screen.getByRole('button', { name: MOCK_TRIGGER_LABEL });

      await user.click(trigger);
      await user.keyboard('{Enter}');
      await user.keyboard(' ');

      const dialog = screen.queryByRole('alertdialog');
      expect(dialog).not.toBeInTheDocument();
    });
  });

  it('renders the trigger enabled with no reason when none is given', () => {
    setup();

    const trigger = screen.getByRole('button', { name: MOCK_TRIGGER_LABEL });

    expect(trigger).toBeEnabled();
    expect(trigger).not.toHaveAttribute(ARIA_DISABLED);
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('asks for no typed value without an expected value and confirms at once', async () => {
    setupUntyped();
    const trigger = screen.getByRole('button', {
      name: MOCK_UNTYPED_TRIGGER_LABEL,
    });
    await user.click(trigger);

    const confirmField = screen.queryByRole('textbox');
    const confirmButton = await findConfirmButton();
    expect(confirmField).not.toBeInTheDocument();
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    expect(onConfirmMock).toHaveBeenCalledWith('');
  });
});
