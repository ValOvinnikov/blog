import { createHook, type Hook } from 'workflow';

export function fakeRunHook(hasConflict = false) {
  const hook = {
    getConflict: vi.fn(async () => (hasConflict ? ({} as never) : null)),
    dispose: vi.fn(),
    [Symbol.asyncIterator]: () => ({
      next: () => new Promise<never>(() => {}),
    }),
  };
  vi.mocked(createHook).mockReturnValue(hook as unknown as Hook<null>);
  return hook;
}
