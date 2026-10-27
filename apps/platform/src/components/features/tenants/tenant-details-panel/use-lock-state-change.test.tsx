import { customRender, screen } from '@platform/testing/custom-render';
import type {
  TTenantFieldKey,
  TTenantFieldLocks,
} from '@platform/utils/tenant-field-locks/tenant-field-locks';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { useLockStateChange } from './use-lock-state-change';

const LIVE_REGION_TEST_ID = 'live-region';
const MOCK_PANEL_ID = 'mock-panel';
const MOCK_LOCKED_ANNOUNCEMENT = 'mock locked announcement';
const MOCK_UNLOCKED_ANNOUNCEMENT = 'mock unlocked announcement';
const INSIDE_INPUT_LABEL = 'inside';
const OUTSIDE_BUTTON_LABEL = 'outside';

const NO_LOCKS: TTenantFieldLocks = {};
const NAME_LOCKED: TTenantFieldLocks = { name: { kind: 'running' } };
const DOMAIN_LOCKED: TTenantFieldLocks = { primaryDomain: { kind: 'running' } };
const BOTH_LOCKED: TTenantFieldLocks = {
  name: { kind: 'running' },
  primaryDomain: { kind: 'running' },
};

type THarnessProps = {
  fieldLocks: TTenantFieldLocks;
  onFieldsLocked?: (keys: TTenantFieldKey[]) => void;
};

const Harness = ({ fieldLocks, onFieldsLocked = () => {} }: THarnessProps) => {
  const { lockAnnouncement, fieldsContainerRef } = useLockStateChange({
    panelId: MOCK_PANEL_ID,
    fieldLocks,
    lockedAnnouncement: MOCK_LOCKED_ANNOUNCEMENT,
    unlockedAnnouncement: MOCK_UNLOCKED_ANNOUNCEMENT,
    onFieldsLocked,
  });

  return (
    <div data-tenant-details-panel={MOCK_PANEL_ID}>
      <span data-testid={LIVE_REGION_TEST_ID} aria-live="assertive">
        {lockAnnouncement}
      </span>
      <div ref={fieldsContainerRef} tabIndex={-1} role="group">
        <input aria-label={INSIDE_INPUT_LABEL} />
      </div>
    </div>
  );
};

const OutsideHarness = (props: THarnessProps) => {
  return (
    <>
      <button type="button">{OUTSIDE_BUTTON_LABEL}</button>
      <Harness {...props} />
    </>
  );
};

const setup = customRender(Harness, { fieldLocks: NO_LOCKS });
const setupOutside = customRender(OutsideHarness, { fieldLocks: NO_LOCKS });

describe(useLockStateChange, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('starts with an empty announcement and does not move focus on mount', () => {
    setup();

    const liveRegion = screen.getByTestId(LIVE_REGION_TEST_ID);

    expect(liveRegion).toBeEmptyDOMElement();
    expect(document.body).toHaveFocus();
  });

  it('announces a lock once a field newly locks, not on an unrelated re-render', () => {
    const { rerender } = setup();
    const liveRegion = screen.getByTestId(LIVE_REGION_TEST_ID);

    rerender(<Harness fieldLocks={NO_LOCKS} />);
    expect(liveRegion).toBeEmptyDOMElement();

    rerender(<Harness fieldLocks={NAME_LOCKED} />);
    expect(liveRegion).toHaveTextContent(MOCK_LOCKED_ANNOUNCEMENT);
  });

  it('announces an unlock once a field becomes editable again', () => {
    const { rerender } = setup({ fieldLocks: NAME_LOCKED });
    const liveRegion = screen.getByTestId(LIVE_REGION_TEST_ID);

    rerender(<Harness fieldLocks={NO_LOCKS} />);

    expect(liveRegion).toHaveTextContent(MOCK_UNLOCKED_ANNOUNCEMENT);
  });

  it('announces a lock on a same-count swap of which field is locked', () => {
    const { rerender } = setup({ fieldLocks: NAME_LOCKED });
    const liveRegion = screen.getByTestId(LIVE_REGION_TEST_ID);

    rerender(<Harness fieldLocks={DOMAIN_LOCKED} />);

    expect(liveRegion).toHaveTextContent(MOCK_LOCKED_ANNOUNCEMENT);
  });

  it('reports only the newly locked keys', () => {
    const onFieldsLocked = vi.fn();
    const { rerender } = setup({
      fieldLocks: NAME_LOCKED,
      onFieldsLocked,
    });
    expect(onFieldsLocked).not.toHaveBeenCalled();

    rerender(
      <Harness fieldLocks={BOTH_LOCKED} onFieldsLocked={onFieldsLocked} />,
    );

    expect(onFieldsLocked).toHaveBeenCalledWith(['primaryDomain']);
  });

  it('reports nothing when a transition only unlocks fields', () => {
    const onFieldsLocked = vi.fn();
    const { rerender } = setup({
      fieldLocks: NAME_LOCKED,
      onFieldsLocked,
    });

    rerender(<Harness fieldLocks={NO_LOCKS} onFieldsLocked={onFieldsLocked} />);

    expect(onFieldsLocked).not.toHaveBeenCalled();
  });

  it('moves focus to the fields container when a field locks under focus', async () => {
    const { rerender } = setup();
    const insideInput = screen.getByRole('textbox', {
      name: INSIDE_INPUT_LABEL,
    });
    await user.click(insideInput);
    expect(insideInput).toHaveFocus();

    rerender(<Harness fieldLocks={NAME_LOCKED} />);

    const fieldsContainer = screen.getByRole('group');
    expect(fieldsContainer).toHaveFocus();
  });

  it('does not steal focus when a field locks while focus is outside', async () => {
    const { rerender } = setupOutside();
    const outsideButton = screen.getByRole('button', {
      name: OUTSIDE_BUTTON_LABEL,
    });
    await user.click(outsideButton);

    rerender(<OutsideHarness fieldLocks={NAME_LOCKED} />);

    expect(outsideButton).toHaveFocus();
  });

  it('keeps focus in place on a re-render that leaves the locked set unchanged', async () => {
    const { rerender } = setup();
    const insideInput = screen.getByRole('textbox', {
      name: INSIDE_INPUT_LABEL,
    });
    await user.click(insideInput);

    rerender(<Harness fieldLocks={NO_LOCKS} />);

    expect(insideInput).toHaveFocus();
  });
});
