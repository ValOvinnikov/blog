import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import { render, screen } from '@platform/testing/custom-render';
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
      expect(
        screen.getByText('✓', { selector: HIDDEN_ICON_SELECTOR }),
      ).toBeVisible();
      expect(
        screen.getByText('2', { selector: HIDDEN_ICON_SELECTOR }),
      ).toBeVisible();
      expect(
        screen.getByText('!', { selector: HIDDEN_ICON_SELECTOR }),
      ).toBeVisible();
      expect(
        screen.getByText('4', { selector: HIDDEN_ICON_SELECTOR }),
      ).toBeVisible();
    });

    it('renders a connector after every step except the last', () => {
      expect(
        screen.getAllByText((content) => content.length > 0, {
          selector: HIDDEN_ICON_SELECTOR,
        }),
      ).toHaveLength(steps.length);
      expect(screen.getAllByTestId('step-connector')).toHaveLength(
        steps.length - 1,
      );
    });

    it('carries each step status to assistive tech in a visually-hidden aria-live region', () => {
      for (const { statusLabel } of steps) {
        const status = screen.getByText(statusLabel);
        expect(status.closest('[aria-live="polite"]')).not.toBeNull();
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

    expect(screen.getByText(RUNNING_NOW)).toBeVisible();
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
