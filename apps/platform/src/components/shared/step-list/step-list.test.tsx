import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import { render, screen } from '@platform/testing/custom-render';

import { StepList, type TStepListStep } from './step-list';

const steps: TStepListStep[] = [
  {
    key: 'one',
    title: 'Sanity project',
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    statusLabel: 'Complete',
  },
  {
    key: 'two',
    title: 'Seed content',
    status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
    statusLabel: 'Running…',
  },
  {
    key: 'three',
    title: 'Map domain',
    status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
    statusLabel: 'Failed',
  },
  {
    key: 'four',
    title: 'Create webhook',
    status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
    statusLabel: 'Not started',
  },
];

describe(StepList, () => {
  it('maps each status to its indicator glyph, keeping every glyph decorative', () => {
    render(<StepList steps={steps} />);

    expect(
      screen.getByText('✓', { selector: 'span[aria-hidden="true"]' }),
    ).toBeVisible();
    expect(
      screen.getByText('2', { selector: 'span[aria-hidden="true"]' }),
    ).toBeVisible();
    expect(
      screen.getByText('!', { selector: 'span[aria-hidden="true"]' }),
    ).toBeVisible();
    expect(
      screen.getByText('4', { selector: 'span[aria-hidden="true"]' }),
    ).toBeVisible();
  });

  it('renders a connector after every step except the last', () => {
    const { container } = render(<StepList steps={steps} />);

    const hiddenSpans = Array.from(
      container.querySelectorAll('span[aria-hidden="true"]'),
    );
    const connectors = hiddenSpans.filter((span) => span.textContent === '');
    const glyphs = hiddenSpans.filter((span) => span.textContent !== '');

    expect(glyphs).toHaveLength(steps.length);
    expect(connectors).toHaveLength(steps.length - 1);
  });

  it('carries each step status to assistive tech in a visually-hidden aria-live region', () => {
    render(<StepList steps={steps} />);

    for (const { statusLabel } of steps) {
      const status = screen.getByText(statusLabel);
      expect(status.closest('[aria-live="polite"]')).not.toBeNull();
      expect(status.className).toContain('sr-only');
    }
  });

  it('renders an optional trailing slot next to a step', () => {
    render(
      <StepList
        steps={[
          {
            key: 'one',
            title: 'Seed content',
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
            statusLabel: 'Running…',
            trailingSlot: 'Running now',
          },
        ]}
      />,
    );

    expect(screen.getByText('Running now')).toBeVisible();
  });

  it('renders an already-formatted updatedAt as a <time> element carrying the raw ISO value', () => {
    render(
      <StepList
        steps={[
          {
            key: 'one',
            title: 'Sanity project',
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            statusLabel: 'Complete',
            updatedAt: '2026-08-12T14:19:00.000Z',
            updatedAtLabel: '6m ago',
          },
        ]}
      />,
    );

    const timestamp = screen.getByText('6m ago');
    expect(timestamp.tagName).toBe('TIME');
    expect(timestamp).toHaveAttribute('dateTime', '2026-08-12T14:19:00.000Z');
  });
});
