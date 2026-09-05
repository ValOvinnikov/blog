import { workflowRunUrl } from './workflow-run-url';

describe(workflowRunUrl, () => {
  it('builds the absolute run URL when every part is present', () => {
    const result = workflowRunUrl({
      serverUrl: 'https://github.com',
      repository: 'acme/blog',
      runId: '123456',
    });

    expect(result).toBe('https://github.com/acme/blog/actions/runs/123456');
  });

  it('returns undefined when serverUrl is missing', () => {
    const result = workflowRunUrl({
      serverUrl: undefined,
      repository: 'acme/blog',
      runId: '123456',
    });

    expect(result).toBeUndefined();
  });

  it('returns undefined when repository is missing', () => {
    const result = workflowRunUrl({
      serverUrl: 'https://github.com',
      repository: undefined,
      runId: '123456',
    });

    expect(result).toBeUndefined();
  });

  it('returns undefined when runId is missing', () => {
    const result = workflowRunUrl({
      serverUrl: 'https://github.com',
      repository: 'acme/blog',
      runId: undefined,
    });

    expect(result).toBeUndefined();
  });
});
