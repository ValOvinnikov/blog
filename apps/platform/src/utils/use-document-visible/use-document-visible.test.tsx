import { fireEvent, renderHook } from '@platform/testing/custom-render';

import { useDocumentVisible } from './use-document-visible';

const HIDDEN: DocumentVisibilityState = 'hidden';
const VISIBLE: DocumentVisibilityState = 'visible';

const changeVisibility = (state: DocumentVisibilityState) => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
  fireEvent(document, new Event('visibilitychange'));
};

describe(useDocumentVisible, () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports a visible document', () => {
    const { result } = renderHook(() => useDocumentVisible());

    expect(result.current).toBe(true);
  });

  it('reports the document hidden once it is', () => {
    const { result } = renderHook(() => useDocumentVisible());

    changeVisibility(HIDDEN);

    expect(result.current).toBe(false);
  });

  it('reports the document visible again once it returns', () => {
    const { result } = renderHook(() => useDocumentVisible());

    changeVisibility(HIDDEN);
    changeVisibility(VISIBLE);

    expect(result.current).toBe(true);
  });
});
