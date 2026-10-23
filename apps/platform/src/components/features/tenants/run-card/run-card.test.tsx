import type { TProvisioningRun } from '@blog/db/schema/tenants';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  MOCK_RUN_PLUS_4_MIN_AT,
  MOCK_RUN_PLUS_6_MIN_AT,
  MOCK_RUN_STARTED_AT,
} from '@platform/testing/tenants/fixtures';

import { RunCard } from './run-card';

const WORKFLOW_RUN_URL = 'https://github.com/example/actions/runs/1';

const setup = customRender(RunCard, {
  run: { startedAt: MOCK_RUN_STARTED_AT } as TProvisioningRun,
});

describe(`<${RunCard.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the started and finished times as relative and absolute UTC together when the run has finished', () => {
    vi.setSystemTime(new Date(MOCK_RUN_PLUS_6_MIN_AT));

    setup({
      run: {
        startedAt: MOCK_RUN_STARTED_AT,
        finishedAt: MOCK_RUN_PLUS_4_MIN_AT,
        registry: 'production',
        workflowRunUrl: WORKFLOW_RUN_URL,
      } as TProvisioningRun,
    });

    const started = screen.getByText('6m ago · Aug 12, 2026, 2:18 PM UTC');
    const finished = screen.getByText('2m ago · Aug 12, 2026, 2:22 PM UTC');
    expect(started.tagName).toBe('TIME');
    expect(started).toHaveAttribute('dateTime', MOCK_RUN_STARTED_AT);
    expect(finished.tagName).toBe('TIME');
    expect(finished).toHaveAttribute('dateTime', MOCK_RUN_PLUS_4_MIN_AT);
    expect(screen.getByText('production')).toBeVisible();
  });

  it('shows a waiting-to-start placeholder for Started when the run has been admitted but has not yet begun, with no <time> element', () => {
    setup({
      run: {
        admittedAt: MOCK_RUN_STARTED_AT,
      } as unknown as TProvisioningRun,
    });

    const placeholder = screen.getByText('Waiting for the run to start…');
    expect(placeholder).toBeVisible();
    expect(placeholder.tagName).not.toBe('TIME');
  });

  it('shows an em-dash placeholder for Finished while the run is still in flight, with no <time> element', () => {
    setup();

    const placeholder = screen.getByText('—');
    expect(placeholder).toBeVisible();
    expect(placeholder.tagName).not.toBe('TIME');
  });

  it('renders no workflow log link when the run has no workflowRunUrl', () => {
    setup({
      run: {
        startedAt: MOCK_RUN_STARTED_AT,
        finishedAt: MOCK_RUN_PLUS_4_MIN_AT,
      } as TProvisioningRun,
    });

    expect(
      screen.queryByRole('link', { name: /workflow log/i }),
    ).not.toBeInTheDocument();
  });

  it('links out to the workflow run when workflowRunUrl is present', () => {
    setup({
      run: {
        startedAt: MOCK_RUN_STARTED_AT,
        workflowRunUrl: WORKFLOW_RUN_URL,
      } as TProvisioningRun,
    });

    const link = screen.getByRole('link', { name: /workflow log/i });
    expect(link).toHaveAttribute('href', WORKFLOW_RUN_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('nests the card title one level under the page heading', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Run' }),
    ).toBeVisible();
  });

  it('takes the heading level it is given', () => {
    setup({ headingLevel: 3 });

    expect(
      screen.getByRole('heading', { level: 3, name: 'Run' }),
    ).toBeVisible();
  });

  it('says no run has started yet when there is no run', () => {
    setup({ run: undefined });

    expect(screen.getByText('No run has started yet.')).toBeVisible();
    expect(screen.queryByText('Started')).not.toBeInTheDocument();
  });

  it('renders actions in the card header', () => {
    setup({ actions: <span>Complete</span> });

    expect(screen.getByText('Complete')).toBeVisible();
  });
});
