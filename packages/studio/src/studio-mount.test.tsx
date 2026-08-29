import { renderToStaticMarkup } from 'react-dom/server';

import { StudioMount } from './studio-mount';

// `StudioMount` calls `buildStudioConfig`, which imports `sanity/structure`,
// `sanity-plugin-media`, `@sanity/vision` and `@sanity/code-input` — these
// pull in the Studio's UI dependency tree (down to `@sanity-labs/ui-poc`'s
// bundled CSS), which Node's loader can't parse under Vitest. Mocked here
// for the same reason as `studio-config.test.ts`.
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

vi.mock('sanity', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('sanity');
  return {
    ...actual,
    StudioProvider: ({
      config,
      children,
    }: {
      config: {
        projectId: string;
        dataset: string;
        basePath?: string;
        title: string;
      };
      children: React.ReactNode;
    }) => (
      <div data-testid="studio-provider-mock">
        {config.projectId}:{config.dataset}:{config.basePath}:{config.title}
        {children}
      </div>
    ),
    StudioLayout: () => <div data-testid="studio-layout-mock" />,
  };
});

describe(StudioMount, () => {
  it('builds the config internally from plain string props and passes it to StudioProvider/StudioLayout', () => {
    const html = renderToStaticMarkup(
      <StudioMount
        projectId="test-project"
        dataset="test-dataset"
        basePath="/dashboard/studio"
        title="Test Studio"
      />,
    );

    expect(html).toContain(
      'test-project:test-dataset:/dashboard/studio:Test Studio',
    );
    expect(html).toContain('studio-layout-mock');
  });
});
