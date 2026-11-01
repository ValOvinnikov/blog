import type { TProvisioningRun } from '@blog/db/schema/tenants';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  MOCK_RUN_PLUS_4_MIN_AT,
  MOCK_RUN_PLUS_6_MIN_AT,
  MOCK_RUN_STARTED_AT,
  RUN_FINISHED_PENDING_TEXT,
} from '@platform/testing/tenants/fixtures';

import { RunCard } from './run-card';

faker.seed(5994);

const MOCK_WORKFLOW_RUN_URL = faker.internet.url();
const MOCK_REGISTRY = faker.lorem.word();

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

  it('shows relative and absolute UTC times for a finished run', () => {
    vi.setSystemTime(new Date(MOCK_RUN_PLUS_6_MIN_AT));

    setup({
      run: {
        startedAt: MOCK_RUN_STARTED_AT,
        finishedAt: MOCK_RUN_PLUS_4_MIN_AT,
        registry: MOCK_REGISTRY,
      } as TProvisioningRun,
    });

    const started = screen.getByText('6m ago · Aug 12, 2026, 2:18 PM UTC');
    const finished = screen.getByText('2m ago · Aug 12, 2026, 2:22 PM UTC');
    const registry = screen.getByText(MOCK_REGISTRY);

    expect(started.tagName).toBe('TIME');
    expect(started).toHaveAttribute('dateTime', MOCK_RUN_STARTED_AT);
    expect(finished.tagName).toBe('TIME');
    expect(finished).toHaveAttribute('dateTime', MOCK_RUN_PLUS_4_MIN_AT);
    expect(registry).toBeVisible();
  });

  it('shows a waiting placeholder for a run admitted but not yet started', () => {
    setup({
      run: {
        admittedAt: MOCK_RUN_STARTED_AT,
      } as unknown as TProvisioningRun,
    });

    const placeholder = screen.getByText('Waiting for the run to start…');

    expect(placeholder).toBeVisible();
    expect(placeholder.tagName).not.toBe('TIME');
  });

  it('shows a dash placeholder for Finished while the run is in flight', () => {
    setup();

    const placeholder = screen.getByText(RUN_FINISHED_PENDING_TEXT);

    expect(placeholder).toBeVisible();
    expect(placeholder.tagName).not.toBe('TIME');
  });

  it('offers no workflow log link when the run has none', () => {
    setup({
      run: {
        startedAt: MOCK_RUN_STARTED_AT,
        finishedAt: MOCK_RUN_PLUS_4_MIN_AT,
      } as TProvisioningRun,
    });

    const workflowLink = screen.queryByRole('link', { name: /workflow log/i });

    expect(workflowLink).not.toBeInTheDocument();
  });

  it('links out to the workflow run in a new tab', () => {
    setup({
      run: {
        startedAt: MOCK_RUN_STARTED_AT,
        workflowRunUrl: MOCK_WORKFLOW_RUN_URL,
      } as TProvisioningRun,
    });

    const link = screen.getByRole('link', { name: /workflow log/i });

    expect(link).toHaveAttribute('href', MOCK_WORKFLOW_RUN_URL);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('titles the card with a level-2 heading by default', () => {
    setup();

    const heading = screen.getByRole('heading', { level: 2, name: 'Run' });

    expect(heading).toBeVisible();
  });

  it('titles the card at the heading level it is given', () => {
    setup({ headingLevel: 3 });

    const heading = screen.getByRole('heading', { level: 3, name: 'Run' });

    expect(heading).toBeVisible();
  });

  it('says no run has started yet when there is no run', () => {
    setup({ run: undefined });

    const emptyMessage = screen.getByText('No run has started yet.');
    const startedLabel = screen.queryByText('Started');

    expect(emptyMessage).toBeVisible();
    expect(startedLabel).not.toBeInTheDocument();
  });

  it('renders actions in the card header', () => {
    setup({ actions: <span>Complete</span> });

    const action = screen.getByText('Complete');

    expect(action).toBeVisible();
  });
});
