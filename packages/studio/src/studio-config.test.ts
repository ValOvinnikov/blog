import { migrationStateSchema } from '@blog/studio/schema-types/documents/system/migration-state';
import type { DocumentActionComponent, DocumentActionsContext } from 'sanity';

import { buildStudioConfig } from './studio-config';

// `sanity/structure`, `sanity-plugin-media`, `@sanity/vision` and
// `@sanity/code-input` pull in the Studio's UI dependency tree (down to
// `@sanity-labs/ui-poc`'s bundled CSS), which Node's loader can't parse
// under Vitest — mock them rather than load the real Studio UI for a test
// that only asserts config wiring. `vi.mock` calls are hoisted above the
// import above by Vitest's transform.
vi.mock('sanity/structure', () => ({
  structureTool: (options: unknown) => ({ name: 'structureTool', options }),
}));
vi.mock('sanity-plugin-media', () => ({
  media: () => ({ name: 'media' }),
}));
vi.mock('@sanity/vision', () => ({
  visionTool: () => ({ name: 'visionTool' }),
}));
vi.mock('@sanity/code-input', () => ({
  codeInput: () => ({ name: 'codeInput' }),
}));

describe(buildStudioConfig, () => {
  it('builds a config from the given projectId/dataset/title', () => {
    const config = buildStudioConfig({
      projectId: 'test-project',
      dataset: 'test-dataset',
      title: 'Test Studio',
    });

    expect(config.name).toBe('default');
    expect(config.title).toBe('Test Studio');
    expect(config.projectId).toBe('test-project');
    expect(config.dataset).toBe('test-dataset');
    expect(config.basePath).toBeUndefined();
  });

  it('sets basePath when provided', () => {
    const config = buildStudioConfig({
      projectId: 'test-project',
      dataset: 'test-dataset',
      basePath: '/dashboard/studio',
      title: 'Test Studio',
    });

    expect(config.basePath).toBe('/dashboard/studio');
  });

  it('hides the migrationState system ledger from document actions and the new-document menu', () => {
    const config = buildStudioConfig({
      projectId: 'test-project',
      dataset: 'test-dataset',
      title: 'Test Studio',
    });

    const actions = config.document?.actions;
    if (typeof actions !== 'function') {
      throw new Error('expected config.document.actions to be a function');
    }

    const prev: DocumentActionComponent[] = [];
    const context = {
      schemaType: migrationStateSchema.name,
    } as DocumentActionsContext;

    expect(actions(prev, context)).toEqual([]);
  });
});
