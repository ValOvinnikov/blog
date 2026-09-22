import { renderToStaticMarkup } from 'react-dom/server';

import { StudioMount } from './studio-mount';

vi.mock('sanity/structure', () => ({
  structureTool: (options: unknown) => ({ name: 'structureTool', options }),
}));
vi.mock('sanity-plugin-media', () => ({
  media: () => ({ name: 'media' }),
  mediaAssetSource: { name: 'media', title: 'Media' },
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
