import userEvent from '@testing-library/user-event';
import { customRender, screen } from '@web/testing/custom-render';
import { useRef, useState } from 'react';

import { usePanelScrollLock } from './use-panel-scroll-lock';

const Harness = () => {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  usePanelScrollLock(panelRef, open);

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)}>
        toggle
      </button>
      <div ref={panelRef} data-testid="panel" hidden={!open} />
    </div>
  );
};

const setup = customRender(Harness, {});

const getRootOverflow = () => document.documentElement.style.overflow;

describe(usePanelScrollLock, () => {
  beforeEach(() => {
    document.documentElement.style.overflow = 'auto';
    setup();
  });

  it('leaves page scrolling alone while the panel is closed', () => {
    expect(getRootOverflow()).toBe('auto');
  });

  it('stops the page scrolling while the panel is open', async () => {
    await userEvent.click(screen.getByRole('button', { name: 'toggle' }));

    expect(getRootOverflow()).toBe('hidden');
  });

  it('caps the open panel to the viewport height below its top edge', async () => {
    await userEvent.click(screen.getByRole('button', { name: 'toggle' }));

    expect(screen.getByTestId('panel').style.maxHeight).toBe(
      `${window.innerHeight}px`,
    );
  });

  it('restores page scrolling and drops the cap once the panel closes', async () => {
    const toggle = screen.getByRole('button', { name: 'toggle' });
    await userEvent.click(toggle);
    await userEvent.click(toggle);

    expect(getRootOverflow()).toBe('auto');
    expect(screen.getByTestId('panel').style.maxHeight).toBe('');
  });
});
