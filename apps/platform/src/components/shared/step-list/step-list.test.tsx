import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import { render, screen, within } from '@platform/testing/custom-render';
import { MOCK_RUN_PLUS_1_MIN_AT } from '@platform/testing/tenants/fixtures';
import type { ComponentProps } from 'react';

import { StepList } from './step-list';

const SANITY_PROJECT = 'Sanity project';
const SEED_CONTENT = 'Seed content';
const HIDDEN_ICON_SELECTOR = 'span[aria-hidden="true"]';
const RUNNING_NOW = 'Running now';

const steps: ComponentProps<typeof StepList>['steps'] = [
  {
    key: 'one',
    title: SANITY_PROJECT,
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    statusLabel: 'Complete',
  },
  {
    key: 'two',
    title: SEED_CONTENT,
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

describe(`<${StepList.name}/>`, () => {
  describe('with the full step set', () => {
    beforeEach(() => {
      render(<StepList steps={steps} />);
    });

    it('maps each status to its indicator glyph, keeping every glyph decorative', () => {
      const doneGlyph = screen.getByText('✓', {
        selector: HIDDEN_ICON_SELECTOR,
      });
      const runningGlyph = screen.getByText('2', {
        selector: HIDDEN_ICON_SELECTOR,
      });
      const failedGlyph = screen.getByText('!', {
        selector: HIDDEN_ICON_SELECTOR,
      });
      const idleGlyph = screen.getByText('4', {
        selector: HIDDEN_ICON_SELECTOR,
      });

      expect(doneGlyph).toBeVisible();
      expect(runningGlyph).toBeVisible();
      expect(failedGlyph).toBeVisible();
      expect(idleGlyph).toBeVisible();
    });

    it('renders a connector after every step except the last', () => {
      const glyphs = screen.getAllByText((content) => content.length > 0, {
        selector: HIDDEN_ICON_SELECTOR,
      });
      const connectors = screen.getAllByTestId('step-connector');

      expect(glyphs).toHaveLength(steps.length);
      expect(connectors).toHaveLength(steps.length - 1);
    });

    it('carries each step status to assistive tech in a visually-hidden aria-live region', () => {
      for (const { key, statusLabel } of steps) {
        const liveRegion = screen.getByTestId(`step-status-live-${key}`);
        const status = within(liveRegion).getByText(statusLabel);

        expect(liveRegion).toHaveAttribute('aria-live', 'polite');
        expect(status).toBeVisible();
      }
    });
  });

  it('renders an optional trailing slot next to a step', () => {
    render(
      <StepList
        steps={[
          {
            key: 'one',
            title: SEED_CONTENT,
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
            statusLabel: 'Running…',
            trailingSlot: RUNNING_NOW,
          },
        ]}
      />,
    );

    const trailingSlot = screen.getByText(RUNNING_NOW);

    expect(trailingSlot).toBeVisible();
  });

  it('renders an already-formatted updatedAt as a <time> element carrying the raw ISO value', () => {
    render(
      <StepList
        steps={[
          {
            key: 'one',
            title: SANITY_PROJECT,
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
            statusLabel: 'Complete',
            updatedAt: MOCK_RUN_PLUS_1_MIN_AT,
            updatedAtLabel: '6m ago',
          },
        ]}
      />,
    );

    const timestamp = screen.getByText('6m ago');
    expect(timestamp.tagName).toBe('TIME');
    expect(timestamp).toHaveAttribute('dateTime', MOCK_RUN_PLUS_1_MIN_AT);
  });
});
