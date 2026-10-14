import { act, renderHook, waitFor } from '@testing-library/react';

import {
  useSettingsForm,
  type TUseSettingsFormArgs,
} from './use-settings-form';

type TValues = { name: string };
type TResult = { ok: boolean };
type TArgs = TUseSettingsFormArgs<TValues, TResult>;

const SAVED: TValues = { name: 'saved' };
const EDITED: TValues = { name: 'edited' };

const renderSettingsForm = (overrides: Partial<TArgs> = {}) =>
  renderHook(() =>
    useSettingsForm<TValues, TResult>({
      initialValues: SAVED,
      archivedAt: undefined,
      onSubmit: async () => ({ ok: true }),
      countChanges: (values, savedValues) =>
        values.name === savedValues.name ? 0 : 1,
      draft: { tenantId: 'tenant-1', page: 'test', fields: [] },
      ...overrides,
    }),
  );

const editAndSave = async (
  result: ReturnType<typeof renderSettingsForm>['result'],
) => {
  act(() => result.current.setValues(EDITED));
  let isSaved = false;
  await act(async () => {
    isSaved = await result.current.form.save();
  });
  return isSaved;
};

describe(useSettingsForm, () => {
  it('counts the edits made since the last save', () => {
    const { result } = renderSettingsForm();

    act(() => result.current.setValues(EDITED));

    expect(result.current.form.changeCount).toBe(1);
  });

  it('treats the submitted values as saved once the save succeeds', async () => {
    const onSuccess = vi.fn();
    const { result } = renderSettingsForm({ onSuccess });

    expect(await editAndSave(result)).toBe(true);

    await waitFor(() => expect(result.current.savedValues).toEqual(EDITED));
    expect(result.current.form.changeCount).toBe(0);
    expect(onSuccess).toHaveBeenCalledWith(EDITED, { ok: true });
  });

  it('keeps the saved values when the save fails', async () => {
    const { result } = renderSettingsForm({
      onSubmit: async () => ({ ok: false }),
    });

    expect(await editAndSave(result)).toBe(false);

    expect(result.current.savedValues).toEqual(SAVED);
    expect(result.current.form.changeCount).toBe(1);
    expect(result.current.status).toBe('error');
  });

  it('keeps saved values a save wrote for itself', async () => {
    const UPLOADED: TValues = { name: 'edited (uploaded)' };
    const { result } = renderSettingsForm({
      onSubmit: async () => {
        result.current.setSavedValues(UPLOADED);
        return { ok: true };
      },
    });

    await editAndSave(result);

    await waitFor(() => expect(result.current.savedValues).toEqual(UPLOADED));
  });

  it('does not submit while the values cannot be saved', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderSettingsForm({ onSubmit, canSave: () => false });

    expect(await editAndSave(result)).toBe(false);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('returns to the saved values and calls onDiscard on discard', () => {
    const onDiscard = vi.fn();
    const { result } = renderSettingsForm({ onDiscard });
    act(() => result.current.setValues(EDITED));

    act(() => result.current.form.discard());

    expect(result.current.values).toEqual(SAVED);
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('reports the invalid fields for the current values', () => {
    const { result } = renderSettingsForm({
      invalidFields: ({ name }) => ({
        ids: name === EDITED.name ? ['name-field'] : [],
      }),
    });

    act(() => result.current.setValues(EDITED));

    expect(result.current.form.invalidFields?.ids).toEqual(['name-field']);
  });

  it('is archived when the tenant has an archive date', () => {
    const { result } = renderSettingsForm({
      archivedAt: new Date('2026-08-26T00:00:00.000Z'),
    });

    expect(result.current.isArchived).toBe(true);
    expect(result.current.form.isArchived).toBe(true);
  });
});
