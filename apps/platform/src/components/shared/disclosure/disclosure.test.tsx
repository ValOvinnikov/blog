import { render, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { Disclosure } from './disclosure';

describe(Disclosure, () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  it('renders the summary as a collapsed button and hides the content', () => {
    render(
      <Disclosure summary="Advanced">
        <p>Curated overrides live here.</p>
      </Disclosure>,
    );

    expect(screen.getByRole('button', { name: 'Advanced' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByText('Curated overrides live here.')).not.toBeVisible();
  });

  it('renders the trigger inside a heading of the given level', () => {
    render(
      <Disclosure summary="Steps" headingLevel={2}>
        <p>Body</p>
      </Disclosure>,
    );

    expect(
      screen.getByRole('heading', { level: 2, name: 'Steps' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Steps' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('toggles from inside its heading', async () => {
    render(
      <Disclosure summary="Steps" headingLevel={3}>
        <p>Body</p>
      </Disclosure>,
    );

    await user.click(screen.getByRole('button', { name: 'Steps' }));

    expect(screen.getByRole('button', { name: 'Steps' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Body')).toBeVisible();
  });

  it('renders no heading without a headingLevel', () => {
    render(
      <Disclosure summary="Advanced">
        <p>Body</p>
      </Disclosure>,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('toggles open and closed on click', async () => {
    render(
      <Disclosure summary="Advanced">
        <p>Body</p>
      </Disclosure>,
    );
    const trigger = screen.getByRole('button', { name: 'Advanced' });

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Body')).toBeVisible();

    await user.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Body')).not.toBeVisible();
  });

  it.each(['{Enter}', ' '])('toggles with the %s key', async (key) => {
    render(
      <Disclosure summary="Advanced" variant="inline">
        <p>Body</p>
      </Disclosure>,
    );

    await user.tab();
    expect(screen.getByRole('button', { name: 'Advanced' })).toHaveFocus();

    await user.keyboard(key);

    expect(screen.getByRole('button', { name: 'Advanced' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Body')).toBeVisible();
  });

  it('renders with no children without throwing', () => {
    expect(() =>
      render(<Disclosure summary="Advanced">{null}</Disclosure>),
    ).not.toThrow();
    expect(screen.getByRole('button', { name: 'Advanced' })).toBeVisible();
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

      expect(screen.getByRole('button', { name: 'Advanced' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );

      rerender(
        <Disclosure summary="Advanced" isOpen={true} onOpenChange={vi.fn()}>
          <p>Body</p>
        </Disclosure>,
      );

      expect(screen.getByRole('button', { name: 'Advanced' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });

    it('calls onOpenChange with the next value without opening on its own', async () => {
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

      await user.click(screen.getByRole('button', { name: 'Advanced' }));

      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.getByText('Body')).not.toBeVisible();
    });

    it('round-trips through a caller that feeds onOpenChange back in as isOpen', async () => {
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

      await user.click(screen.getByRole('button', { name: 'Advanced' }));

      expect(screen.getByRole('button', { name: 'Advanced' })).toHaveAttribute(
        'aria-expanded',
        'true',
      );
    });
  });
});
