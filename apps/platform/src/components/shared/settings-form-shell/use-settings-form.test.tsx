import { render, screen, waitFor } from '@testing-library/react';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import {
  useSettingsForm,
  type TUseSettingsFormArgs,
} from './use-settings-form';

type TValues = { name: string };
type TResult = { ok: boolean };
type THarnessArgs = Partial<TUseSettingsFormArgs<TValues, TResult>> & {
  writesOwnSavedValues?: boolean;
};

const Harness = ({ writesOwnSavedValues, ...args }: THarnessArgs) => {
  const settings = useSettingsForm<TValues, TResult>({
    initialValues: { name: 'saved' },
    archivedAt: undefined,
    countChanges: (values, savedValues) =>
      values.name === savedValues.name ? 0 : 1,
    draft: { tenantId: 'tenant-1', page: 'test', fields: [] },
    ...args,
    onSubmit: async (values) => {
      if (writesOwnSavedValues) {
        settings.setSavedValues({ name: `${values.name} (uploaded)` });
      }
      return args.onSubmit ? args.onSubmit(values) : { ok: true };
    },
  });
  const { values, setValues, savedValues, isArchived, form } = settings;

  return (
    <div>
      <span data-testid="value">{values.name}</span>
      <span data-testid="saved">{savedValues.name}</span>
      <span data-testid="changes">{form.changeCount}</span>
      <span data-testid="archived">{String(isArchived)}</span>
      <span data-testid="invalid">{form.invalidFields?.ids.join(',')}</span>
      <button type="button" onClick={() => setValues({ name: 'edited' })}>
        edit
      </button>
      <button type="button" onClick={() => void form.save()}>
        save
      </button>
      <button type="button" onClick={form.discard}>
        discard
      </button>
    </div>
  );
};

describe(useSettingsForm, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('counts the edits made since the last save', async () => {
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'edit' }));

    expect(screen.getByTestId('changes')).toHaveTextContent('1');
  });

  it('treats the submitted values as saved once the save succeeds', async () => {
    const onSuccess = vi.fn();
    render(<Harness onSuccess={onSuccess} />);
    await user.click(screen.getByRole('button', { name: 'edit' }));

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(screen.getByTestId('saved')).toHaveTextContent('edited'),
    );
    expect(screen.getByTestId('changes')).toHaveTextContent('0');
    expect(onSuccess).toHaveBeenCalledWith({ name: 'edited' }, { ok: true });
  });

  it('keeps the saved values when the save fails', async () => {
    render(<Harness onSubmit={async () => ({ ok: false })} />);
    await user.click(screen.getByRole('button', { name: 'edit' }));

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(screen.getByTestId('changes')).toHaveTextContent('1'),
    );
    expect(screen.getByTestId('saved')).toHaveTextContent('saved');
  });

  it('keeps saved values a save wrote for itself', async () => {
    render(<Harness writesOwnSavedValues={true} />);
    await user.click(screen.getByRole('button', { name: 'edit' }));

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(screen.getByTestId('saved')).toHaveTextContent(
        'edited (uploaded)',
      ),
    );
  });

  it('does not submit while the values cannot be saved', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });
    render(<Harness onSubmit={onSubmit} canSave={() => false} />);
    await user.click(screen.getByRole('button', { name: 'edit' }));

    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('returns to the saved values and calls onDiscard on discard', async () => {
    const onDiscard = vi.fn();
    render(<Harness onDiscard={onDiscard} />);
    await user.click(screen.getByRole('button', { name: 'edit' }));

    await user.click(screen.getByRole('button', { name: 'discard' }));

    expect(screen.getByTestId('value')).toHaveTextContent('saved');
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('reports the invalid fields for the current values', async () => {
    render(
      <Harness
        invalidFields={({ name }) => ({
          ids: name === 'edited' ? ['name-field'] : [],
        })}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'edit' }));

    expect(screen.getByTestId('invalid')).toHaveTextContent('name-field');
  });

  it('is archived when the tenant has an archive date', () => {
    render(<Harness archivedAt={new Date('2026-08-26T00:00:00.000Z')} />);

    expect(screen.getByTestId('archived')).toHaveTextContent('true');
  });
});
