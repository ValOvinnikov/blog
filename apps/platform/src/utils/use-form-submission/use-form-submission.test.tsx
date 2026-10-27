import { ACTION_OUTCOME, FORM_STATUS, type TActionOutcome } from '@blog/config';
import { faker } from '@faker-js/faker';
import { act, renderHook } from '@platform/testing/custom-render';

import { useFormSubmission } from './use-form-submission';

type TValues = { name: string };
type TResult = { outcome: TActionOutcome };

faker.seed(6006);

const MOCK_INITIAL_NAME = faker.person.fullName();
const MOCK_EDITED_NAME = faker.person.fullName();
const SUCCESS_RESULT: TResult = { outcome: ACTION_OUTCOME.SUCCESS };
const SERVER_ERROR_RESULT: TResult = { outcome: ACTION_OUTCOME.SERVER_ERROR };

const setup = (
  onSubmit: (values: TValues) => Promise<TResult>,
  onSuccess?: (values: TValues, result: TResult) => void,
  initialValues: TValues | (() => TValues) = { name: MOCK_INITIAL_NAME },
) =>
  renderHook(() =>
    useFormSubmission<TValues, TResult>({ initialValues, onSubmit, onSuccess }),
  );

describe(useFormSubmission, () => {
  it('starts idle with the given initial values', () => {
    const { result } = setup(vi.fn().mockResolvedValue(SUCCESS_RESULT));

    expect(result.current.values).toEqual({ name: MOCK_INITIAL_NAME });
    expect(result.current.status).toBe(FORM_STATUS.IDLE);
  });

  it('accepts a lazy initializer', () => {
    const lazyName = faker.person.fullName();
    const { result } = setup(
      vi.fn().mockResolvedValue(SUCCESS_RESULT),
      undefined,
      () => ({ name: lazyName }),
    );

    expect(result.current.values).toEqual({ name: lazyName });
  });

  it('submits the edited values and reports success', async () => {
    const onSubmit = vi.fn().mockResolvedValue(SUCCESS_RESULT);
    const onSuccess = vi.fn();
    const { result } = setup(onSubmit, onSuccess);
    let isSaved = false;

    act(() => {
      result.current.setValues({ name: MOCK_EDITED_NAME });
    });
    await act(async () => {
      isSaved = await result.current.handleSubmit();
    });

    expect(isSaved).toBe(true);
    expect(result.current.status).toBe(FORM_STATUS.SUCCESS);
    expect(onSubmit).toHaveBeenCalledWith({ name: MOCK_EDITED_NAME });
    expect(onSuccess).toHaveBeenCalledWith(
      { name: MOCK_EDITED_NAME },
      SUCCESS_RESULT,
    );
  });

  it.each([
    [
      'resolves with an error outcome',
      vi.fn().mockResolvedValue(SERVER_ERROR_RESULT),
    ],
    ['throws', vi.fn().mockRejectedValue(new Error(faker.lorem.words()))],
  ])(
    'reports an error and skips onSuccess when the submit %s',
    async (_, onSubmit) => {
      const onSuccess = vi.fn();
      const { result } = setup(onSubmit, onSuccess);
      let isSaved = true;

      await act(async () => {
        isSaved = await result.current.handleSubmit();
      });

      expect(isSaved).toBe(false);
      expect(result.current.status).toBe(FORM_STATUS.ERROR);
      expect(onSuccess).not.toHaveBeenCalled();
    },
  );

  it('returns to idle as soon as the values change after a save', async () => {
    const { result } = setup(vi.fn().mockResolvedValue(SUCCESS_RESULT));

    await act(async () => {
      await result.current.handleSubmit();
    });
    act(() => {
      result.current.setValues({ name: MOCK_EDITED_NAME });
    });

    expect(result.current.status).toBe(FORM_STATUS.IDLE);
  });
});
