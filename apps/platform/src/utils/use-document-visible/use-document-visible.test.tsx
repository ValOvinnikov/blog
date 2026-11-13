import { renderHook } from '@platform/testing/custom-render';
import {
  changeDocumentVisibility,
  DOCUMENT_HIDDEN,
  DOCUMENT_VISIBLE,
} from '@platform/testing/document-visibility';

import { useDocumentVisible } from './use-document-visible';

describe(useDocumentVisible, () => {
  let result: { current: boolean };

  beforeEach(() => {
    ({ result } = renderHook(() => useDocumentVisible()));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports a visible document', () => {
    expect(result.current).toBe(true);
  });

  describe('once the document is hidden', () => {
    beforeEach(() => {
      changeDocumentVisibility(DOCUMENT_HIDDEN);
    });

    it('reports it hidden', () => {
      expect(result.current).toBe(false);
    });

    it('reports it visible again once it returns', () => {
      changeDocumentVisibility(DOCUMENT_VISIBLE);

      expect(result.current).toBe(true);
    });
  });
});
