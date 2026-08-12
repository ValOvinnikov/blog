import userEvent from '@testing-library/user-event';
import { customRender, screen, waitFor } from '@web/testing/custom-render';
import { useRouter } from 'next/navigation';

import { DisplayNameControl } from './display-name-control';

const { routerRefreshMock, updateDisplayNameActionMock, toastPromiseMock } =
  vi.hoisted(() => ({
    routerRefreshMock: vi.fn(),
    updateDisplayNameActionMock: vi.fn(),
    // Mirrors the real `toast.promise`'s contract closely enough for these
    // tests: it forwards the given promise unchanged, so awaiting/rejecting
    // it in the component under test behaves the same as the real store.
    toastPromiseMock: vi.fn((promise: Promise<unknown>) => promise),
  }));

// `next/navigation` is already globally mocked (`vitest-setup.ts`), but its
// default `useRouter` stub returns a brand-new `refresh: vi.fn()` on every
// call — this override pins a stable `refresh` mock this suite can assert
// against.
vi.mocked(useRouter).mockReturnValue({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: routerRefreshMock,
} as unknown as ReturnType<typeof useRouter>);

vi.mock('@web/server/account/identity-actions', () => ({
  updateDisplayNameAction: updateDisplayNameActionMock,
}));

vi.mock('@web/components/shared/toast-provider', () => ({
  useToast: () => ({
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    promise: toastPromiseMock,
    dismiss: vi.fn(),
  }),
}));

const setup = customRender(DisplayNameControl, {
  initialName: 'Jane Doe',
  email: 'jane@icloud.com',
  image: null,
});

describe(`<${DisplayNameControl.name}/>`, () => {
  beforeEach(() => {
    routerRefreshMock.mockReset();
    updateDisplayNameActionMock.mockReset();
    toastPromiseMock.mockClear();
    toastPromiseMock.mockImplementation((promise: Promise<unknown>) => promise);
  });

  it('renders the current display name in the field and avatar initials', () => {
    setup();

    expect(screen.getByRole('textbox', { name: 'Display name' })).toHaveValue(
      'Jane Doe',
    );
    expect(screen.getByText('JD')).toBeVisible();
    expect(screen.getByTestId('display-name-prompt-icon')).toBeVisible();
  });

  it('saves the edited name through toast.promise and refreshes the router on success', async () => {
    updateDisplayNameActionMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    setup();

    const input = screen.getByRole('textbox', { name: 'Display name' });
    await user.clear(input);
    await user.type(input, 'New Name');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => {
      expect(updateDisplayNameActionMock).toHaveBeenCalledWith('New Name');
    });
    await waitFor(() => {
      expect(routerRefreshMock).toHaveBeenCalledTimes(1);
    });

    expect(toastPromiseMock).toHaveBeenCalledWith(expect.any(Promise), {
      command: 'identity',
      loading: {
        state: 'saving',
        message: 'Saving your display name…',
      },
      success: {
        state: 'saved',
        message: 'Display name updated.',
      },
      error: {
        state: 'failed',
        message: "Couldn't update your display name. Try again.",
      },
    });
  });

  it('disables the save button when the name is cleared to empty', async () => {
    const user = userEvent.setup();
    setup();

    const input = screen.getByRole('textbox', { name: 'Display name' });
    await user.clear(input);

    expect(screen.getByRole('button', { name: 'save' })).toBeDisabled();
    expect(updateDisplayNameActionMock).not.toHaveBeenCalled();
  });

  it('does not refresh the router when the save fails', async () => {
    updateDisplayNameActionMock.mockResolvedValue({ ok: false });
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => {
      expect(toastPromiseMock).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'save' })).toHaveAttribute(
        'aria-busy',
        'false',
      );
    });
    expect(routerRefreshMock).not.toHaveBeenCalled();
  });
});
