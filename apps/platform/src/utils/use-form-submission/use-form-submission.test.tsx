import { ACTION_OUTCOME, FORM_STATUS, type TActionOutcome } from '@blog/config';
import { faker } from '@faker-js/faker';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useFormSubmission } from './use-form-submission';

type TValues = { name: string };
type TResult = { outcome: TActionOutcome };

type THarnessProps = {
  onOutcome?: (isSaved: boolean) => void;
  initialValues: TValues | (() => TValues);
  onSubmit: (values: TValues) => Promise<TResult>;
  onSuccess?: (values: TValues, result: TResult) => void;
};

const INITIAL_NAME = faker.person.fullName();
const EDITED_NAME = faker.person.fullName();
const EDIT_LABEL = faker.lorem.word();
const SUBMIT_LABEL = faker.lorem.words(2);

const Harness = ({
  initialValues,
  onSubmit,
  onSuccess,
  onOutcome,
}: THarnessProps) => {
  const { values, setValues, status, isPending, handleSubmit } =
    useFormSubmission<TValues, TResult>({
      initialValues,
      onSubmit,
      onSuccess,
    });

  return (
    <div>
      <span data-testid="name">{values.name}</span>
      <span data-testid="status">{status}</span>
      <span data-testid="pending">{String(isPending)}</span>
      <button
        type="button"
        onClick={() => setValues((prev) => ({ ...prev, name: EDITED_NAME }))}
      >
        {EDIT_LABEL}
      </button>
      <button
        type="button"
        onClick={() =>
          void handleSubmit().then((isSaved) => onOutcome?.(isSaved))
        }
      >
        {SUBMIT_LABEL}
      </button>
    </div>
  );
};

describe(useFormSubmission, () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('starts idle with the given initial values', () => {
    render(
      <Harness
        initialValues={{ name: INITIAL_NAME }}
        onSubmit={vi
          .fn()
          .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS })}
      />,
    );

    const name = screen.getByTestId('name');
    const status = screen.getByTestId('status');

    expect(name).toHaveTextContent(INITIAL_NAME);
    expect(status).toHaveTextContent(FORM_STATUS.IDLE);
  });

  it('accepts a lazy initializer, matching useState', () => {
    const lazyName = faker.person.fullName();
    const buildInitialValues = vi.fn(() => ({ name: lazyName }));
    render(
      <Harness
        initialValues={buildInitialValues}
        onSubmit={vi
          .fn()
          .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS })}
      />,
    );

    const name = screen.getByTestId('name');

    expect(name).toHaveTextContent(lazyName);
  });

  it('sets status to success and calls onSuccess with the submitted values', async () => {
    const onSubmit = vi
      .fn()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
    const onSuccess = vi.fn();
    render(
      <Harness
        initialValues={{ name: INITIAL_NAME }}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
      />,
    );
    const editButton = screen.getByRole('button', { name: EDIT_LABEL });
    const submitButton = screen.getByRole('button', { name: SUBMIT_LABEL });

    await user.click(editButton);
    await user.click(submitButton);

    const status = await screen.findByTestId('status');

    expect(status).toHaveTextContent(FORM_STATUS.SUCCESS);
    expect(onSubmit).toHaveBeenCalledWith({ name: EDITED_NAME });
    expect(onSuccess).toHaveBeenCalledWith(
      { name: EDITED_NAME },
      { outcome: ACTION_OUTCOME.SUCCESS },
    );
  });

  it('sets status to error and does not call onSuccess when the submit fails', async () => {
    const onSubmit = vi
      .fn()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SERVER_ERROR });
    const onSuccess = vi.fn();
    render(
      <Harness
        initialValues={{ name: INITIAL_NAME }}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
      />,
    );
    const submitButton = screen.getByRole('button', { name: SUBMIT_LABEL });

    await user.click(submitButton);

    const status = await screen.findByTestId('status');

    expect(status).toHaveTextContent(FORM_STATUS.ERROR);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('sets status to error and resolves false when the submit throws', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error(faker.lorem.words()));
    const onSuccess = vi.fn();
    const onOutcome = vi.fn();
    render(
      <Harness
        initialValues={{ name: INITIAL_NAME }}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        onOutcome={onOutcome}
      />,
    );
    const submitButton = screen.getByRole('button', { name: SUBMIT_LABEL });

    await user.click(submitButton);

    await waitFor(() => expect(onOutcome).toHaveBeenCalledWith(false));
    const status = screen.getByTestId('status');
    expect(status).toHaveTextContent(FORM_STATUS.ERROR);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('clears a shown status back to idle as soon as the values change again', async () => {
    const onSubmit = vi
      .fn()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
    render(
      <Harness initialValues={{ name: INITIAL_NAME }} onSubmit={onSubmit} />,
    );
    const editButton = screen.getByRole('button', { name: EDIT_LABEL });
    const submitButton = screen.getByRole('button', { name: SUBMIT_LABEL });

    await user.click(submitButton);
    const status = await screen.findByTestId('status');
    expect(status).toHaveTextContent(FORM_STATUS.SUCCESS);

    await user.click(editButton);

    expect(status).toHaveTextContent(FORM_STATUS.IDLE);
  });

  it.each([
    [true, { outcome: ACTION_OUTCOME.SUCCESS }],
    [false, { outcome: ACTION_OUTCOME.SERVER_ERROR }],
  ])(
    'resolves the submit with %s once the save settles',
    async (isSaved, result) => {
      const onOutcome = vi.fn();
      render(
        <Harness
          initialValues={{ name: INITIAL_NAME }}
          onSubmit={vi.fn().mockResolvedValue(result)}
          onOutcome={onOutcome}
        />,
      );
      const submitButton = screen.getByRole('button', { name: SUBMIT_LABEL });

      await user.click(submitButton);

      await waitFor(() => expect(onOutcome).toHaveBeenCalledWith(isSaved));
    },
  );
});
