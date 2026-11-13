import { ACTION_OUTCOME, FORM_STATUS, type TActionOutcome } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import {
  act,
  renderHookWithIntl,
  waitFor,
} from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { toNotInPlanRefusal } from '@platform/utils/plan-refusal/plan-refusal';
import type { Mock } from 'vitest';

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
const MOCK_FIELD_LABEL = faker.lorem.word();
const MOCK_DRAFT = {
  tenantId: faker.string.uuid(),
  page: faker.lorem.word(),
  fields: [
    {
      id: 'name',
      label: MOCK_FIELD_LABEL,
      display: ({ name }: TValues) => name,
    },
  ],
};
const MOCK_PLAN_REFUSAL_MESSAGE = `Your site is on the Free plan, which doesn't include ${MOCK_FIELD_LABEL}, so nothing was saved.`;

const renderSettingsForm = (overrides: Partial<TArgs> = {}) =>
  renderHookWithIntl(() =>
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

  describe('with an invalid control', () => {
    let revealFirst: Mock<() => void>;

    beforeEach(() => {
      revealFirst = vi.fn();
    });

    it('reveals the first invalid control when the values cannot be saved', async () => {
      const { result } = renderSettingsForm({
        canSave: () => false,
        invalidControls: () => ({ ids: [MOCK_FIELD_ID], revealFirst }),
      });

      await editAndSave(result);

      expect(revealFirst).toHaveBeenCalledTimes(1);
    });

    it('reveals nothing when a form without a save check saves', async () => {
      const { result } = renderSettingsForm({
        invalidControls: () => ({ ids: [MOCK_FIELD_ID], revealFirst }),
      });

      await editAndSave(result);

      expect(revealFirst).not.toHaveBeenCalled();
    });
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

  describe('when the plan refuses the save', () => {
    const refusePlan = async () =>
      toNotInPlanRefusal(TENANT_PLAN.FREE, ['name']);
    let refresh: ReturnType<typeof mockRouterRefresh>;
    let result: ReturnType<typeof renderSettingsForm>['result'];

    beforeEach(async () => {
      refresh = mockRouterRefresh();
      ({ result } = renderSettingsForm({ onSubmit: refusePlan }));
      await editAndSave(result);
    });

    it('names the plan and the refused fields', async () => {
      expect(result.current.form.planRefusal).toBe(MOCK_PLAN_REFUSAL_MESSAGE);
    });

    it('puts the refused fields back to their saved values', async () => {
      expect(result.current.values).toEqual(MOCK_SAVED_VALUES);
    });

    it('refreshes the page once so it takes the current plan', async () => {
      expect(refresh).toHaveBeenCalledTimes(1);
    });

    it('stops naming the refusal once the edits are discarded', async () => {
      act(() => result.current.form.discard());

      expect(result.current.form.planRefusal).toBeUndefined();
    });
  });
});
