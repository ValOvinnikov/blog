import { render, screen } from '@platform/testing/custom-render';
import userEvent from '@testing-library/user-event';

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
    const { container } = render(
      <Disclosure summary="Advanced">
        <p>Body</p>
      </Disclosure>,
    );

    const details = container.querySelector('details');
    expect(details).not.toHaveAttribute('open');
  });

  it('opens by default when isDefaultOpen is set', () => {
    const { container } = render(
      <Disclosure summary="Advanced" isDefaultOpen={true}>
        <p>Body</p>
      </Disclosure>,
    );

    const details = container.querySelector('details');
    expect(details).toHaveAttribute('open');
  });

  it('toggles open on click, keeping the state announced via the native open attribute', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Disclosure summary="Advanced">
        <p>Body</p>
      </Disclosure>,
    );

    const details = container.querySelector('details');
    expect(details).not.toHaveAttribute('open');

    await user.click(screen.getByText('Advanced'));

    expect(details).toHaveAttribute('open');
  });

  it('renders a native summary that receives focus without any extra tabIndex wiring', () => {
    const { container } = render(
      <Disclosure summary="Advanced">
        <p>Body</p>
      </Disclosure>,
    );

    const summary = container.querySelector('summary');
    summary?.focus();

    expect(document.activeElement).toBe(summary);
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
});
