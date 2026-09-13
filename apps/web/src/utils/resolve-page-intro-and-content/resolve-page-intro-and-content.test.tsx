import type { ReactNode } from 'react';

import { resolvePageIntroAndContent } from './resolve-page-intro-and-content';

const { pageIntroMock, moduleRendererMock } = vi.hoisted(() => ({
  pageIntroMock: vi.fn(),
  moduleRendererMock: vi.fn(),
}));

vi.mock('@web/components/shared/page-intro', () => ({
  PageIntro: pageIntroMock,
}));

vi.mock('@web/modules/module-renderer', () => ({
  ModuleRenderer: moduleRendererMock,
}));

describe(resolvePageIntroAndContent.name, () => {
  beforeEach(() => {
    pageIntroMock.mockReset();
    moduleRendererMock.mockReset();
  });

  it('starts the intro and module fetches before either has resolved', async () => {
    let resolveIntro!: (node: ReactNode) => void;
    let resolveContent!: (node: ReactNode) => void;

    pageIntroMock.mockReturnValue(
      new Promise<ReactNode>((resolve) => {
        resolveIntro = resolve;
      }),
    );
    moduleRendererMock.mockReturnValue(
      new Promise<ReactNode>((resolve) => {
        resolveContent = resolve;
      }),
    );

    const resultPromise = resolvePageIntroAndContent({
      hero: { id: 'hero-1', type: 'module_hero' },
      headingBlock: { heading: 'Heading', supportingText: undefined },
      modules: [{ id: 'module-1', type: 'module_content' }],
      locale: 'en',
      tenant: 'tenant-1',
    });

    expect(pageIntroMock).toHaveBeenCalledTimes(1);
    expect(moduleRendererMock).toHaveBeenCalledTimes(1);

    resolveIntro(<h1 data-testid="intro">intro</h1>);
    resolveContent(<div data-testid="content">content</div>);

    await resultPromise;
  });

  it('resolves the hero/heading and the modules through PageIntro and ModuleRenderer', async () => {
    pageIntroMock.mockResolvedValue(<h1 data-testid="intro">intro</h1>);
    moduleRendererMock.mockResolvedValue(
      <div data-testid="content">content</div>,
    );

    const { intro, content } = await resolvePageIntroAndContent({
      hero: undefined,
      headingBlock: { heading: 'Heading', supportingText: undefined },
      hasTrailingSpace: false,
      modules: [],
      locale: 'en',
      tenant: 'tenant-1',
      context: { page: 2 },
    });

    expect(intro).toEqual(<h1 data-testid="intro">intro</h1>);
    expect(content).toEqual(<div data-testid="content">content</div>);
    expect(pageIntroMock).toHaveBeenCalledWith({
      hero: undefined,
      headingBlock: { heading: 'Heading', supportingText: undefined },
      hasTrailingSpace: false,
      locale: 'en',
      tenant: 'tenant-1',
    });
    expect(moduleRendererMock).toHaveBeenCalledWith({
      modules: [],
      locale: 'en',
      tenant: 'tenant-1',
      context: { page: 2 },
    });
  });
});
