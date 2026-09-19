import userEvent from '@testing-library/user-event';

/**
 * `applyAccept: false` bypasses user-event's own `accept`-attribute
 * filtering — real browsers already enforce that at the file picker, so
 * this simulates the one path that can still reach a change handler with a
 * mismatched file type (e.g. drag-and-drop).
 */
export const selectFile = (container: HTMLElement, file: File) => {
  const input = container.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error('file input not found');
  }
  const user = userEvent.setup({ applyAccept: false });
  return user.upload(input, file);
};
