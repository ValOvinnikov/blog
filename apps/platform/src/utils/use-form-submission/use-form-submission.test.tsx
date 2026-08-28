import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useFormSubmission } from './use-form-submission';

type TValues = { name: string };
type TResult = { ok: boolean };

type THarnessProps = {
  initialValues: TValues | (() => TValues);
  onSubmit: (values: TValues) => Promise<TResult>;
  onSuccess?: (values: TValues, result: TResult) => void;
};

const Harness = ({ initialValues, onSubmit, onSuccess }: THarnessProps) => {
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
        onClick={() => setValues((prev) => ({ ...prev, name: 'edited' }))}
      >
        edit
      </button>
      <button type="button" onClick={handleSubmit}>
        submit
      </button>
    </div>
  );
};

describe(useFormSubmission, () => {
  it('starts idle with the given initial values', () => {
    render(
      <Harness
        initialValues={{ name: 'initial' }}
        onSubmit={vi.fn().mockResolvedValue({ ok: true })}
      />,
    );

    expect(screen.getByTestId('name')).toHaveTextContent('initial');
    expect(screen.getByTestId('status')).toHaveTextContent('idle');
  });

  it('accepts a lazy initializer, matching useState', () => {
    const buildInitialValues = vi.fn(() => ({ name: 'lazy' }));
    render(
      <Harness
        initialValues={buildInitialValues}
        onSubmit={vi.fn().mockResolvedValue({ ok: true })}
      />,
    );

    expect(screen.getByTestId('name')).toHaveTextContent('lazy');
  });

  it('sets status to success and calls onSuccess with the submitted values on a successful submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });
    const onSuccess = vi.fn();
    render(
      <Harness
        initialValues={{ name: 'initial' }}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'edit' }));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    expect(await screen.findByTestId('status')).toHaveTextContent('success');
    expect(onSubmit).toHaveBeenCalledWith({ name: 'edited' });
    expect(onSuccess).toHaveBeenCalledWith({ name: 'edited' }, { ok: true });
  });

  it('sets status to error and does not call onSuccess when the submit fails', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ ok: false });
    const onSuccess = vi.fn();
    render(
      <Harness
        initialValues={{ name: 'initial' }}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'submit' }));

    expect(await screen.findByTestId('status')).toHaveTextContent('error');
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('clears a shown status back to idle as soon as the values change again', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });
    render(<Harness initialValues={{ name: 'initial' }} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'submit' }));
    expect(await screen.findByTestId('status')).toHaveTextContent('success');

    await user.click(screen.getByRole('button', { name: 'edit' }));

    expect(screen.getByTestId('status')).toHaveTextContent('idle');
  });
});
