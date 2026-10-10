import { TOAST_TYPE } from '@blog/config';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

import { Toast } from './toast';
import type { IToastRecord } from './toast-record';

const buildRecord = (overrides?: Partial<IToastRecord>): IToastRecord => ({
  id: 'toast-1',
  type: TOAST_TYPE.SUCCESS,
  message: 'Saved',
  phase: 'visible',
  paused: false,
  createdAt: 0,
  ...overrides,
});

describe(Toast, () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders its message', () => {
    renderWithIntl(<Toast record={buildRecord()} onDismiss={vi.fn()} />);
    expect(screen.getByText('Saved')).toBeVisible();
  });

  it('renders a bolded title ahead of the message when given', () => {
    renderWithIntl(
      <Toast
        record={buildRecord({
          title: 'Bookmark',
          message: 'Saved to bookmarks',
        })}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText('Bookmark').tagName).toBe('STRONG');
    expect(screen.getByText('Saved to bookmarks')).toBeVisible();
  });

  it('renders no title element when none is given', () => {
    renderWithIntl(<Toast record={buildRecord()} onDismiss={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent(/^✓Saved×$/);
  });

  it('renders the time when given', () => {
    renderWithIntl(
      <Toast record={buildRecord({ time: '12:04' })} onDismiss={vi.fn()} />,
    );
    expect(screen.getByText('12:04')).toBeVisible();
  });

  it('renders an assertive alert role for the ERROR type', () => {
    renderWithIntl(
      <Toast
        record={buildRecord({
          type: TOAST_TYPE.ERROR,
          message: "Couldn't save",
        })}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't save");
  });

  it.each([TOAST_TYPE.SUCCESS, TOAST_TYPE.WARNING, TOAST_TYPE.INFO])(
    'renders a polite status role for the %s type',
    (type) => {
      renderWithIntl(
        <Toast
          record={buildRecord({ type, message: 'Status update' })}
          onDismiss={vi.fn()}
        />,
      );
      expect(screen.getByRole('status')).toHaveTextContent('Status update');
    },
  );

  it('labels the dismiss button from its own catalogue and calls onDismiss when clicked', async () => {
    const onDismiss = vi.fn();
    renderWithIntl(<Toast record={buildRecord()} onDismiss={onDismiss} />);

    await user.click(
      screen.getByRole('button', { name: 'Dismiss notification' }),
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders an action button and calls its handler', async () => {
    const onAct = vi.fn();
    renderWithIntl(
      <Toast
        record={buildRecord({ action: { label: 'Undo', onAct } })}
        onDismiss={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAct).toHaveBeenCalledTimes(1);
  });

  it('renders a spinner instead of the type glyph while loading', () => {
    renderWithIntl(
      <Toast
        record={buildRecord({
          type: TOAST_TYPE.INFO,
          message: 'Saving…',
          isLoading: true,
        })}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText('Saving…')).toBeVisible();
    expect(screen.queryByText('i')).not.toBeInTheDocument();
  });

  it('renders every type and phase without throwing', () => {
    for (const type of Object.values(TOAST_TYPE)) {
      for (const phase of ['entering', 'visible', 'leaving'] as const) {
        expect(() =>
          renderWithIntl(
            <Toast
              record={buildRecord({ type, phase, message: 'Label' })}
              onDismiss={vi.fn()}
            />,
          ),
        ).not.toThrow();
      }
    }
  });
});
