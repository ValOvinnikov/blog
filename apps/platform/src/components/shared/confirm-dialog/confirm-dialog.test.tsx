import { faker } from '@faker-js/faker';
import { SHELL_MAIN_ID } from '@platform/constants/shell-frame';
import { ARIA_DISABLED } from '@platform/testing/aria';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { USER_EVENT_KEY } from '@platform/testing/keyboard';
import { SIZE } from '@shinefold/config';
import { errorResult, okResult } from '@shinefold/utils';
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
const MOCK_RETURN_FOCUS_ID = faker.lorem.word();
const MOCK_RETURN_FOCUS_LABEL = faker.lorem.words(2);
const MOCK_KEEP_LABEL = faker.lorem.words(2);
const MOCK_MISSING_RETURN_FOCUS_ID = faker.string.uuid();
const CONFIRM_FIELD_NAME = t('confirmLabel', { name: MOCK_EXPECTED_VALUE });

type THarnessProps = Omit<
  ComponentProps<typeof ConfirmDialog>,
  'expectedValue' | 'children'
> & {
  disabledReason?: string;
  keepButtonLabel?: string;
};

const ConfirmDialogHarness = ({
  disabledReason,
  keepButtonLabel,
  ...props
}: THarnessProps) => (
  <>
    <ConfirmDialog
      expectedValue={MOCK_EXPECTED_VALUE}
      returnFocusId={MOCK_RETURN_FOCUS_ID}
      {...props}
    >
      <ConfirmDialog.Trigger disabledReason={disabledReason}>
        {MOCK_TRIGGER_LABEL}
      </ConfirmDialog.Trigger>
      <ConfirmDialog.Content
        title={MOCK_TITLE}
        description={MOCK_DESCRIPTION}
        confirmButtonLabel={MOCK_CONFIRM_LABEL}
        confirmingButtonLabel={MOCK_CONFIRMING_LABEL}
        keepButtonLabel={keepButtonLabel}
      >
        <span>{MOCK_EXTRA_CONTENT}</span>
      </ConfirmDialog.Content>
    </ConfirmDialog>
    <button type="button" id={MOCK_RETURN_FOCUS_ID}>
      {MOCK_RETURN_FOCUS_LABEL}
    </button>
  </>
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

const InShellMainHarness = (props: THarnessProps) => (
  <main id={SHELL_MAIN_ID} tabIndex={-1}>
    <ConfirmDialogHarness {...props} />
  </main>
);

const onConfirmMock = vi.fn();
const onConfirmedMock = vi.fn();
const onOpenChangeMock = vi.fn();

const setup = customRender(ConfirmDialogHarness, {
  onConfirm: onConfirmMock,
  onConfirmed: onConfirmedMock,
  onOpenChange: onOpenChangeMock,
});

const setupInShellMain = customRender(InShellMainHarness, {
  onConfirm: onConfirmMock,
  returnFocusId: MOCK_MISSING_RETURN_FOCUS_ID,
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

  it('moves focus to the page main region when the return target is gone', async () => {
    setupInShellMain();
    const trigger = screen.getByRole('button', { name: MOCK_TRIGGER_LABEL });
    await user.click(trigger);
    const confirmField = screen.getByRole('textbox', {
      name: CONFIRM_FIELD_NAME,
    });
    await user.type(confirmField, MOCK_EXPECTED_VALUE);
    const confirmButton = await findConfirmButton();
    await user.click(confirmButton);

    const main = screen.getByRole('main');

    await vi.waitFor(() => expect(main).toHaveFocus());
  });

  describe('once opened', () => {
    let confirmField: HTMLElement;

    const typeExpectedValueAndConfirm = async () => {
      await user.type(confirmField, MOCK_EXPECTED_VALUE);
      const confirmButton = await findConfirmButton();
      await user.click(confirmButton);
    };

    beforeEach(async () => {
      setup();
      const trigger = screen.getByRole('button', { name: MOCK_TRIGGER_LABEL });
      await user.click(trigger);
      confirmField = screen.getByRole('textbox', {
        name: CONFIRM_FIELD_NAME,
      });
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
      expect(confirmField).toHaveAccessibleDescription(t('confirmHint'));
      expect(confirmField).not.toHaveAttribute('aria-label');
    });

    it('enables confirm only once the typed value matches exactly', async () => {
      const confirmButton = await findConfirmButton();
      expect(confirmButton).toBeDisabled();

      await user.type(confirmField, MOCK_EXPECTED_VALUE.slice(0, -1));
      expect(confirmButton).toBeDisabled();

      await user.type(confirmField, MOCK_EXPECTED_VALUE.slice(-1));
      expect(confirmButton).toBeEnabled();
    });

    describe('when confirmed', () => {
      beforeEach(async () => {
        await typeExpectedValueAndConfirm();
      });

      it('confirms with the typed value, then closes and reports it', async () => {
        await vi.waitFor(() =>
          expect(onConfirmedMock).toHaveBeenCalledTimes(1),
        );
        const dialog = screen.queryByRole('alertdialog');

        expect(onConfirmMock).toHaveBeenCalledWith(MOCK_EXPECTED_VALUE);
        expect(dialog).not.toBeInTheDocument();
      });

      it('moves focus to the return target', async () => {
        const returnTarget = screen.getByRole('button', {
          name: MOCK_RETURN_FOCUS_LABEL,
        });

        await vi.waitFor(() => expect(returnTarget).toHaveFocus());
      });
    });

    it('returns focus to the trigger when cancelled', async () => {
      const cancelButton = screen.getByRole('button', {
        name: t('cancelButton'),
      });
      await user.click(cancelButton);

      const trigger = screen.getByRole('button', { name: MOCK_TRIGGER_LABEL });

      await vi.waitFor(() => expect(trigger).toHaveFocus());
    });

    describe('when confirming fails', () => {
      beforeEach(async () => {
        onConfirmMock.mockResolvedValueOnce(errorResult(MOCK_CONFIRM_ERROR));
        await typeExpectedValueAndConfirm();
      });

      it('shows the server error inline and stays open', async () => {
        const error = await screen.findByText(MOCK_CONFIRM_ERROR);
        const dialog = screen.getByRole('alertdialog');

        expect(error).toBeVisible();
        expect(dialog).toBeVisible();
        expect(onConfirmedMock).not.toHaveBeenCalled();
      });

      it('resets the typed value and the error when cancelled', async () => {
        await screen.findByText(MOCK_CONFIRM_ERROR);

        const cancelButton = screen.getByRole('button', {
          name: t('cancelButton'),
        });
        await user.click(cancelButton);
        const closedDialog = screen.queryByRole('alertdialog');
        const trigger = screen.getByRole('button', {
          name: MOCK_TRIGGER_LABEL,
        });
        await user.click(trigger);

        const reopenedField = screen.getByRole('textbox', {
          name: CONFIRM_FIELD_NAME,
        });
        const error = screen.queryByText(MOCK_CONFIRM_ERROR);

        expect(closedDialog).not.toBeInTheDocument();
        expect(onOpenChangeMock).toHaveBeenCalledWith(false);
        expect(reopenedField).toHaveValue('');
        expect(error).not.toBeInTheDocument();
      });
    });

    describe('while confirming', () => {
      beforeEach(async () => {
        onConfirmMock.mockReturnValueOnce(new Promise(() => {}));
        await typeExpectedValueAndConfirm();
      });

      it('shows and announces the pending label', async () => {
        const pendingButton = await findConfirmButton(MOCK_CONFIRMING_LABEL);
        const status = screen.getByRole('status');
        const cancelButton = screen.getByRole('button', {
          name: t('cancelButton'),
        });

        expect(cancelButton).toBeDisabled();
        expect(pendingButton).toHaveAttribute(ARIA_DISABLED, 'true');
        expect(pendingButton).toHaveAttribute('aria-busy', 'true');
        expect(status).toHaveTextContent(MOCK_CONFIRMING_LABEL);
      });

      it('ignores Escape', async () => {
        await user.keyboard(USER_EVENT_KEY.ESCAPE);
        const dialog = screen.getByRole('alertdialog');

        expect(dialog).toBeVisible();
        expect(onOpenChangeMock).not.toHaveBeenCalledWith(false);
      });
    });
  });

  describe('with a keep label', () => {
    let keepButton: HTMLElement;

    beforeEach(async () => {
      setup({ keepButtonLabel: MOCK_KEEP_LABEL });
      const trigger = screen.getByRole('button', { name: MOCK_TRIGGER_LABEL });
      await user.click(trigger);
      keepButton = screen.getByRole('button', { name: MOCK_KEEP_LABEL });
    });

    it('shows it in place of Cancel', () => {
      const cancelButton = screen.queryByRole('button', {
        name: t('cancelButton'),
      });

      expect(keepButton).toBeEnabled();
      expect(cancelButton).not.toBeInTheDocument();
    });

    it('closes the dialog without confirming', async () => {
      await user.click(keepButton);

      const dialog = screen.queryByRole('alertdialog');

      expect(dialog).not.toBeInTheDocument();
      expect(onConfirmMock).not.toHaveBeenCalled();
    });
  });

  describe('with a disabled reason', () => {
    let trigger: HTMLElement;

    beforeEach(() => {
      setup({ disabledReason: MOCK_DISABLED_REASON });
      trigger = screen.getByRole('button', { name: MOCK_TRIGGER_LABEL });
    });

    it('keeps the trigger focusable but aria-disabled, described by the reason', async () => {
      const reason = screen.getByText(MOCK_DISABLED_REASON);

      await user.tab();

      expect(trigger).toHaveAttribute(ARIA_DISABLED, 'true');
      expect(trigger).not.toBeDisabled();
      expect(trigger).toHaveAccessibleDescription(MOCK_DISABLED_REASON);
      expect(reason).toBeVisible();
      expect(trigger).toHaveFocus();
    });

    it('never opens the dialog by click or keyboard', async () => {
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
