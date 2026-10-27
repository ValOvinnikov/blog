import { withMemoizingReactCache } from '@web/testing/shared/react-cache/memoizing-react-cache';

export const importWithMemoizingCache = async <TModule>(
  load: () => Promise<TModule>,
): Promise<TModule> => {
  vi.doMock('react', withMemoizingReactCache);
  vi.resetModules();
  return load();
};

export const restoreReactCache = () => {
  vi.doUnmock('react');
  vi.resetModules();
};
