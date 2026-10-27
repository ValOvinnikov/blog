import { ACTION_OUTCOME, FORM_STATUS, type TActionOutcome } from '@blog/config';
import { faker } from '@faker-js/faker';
import { act, renderHook, waitFor } from '@platform/testing/custom-render';

import {
  useSettingsForm,
  type TUseSettingsFormArgs,
} from './use-settings-form';

type TValues = { name: string };
type TResult = { outcome: TActionOutcome };
type TArgs = TUseSettingsFormArgs<TValues, TResult>;

faker.seed(5995);

const MOCK_SAVED_VALUES: TValues = { name: faker.person.fullName() };
const MOCK_EDITED_VALUES: TValues = { name: faker.person.fullName() };
const MOCK_UPLOADED_VALUES: TValues = { name: faker.person.fullName() };
const MOCK_FIELD_ID = faker.lorem.slug();
const MOCK_DRAFT = {
  tenantId: faker.string.uuid(),
  page: faker.lorem.word(),
  fields: [],
};

const renderSettingsForm = (overrides: Partial<TArgs> = {}) =>
  renderHook(() =>
    useSettingsForm<TValues, TResult>({
      initialValues: MOCK_SAVED_VALUES,
      archivedAt: undefined,
      onSubmit: async () => ({ outcome: ACTION_OUTCOME.SUCCESS }),
      countChanges: (values, savedValues) =>
        values.name === savedValues.name ? 0 : 1,
      draft: MOCK_DRAFT,
      ...overrides,
    }),
  );

const editAndSave = async (
  result: ReturnType<typeof renderSettingsForm>['result'],
) => {
  act(() => result.current.setValues(MOCK_EDITED_VALUES));
  let isSaved = false;
  await act(async () => {
    isSaved = await result.current.form.save();
  });
  return isSaved;
};

describe(useSettingsForm, () => {
  it('counts the edits made since the last save', () => {
    const { result } = renderSettingsForm();

    act(() => result.current.setValues(MOCK_EDITED_VALUES));

    expect(result.current.form.changeCount).toBe(1);
  });

  it('treats the submitted values as saved once the save succeeds', async () => {
    const onSuccess = vi.fn();
    const { result } = renderSettingsForm({ onSuccess });

    const isSaved = await editAndSave(result);

    expect(isSaved).toBe(true);
    await waitFor(() =>
      expect(result.current.savedValues).toEqual(MOCK_EDITED_VALUES),
    );
    expect(result.current.form.changeCount).toBe(0);
    expect(onSuccess).toHaveBeenCalledWith(MOCK_EDITED_VALUES, {
      outcome: ACTION_OUTCOME.SUCCESS,
    });
  });

  it('keeps the saved values when the save fails', async () => {
    const { result } = renderSettingsForm({
      onSubmit: async () => ({ outcome: ACTION_OUTCOME.SERVER_ERROR }),
    });

    const isSaved = await editAndSave(result);

    expect(isSaved).toBe(false);
    expect(result.current.savedValues).toEqual(MOCK_SAVED_VALUES);
    expect(result.current.form.changeCount).toBe(1);
    expect(result.current.status).toBe(FORM_STATUS.ERROR);
  });

  it('keeps saved values a save wrote for itself', async () => {
    const { result } = renderSettingsForm({
      onSubmit: async () => {
        result.current.setSavedValues(MOCK_UPLOADED_VALUES);
        return { outcome: ACTION_OUTCOME.SUCCESS };
      },
    });

    await editAndSave(result);

    await waitFor(() =>
      expect(result.current.savedValues).toEqual(MOCK_UPLOADED_VALUES),
    );
  });

  it('does not submit while the values cannot be saved', async () => {
    const onSubmit = vi
      .fn()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
    const { result } = renderSettingsForm({ onSubmit, canSave: () => false });

    const isSaved = await editAndSave(result);

    expect(isSaved).toBe(false);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('returns to the saved values and calls onDiscard on discard', () => {
    const onDiscard = vi.fn();
    const { result } = renderSettingsForm({ onDiscard });
    act(() => result.current.setValues(MOCK_EDITED_VALUES));

    act(() => result.current.form.discard());

    expect(result.current.values).toEqual(MOCK_SAVED_VALUES);
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('reports the invalid controls for the current values', () => {
    const { result } = renderSettingsForm({
      invalidControls: ({ name }) => ({
        ids: name === MOCK_EDITED_VALUES.name ? [MOCK_FIELD_ID] : [],
      }),
    });

    act(() => result.current.setValues(MOCK_EDITED_VALUES));

    expect(result.current.form.invalidControls?.ids).toEqual([MOCK_FIELD_ID]);
  });

  it('is archived when the tenant has an archive date', () => {
    const { result } = renderSettingsForm({
      archivedAt: faker.date.past(),
    });

    expect(result.current.isArchived).toBe(true);
    expect(result.current.form.isArchived).toBe(true);
  });
});
