import type { TTenantFieldKey } from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { render, screen } from '@testing-library/react';

import { useLockStateChange } from './use-lock-state-change';

const NO_LOCKS = {};
const NAME_LOCKED = { name: { kind: 'running' as const } };
const DOMAIN_LOCKED = { primaryDomain: { kind: 'running' as const } };
const BOTH_LOCKED = {
  name: { kind: 'running' as const },
  primaryDomain: { kind: 'running' as const },
};

type THarnessProps = {
  fieldLocks: typeof NO_LOCKS | typeof NAME_LOCKED | typeof DOMAIN_LOCKED;
  onFieldsLocked?: (keys: TTenantFieldKey[]) => void;
};

/**
 * Minimal harness wiring the hook's ref onto a real focusable container so
 * the DOM-dependent behaviour (focus movement, live-region text) can be
 * exercised directly against the hook, independent of the panel component.
 */
const Harness = ({ fieldLocks, onFieldsLocked = () => {} }: THarnessProps) => {
  const { lockAnnouncement, fieldsContainerRef } = useLockStateChange({
    panelId: 'test-panel',
    fieldLocks,
    lockedAnnouncement: 'locked!',
    unlockedAnnouncement: 'unlocked!',
    onFieldsLocked,
  });

  return (
    <div data-tenant-details-panel="test-panel">
      <span data-testid="live-region" aria-live="assertive">
        {lockAnnouncement}
      </span>
      <div ref={fieldsContainerRef} tabIndex={-1} role="group">
        <input aria-label="inside" />
      </div>
    </div>
  );
};

const OutsideHarness = (props: THarnessProps) => {
  return (
    <>
      <button type="button">outside</button>
      <Harness {...props} />
    </>
  );
};

describe(useLockStateChange, () => {
  it('starts with an empty announcement and does not move focus on mount', () => {
    render(<Harness fieldLocks={NO_LOCKS} />);

    expect(screen.getByTestId('live-region')).toHaveTextContent('');
    expect(document.activeElement).toBe(document.body);
  });

  it('announces a lock once a field newly locks, not on an unrelated re-render', () => {
    const { rerender } = render(<Harness fieldLocks={NO_LOCKS} />);
    const liveRegion = screen.getByTestId('live-region');
    expect(liveRegion).toHaveTextContent('');

    rerender(<Harness fieldLocks={NO_LOCKS} />);
    expect(liveRegion).toHaveTextContent('');

    rerender(<Harness fieldLocks={NAME_LOCKED} />);
    expect(liveRegion).toHaveTextContent('locked!');
  });

  it('announces an unlock once a field becomes editable again', () => {
    const { rerender } = render(<Harness fieldLocks={NAME_LOCKED} />);
    const liveRegion = screen.getByTestId('live-region');

    rerender(<Harness fieldLocks={NO_LOCKS} />);
    expect(liveRegion).toHaveTextContent('unlocked!');
  });

  it('announces a lock, not nothing, on a same-count swap of which field is locked', () => {
    const { rerender } = render(<Harness fieldLocks={NAME_LOCKED} />);
    const liveRegion = screen.getByTestId('live-region');

    rerender(<Harness fieldLocks={DOMAIN_LOCKED} />);
    expect(liveRegion).toHaveTextContent('locked!');
  });

  it('calls onFieldsLocked with the newly-locked keys only', () => {
    const onFieldsLocked = vi.fn();
    const { rerender } = render(
      <Harness fieldLocks={NAME_LOCKED} onFieldsLocked={onFieldsLocked} />,
    );
    expect(onFieldsLocked).not.toHaveBeenCalled();

    rerender(
      <Harness fieldLocks={BOTH_LOCKED} onFieldsLocked={onFieldsLocked} />,
    );
    expect(onFieldsLocked).toHaveBeenCalledWith(['primaryDomain']);
  });

  it('does not call onFieldsLocked when a lock transition only unlocks fields', () => {
    const onFieldsLocked = vi.fn();
    const { rerender } = render(
      <Harness fieldLocks={NAME_LOCKED} onFieldsLocked={onFieldsLocked} />,
    );

    rerender(<Harness fieldLocks={NO_LOCKS} onFieldsLocked={onFieldsLocked} />);
    expect(onFieldsLocked).not.toHaveBeenCalled();
  });

  it('moves focus to the fields container when a field newly locks while focus was inside', () => {
    const { rerender } = render(<Harness fieldLocks={NO_LOCKS} />);

    const insideInput = screen.getByRole('textbox', { name: 'inside' });
    insideInput.focus();
    expect(document.activeElement).toBe(insideInput);

    rerender(<Harness fieldLocks={NAME_LOCKED} />);

    const fieldsContainer = screen.getByRole('group');
    expect(document.activeElement).toBe(fieldsContainer);
  });

  it('does not steal focus when a locking transition fires while focus was outside', () => {
    const { rerender } = render(<OutsideHarness fieldLocks={NO_LOCKS} />);

    const outsideButton = screen.getByRole('button', { name: 'outside' });
    outsideButton.focus();
    expect(document.activeElement).toBe(outsideButton);

    rerender(<OutsideHarness fieldLocks={NAME_LOCKED} />);

    expect(document.activeElement).toBe(outsideButton);
  });

  it('does not move focus on an unrelated re-render while the locked set stays the same', () => {
    const { rerender } = render(<Harness fieldLocks={NO_LOCKS} />);

    const insideInput = screen.getByRole('textbox', { name: 'inside' });
    insideInput.focus();

    rerender(<Harness fieldLocks={NO_LOCKS} />);

    expect(document.activeElement).toBe(insideInput);
  });
});
