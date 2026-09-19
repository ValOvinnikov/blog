import type { TDeprovisioningRun } from '@blog/db/schema/tenants';
import { customRender, screen } from '@platform/testing/custom-render';

import { RunCard } from './run-card';

const setup = customRender(RunCard, {
  run: { startedAt: '2026-08-12T14:18:00.000Z' } as TDeprovisioningRun,
});

describe(`<${RunCard.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the started and finished times as relative and absolute UTC together when the run has finished', () => {
    vi.setSystemTime(new Date('2026-08-12T14:24:00.000Z'));

    setup({
      run: {
        startedAt: '2026-08-12T14:18:00.000Z',
        finishedAt: '2026-08-12T14:22:00.000Z',
        workflowRunUrl: 'https://github.com/example/actions/runs/1',
      } as TDeprovisioningRun,
    });

    const started = screen.getByText('6m ago · Aug 12, 2026, 2:18 PM UTC');
    const finished = screen.getByText('2m ago · Aug 12, 2026, 2:22 PM UTC');
    expect(started.tagName).toBe('TIME');
    expect(started).toHaveAttribute('dateTime', '2026-08-12T14:18:00.000Z');
    expect(finished.tagName).toBe('TIME');
    expect(finished).toHaveAttribute('dateTime', '2026-08-12T14:22:00.000Z');
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
        startedAt: '2026-08-12T14:18:00.000Z',
        finishedAt: '2026-08-12T14:22:00.000Z',
      } as TDeprovisioningRun,
    });

    expect(
      screen.queryByRole('link', { name: /workflow log/i }),
    ).not.toBeInTheDocument();
  });

  it('links out to the workflow run when workflowRunUrl is present', () => {
    setup({
      run: {
        startedAt: '2026-08-12T14:18:00.000Z',
        workflowRunUrl: 'https://github.com/example/actions/runs/1',
      } as TDeprovisioningRun,
    });

    const link = screen.getByRole('link', { name: /workflow log/i });
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/example/actions/runs/1',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('nests the card title one level under the page heading', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Run' }),
    ).toBeVisible();
  });

  it('renders actions in the card header', () => {
    setup({ actions: <span>Complete</span> });

    expect(screen.getByText('Complete')).toBeVisible();
  });
});
