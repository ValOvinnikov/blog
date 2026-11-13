import { fireEvent } from '@testing-library/react';

export const DOCUMENT_HIDDEN: DocumentVisibilityState = 'hidden';
export const DOCUMENT_VISIBLE: DocumentVisibilityState = 'visible';

export const changeDocumentVisibility = (state: DocumentVisibilityState) => {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
  fireEvent(document, new Event('visibilitychange'));
};
