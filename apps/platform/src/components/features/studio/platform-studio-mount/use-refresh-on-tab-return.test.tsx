import { renderHook } from '@platform/testing/custom-render';
import {
  changeDocumentVisibility,
  DOCUMENT_HIDDEN,
  DOCUMENT_VISIBLE,
} from '@platform/testing/document-visibility';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { fireEvent } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useRefreshOnTabReturn } from './use-refresh-on-tab-return';

const leaveWindow = (isFocusStillOnPage: boolean) => {
  vi.spyOn(document, 'hasFocus').mockReturnValue(isFocusStillOnPage);
  fireEvent.blur(window);
};

describe(useRefreshOnTabReturn, () => {
  let refresh: Mock<() => void>;

  beforeEach(() => {
    refresh = mockRouterRefresh();
    renderHook(useRefreshOnTabReturn);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('makes no request while the tab stays focused', () => {
    fireEvent.focus(window);
    changeDocumentVisibility(DOCUMENT_VISIBLE);

    expect(refresh).not.toHaveBeenCalled();
  });

  it('refreshes once when a hidden tab becomes visible and regains focus', () => {
    changeDocumentVisibility(DOCUMENT_HIDDEN);
    changeDocumentVisibility(DOCUMENT_VISIBLE);
    fireEvent.focus(window);

    expect(refresh).toHaveBeenCalledOnce();
  });

  describe('after focus leaves for another window', () => {
    beforeEach(() => {
      leaveWindow(false);
    });

    describe('once the window regains focus', () => {
      beforeEach(() => {
        fireEvent.focus(window);
      });

      it('refreshes', () => {
        expect(refresh).toHaveBeenCalledOnce();
      });

      it('refreshes again on the next return', () => {
        leaveWindow(false);
        fireEvent.focus(window);

        expect(refresh).toHaveBeenCalledTimes(2);
      });
    });
  });

  it('makes no request when focus moves into a frame on the page and back', () => {
    leaveWindow(true);
    fireEvent.focus(window);

    expect(refresh).not.toHaveBeenCalled();
  });
});
