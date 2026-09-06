import { TOAST_TYPE } from '@blog/config';
import { render, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { Toast } from './toast';

describe(Toast, () => {
  it('renders its message', () => {
    render(
      <Toast
        type={TOAST_TYPE.SUCCESS}
        message="Saved"
        dismissLabel="Dismiss"
        onDismiss={vi.fn()}
        phase="visible"
      />,
    );
    expect(screen.getByText('Saved')).toBeVisible();
  });

  it('renders a bolded title ahead of the message when given', () => {
    render(
      <Toast
        type={TOAST_TYPE.SUCCESS}
        title="Bookmark"
        message="Saved to bookmarks"
        dismissLabel="Dismiss"
        onDismiss={vi.fn()}
        phase="visible"
      />,
    );
    expect(screen.getByText('Bookmark').tagName).toBe('STRONG');
    expect(screen.getByText('Saved to bookmarks')).toBeVisible();
  });

  it('renders no title element when none is given', () => {
    render(
      <Toast
        type={TOAST_TYPE.SUCCESS}
        message="Saved"
        dismissLabel="Dismiss"
        onDismiss={vi.fn()}
        phase="visible"
      />,
    );
    expect(document.querySelector('strong')).not.toBeInTheDocument();
  });

  it('renders an assertive alert role for the ERROR type', () => {
    render(
      <Toast
        type={TOAST_TYPE.ERROR}
        message="Couldn't save"
        dismissLabel="Dismiss"
        onDismiss={vi.fn()}
        phase="visible"
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't save");
  });

  it.each([TOAST_TYPE.SUCCESS, TOAST_TYPE.WARNING, TOAST_TYPE.INFO])(
    'renders a polite status role for the %s type',
    (type) => {
      render(
        <Toast
          type={type}
          message="Status update"
          dismissLabel="Dismiss"
          onDismiss={vi.fn()}
          phase="visible"
        />,
      );
      expect(screen.getByRole('status')).toHaveTextContent('Status update');
    },
  );

  it('calls onDismiss when the dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(
      <Toast
        type={TOAST_TYPE.SUCCESS}
        message="Saved"
        dismissLabel="Dismiss notification"
        onDismiss={onDismiss}
        phase="visible"
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Dismiss notification' }),
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders an action button and calls its handler', async () => {
    const user = userEvent.setup();
    const onAct = vi.fn();
    render(
      <Toast
        type={TOAST_TYPE.SUCCESS}
        message="Saved"
        dismissLabel="Dismiss"
        onDismiss={vi.fn()}
        phase="visible"
        action={{ label: 'Undo', onAct }}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAct).toHaveBeenCalledTimes(1);
  });

  it('renders a spinner instead of the type glyph while loading', () => {
    render(
      <Toast
        type={TOAST_TYPE.INFO}
        message="Saving…"
        dismissLabel="Dismiss"
        onDismiss={vi.fn()}
        phase="visible"
        isLoading={true}
      />,
    );
    expect(screen.getByText('Saving…')).toBeVisible();
    expect(screen.queryByText('i')).not.toBeInTheDocument();
  });

  it('renders every type and phase without throwing', () => {
    for (const type of Object.values(TOAST_TYPE)) {
      for (const phase of ['entering', 'visible', 'leaving'] as const) {
        expect(() =>
          render(
            <Toast
              type={type}
              message="Label"
              dismissLabel="Dismiss"
              onDismiss={vi.fn()}
              phase={phase}
            />,
          ),
        ).not.toThrow();
      }
    }
  });
});
