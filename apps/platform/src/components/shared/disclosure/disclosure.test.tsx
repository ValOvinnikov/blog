import { render, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { Disclosure } from './disclosure';

describe(Disclosure, () => {
  it('renders the summary and content', () => {
    render(
      <Disclosure summary="Advanced">
        <p>Curated overrides live here.</p>
      </Disclosure>,
    );

    expect(screen.getByText('Advanced')).toBeVisible();
    expect(
      screen.getByText('Curated overrides live here.'),
    ).toBeInTheDocument();
  });

  it('is closed by default', () => {
    render(
      <Disclosure summary="Advanced">
        <p>Body</p>
      </Disclosure>,
    );

    expect(screen.getByRole('group')).not.toHaveAttribute('open');
  });

  it('opens by default when isDefaultOpen is set', () => {
    render(
      <Disclosure summary="Advanced" isDefaultOpen={true}>
        <p>Body</p>
      </Disclosure>,
    );

    expect(screen.getByRole('group')).toHaveAttribute('open');
  });

  it('toggles open on click, keeping the state announced via the native open attribute', async () => {
    const user = userEvent.setup();
    render(
      <Disclosure summary="Advanced">
        <p>Body</p>
      </Disclosure>,
    );

    expect(screen.getByRole('group')).not.toHaveAttribute('open');

    await user.click(screen.getByText('Advanced'));

    expect(screen.getByRole('group')).toHaveAttribute('open');
  });

  it('renders a native summary that receives focus without any extra tabIndex wiring', () => {
    render(
      <Disclosure summary="Advanced">
        <p>Body</p>
      </Disclosure>,
    );

    const summary = screen.getByText('Advanced');
    summary.focus();

    expect(summary).toHaveFocus();
  });

  it('renders with no children without throwing', () => {
    expect(() =>
      render(<Disclosure summary="Advanced">{null}</Disclosure>),
    ).not.toThrow();
    expect(screen.getByText('Advanced')).toBeVisible();
  });

  it('accepts a non-text ReactNode as the summary', () => {
    render(
      <Disclosure
        summary={
          <span>
            Advanced <span>optional</span>
          </span>
        }
      >
        <p>Body</p>
      </Disclosure>,
    );

    expect(screen.getByText('optional')).toBeVisible();
  });

  describe('controlled mode', () => {
    it('reflects isOpen rather than internal state', () => {
      const { rerender } = render(
        <Disclosure summary="Advanced" isOpen={false} onOpenChange={vi.fn()}>
          <p>Body</p>
        </Disclosure>,
      );

      expect(screen.getByRole('group')).not.toHaveAttribute('open');

      rerender(
        <Disclosure summary="Advanced" isOpen={true} onOpenChange={vi.fn()}>
          <p>Body</p>
        </Disclosure>,
      );

      expect(screen.getByRole('group')).toHaveAttribute('open');
    });

    it('calls onOpenChange with the next value when toggled', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <Disclosure
          summary="Advanced"
          isOpen={false}
          onOpenChange={onOpenChange}
        >
          <p>Body</p>
        </Disclosure>,
      );

      await user.click(screen.getByText('Advanced'));

      expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    it('round-trips through a caller that feeds onOpenChange back in as isOpen', async () => {
      const user = userEvent.setup();
      const ControlledDisclosure = () => {
        const [isOpen, setIsOpen] = useState(false);
        return (
          <Disclosure
            summary="Advanced"
            isOpen={isOpen}
            onOpenChange={setIsOpen}
          >
            <p>Body</p>
          </Disclosure>
        );
      };
      render(<ControlledDisclosure />);
      expect(screen.getByRole('group')).not.toHaveAttribute('open');

      await user.click(screen.getByText('Advanced'));

      expect(screen.getByRole('group')).toHaveAttribute('open');
    });
  });
});
