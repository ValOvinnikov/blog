import { ASSET_UPLOAD_INPUT_TEST_ID } from '@platform/constants/asset-upload';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// `applyAccept: false` bypasses user-event's own `accept`-attribute filtering, simulating a mismatched file reaching the handler (e.g. drag-and-drop).
export const selectFile = (file: File) => {
  const input = screen.getByTestId(ASSET_UPLOAD_INPUT_TEST_ID);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('file input not found');
  }
  const user = userEvent.setup({ applyAccept: false });
  return user.upload(input, file);
};
